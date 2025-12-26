

import stripe
import os
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from .models import UserModel, TransactionModel, SubscriptionEventModel, CheckoutSettingsModel, SubscriptionModel, PlanModel

# ... imports ...


from .database import SessionLocal
import datetime
import json

# --- CONFIGURAÇÃO ---
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "sk_test_PLACEHOLDER")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_PLACEHOLDER")

stripe.api_key = STRIPE_SECRET_KEY

class BillingService:

    @staticmethod
    async def get_checkout_settings(db: AsyncSession):
        """Busca ou cria configurações padrão"""
        result = await db.execute(select(CheckoutSettingsModel))
        settings = result.scalars().first()
        if not settings:
            # Default fallback for initializing system
            settings = CheckoutSettingsModel(
                active=False, # System starts inactive for safety
                amount=9700,
                gateway="stripe",
                currency="brl",
                billing_type="subscription"
            )
            db.add(settings)
            await db.commit()
            await db.refresh(settings)
        return settings

    @staticmethod
    async def update_checkout_settings(db: AsyncSession, data: dict, user_id: str = None):
        settings = await BillingService.get_checkout_settings(db)
        
        # Update allowed fields
        if 'active' in data: settings.active = data['active']
        if 'amount' in data: settings.amount = data['amount']
        if 'gateway' in data: settings.gateway = data['gateway']
        if 'credentials' in data: settings.credentials = data['credentials']
        
        if user_id:
            settings.updated_by = user_id
        
        await db.commit()
        await db.refresh(settings)
        return settings
    
    @staticmethod
    async def get_all_transactions(db: AsyncSession, limit: int = 50):
        result = await db.execute(select(TransactionModel).order_by(TransactionModel.created_at.desc()).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def create_pix_payment_intent(db: AsyncSession, user_id: str):
        """
        Cria uma intenção de pagamento Pix REAL usando configurações do ADMIN HUB.
        """
        # 1. Carregar Configurações Ativas
        settings = await BillingService.get_checkout_settings(db)
        
        if not settings.active:
            raise HTTPException(status_code=503, detail="Checkout System is currently disabled by Admin.")

        if settings.gateway == 'stripe':
            return await BillingService._create_stripe_pix(db, user_id, settings)
        else:
             raise HTTPException(status_code=501, detail=f"Gateway {settings.gateway} not implemented.")

    @staticmethod
    async def _create_stripe_pix(db: AsyncSession, user_id: str, settings: CheckoutSettingsModel):
        if "PLACEHOLDER" in STRIPE_SECRET_KEY:
            raise HTTPException(status_code=501, detail="Stripe keys not configured.")

        # Validar Usuário
        result = await db.execute(select(UserModel).where(UserModel.id == user_id))
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Criar Customer se precisar
        if not user.stripe_customer_id:
            try:
                customer = stripe.Customer.create(email=user.email, name=user.name, metadata={"user_id": user.id})
                user.stripe_customer_id = customer.id
                await db.commit()
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Gateway Error (Customer): {str(e)}")

        try:
            # Valor configurado no Admin
            amount = settings.amount
            currency = settings.currency

            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency=currency,
                customer=user.stripe_customer_id,
                payment_method_types=['pix'],
                metadata={
                    "user_id": user.id,
                    "generated_by": "admin_hub_config",
                    "type": "subscription_start" 
                }
            )
            
            next_action = intent.get('next_action')
            if not next_action or 'pix_display_qr_code' not in next_action:
                 raise HTTPException(status_code=500, detail="Gateway did not generate Pix QR Code.")

            qr_data = next_action['pix_display_qr_code']
            
            # Persistência
            new_tx = TransactionModel(
                user_id=user.id,
                amount=amount/100.0,
                currency=currency,
                status="pending",
                payment_method="pix",
                gateway="stripe",
                stripe_payment_intent_id=intent.id, # Mapped to unified 'gateway_transaction_id' concept
                gateway_transaction_id=intent.id,
                qr_code=qr_data['data'],
                qr_code_url=qr_data['image_url_png']
            )
            db.add(new_tx)
            await db.commit()

            return {
                "transaction_id": intent.id,
                "qr_code_url": qr_data['image_url_png'],
                "qr_code_text": qr_data['data'],
                "expires_at": qr_data['expires_at'],
                "status": "pending",
                "amount": amount
            }

        except stripe.error.StripeError as e:
            raise HTTPException(status_code=500, detail=f"Gateway Error: {str(e)}")
        except Exception as e:
             await db.rollback()
             raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

    @staticmethod
    async def check_payment_status(db: AsyncSession, user_id: str, transaction_id: str):
        # Buscar Transação Local
        result = await db.execute(select(TransactionModel).where(TransactionModel.stripe_payment_intent_id == transaction_id))
        tx = result.scalars().first()
        
        if not tx:
             # Fallback Read-only
             try:
                intent = stripe.PaymentIntent.retrieve(transaction_id)
                if intent.status == 'succeeded':
                     return {"status": "succeeded", "amount": intent.amount}
                return {"status": "pending", "amount": intent.amount}
             except:
                raise HTTPException(status_code=404, detail="Transaction not found")
        
        if tx.user_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        return {
            "status": "succeeded" if tx.status == "paid" else tx.status,
            "amount": tx.amount,
            "currency": tx.currency
        }

    @staticmethod
    async def process_webhook(payload: bytes, sig_header: str):
        event = None

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            raise HTTPException(status_code=400, detail="Invalid signature")

        async with SessionLocal() as db:
            event_type = event['type']
            data = event['data']['object']
            
            audit = SubscriptionEventModel(
                stripe_event_id=event['id'],
                event_type=event_type,
                status_captured="received",
                payload=json.loads(json.dumps(data)) 
            )
            db.add(audit)
            
            if event_type == 'payment_intent.succeeded':
                await BillingService._handle_payment_success(db, data)
            elif event_type == 'payment_intent.payment_failed':
                await BillingService._handle_payment_failure(db, data)
            elif event_type == 'invoice.paid':
                await BillingService._handle_invoice_paid(db, data)
            elif event_type == 'customer.subscription.deleted':
                await BillingService._handle_subscription_deleted(db, data)
            
            await db.commit()

        return {"status": "success"}

    @staticmethod
    async def _handle_payment_success(db: AsyncSession, payment_intent):
        intent_id = payment_intent['id']
        
        result = await db.execute(select(TransactionModel).where(TransactionModel.stripe_payment_intent_id == intent_id))
        tx = result.scalars().first()
        
        if tx:
            tx.status = 'paid'
            tx.stripe_charge_id = payment_intent.get('latest_charge')
            tx.paid_at = datetime.datetime.utcnow()
            print(f"AUDIT: Transaction {tx.id} marked as PAID.")
        else:
            print(f"AUDIT WARN: Transaction {intent_id} not found locally during webhook.")

        user_id = payment_intent.get('metadata', {}).get('user_id')
        if not user_id:
            return

        result = await db.execute(select(UserModel).where(UserModel.id == user_id))
        user = result.scalars().first()
        if not user:
            return

        # 1. Update Legacy Fields
        user.subscriptionActive = True
        user.subscriptionPlan = "pro"
        user.nextBillingDate = datetime.datetime.utcnow() + datetime.timedelta(days=30)
        
        # 2. Update/Create REAL Subscription for Permissions
        # Find ANY plan to link to (FK constraint)
        plan_res = await db.execute(select(PlanModel))
        plan = plan_res.scalars().first()
        
        if not plan:
            # Create a fallback plan if system has none, to allow proper subscription creation
            plan = PlanModel(
                name="Pro Monthly (Pix)",
                key="pro_pix",
                stripe_product_id="prod_fallback",
                stripe_price_id="price_fallback",
                features={}
            )
            db.add(plan)
            await db.flush() # Get ID

        # Check existing sub
        sub_res = await db.execute(select(SubscriptionModel).where(SubscriptionModel.user_id == user.id))
        sub = sub_res.scalars().first()

        current_start = datetime.datetime.utcnow()
        current_end = current_start + datetime.timedelta(days=30)

        if sub:
            sub.status = 'active'
            sub.current_period_start = current_start
            sub.current_period_end = current_end
            sub.plan_id = plan.id
            # Use PaymentIntent as "Subscription ID" for one-time payments if it changes
            # Note: stored ID might be a real stripe sub ID if they had one before. 
            # If we overwrite it with a PI ID, it might break stripe sync if they switch back.
            # But for Pix Manual mode, this is acceptable.
            # sub.stripe_subscription_id = intent_id 
        else:
            sub = SubscriptionModel(
                user_id=user.id,
                plan_id=plan.id,
                stripe_subscription_id=intent_id, # Pseudo-ID
                stripe_customer_id=user.stripe_customer_id or "cust_unknown",
                status='active',
                current_period_start=current_start,
                current_period_end=current_end,
                cancel_at_period_end=True
            )
            db.add(sub)
            
        print(f"ACCESS GRANTED: User {user.email} is now PRO (Subscription Updated).")

    @staticmethod
    async def _handle_payment_failure(db: AsyncSession, payment_intent):
        intent_id = payment_intent['id']
        result = await db.execute(select(TransactionModel).where(TransactionModel.stripe_payment_intent_id == intent_id))
        tx = result.scalars().first()
        if tx:
            tx.status = 'failed'
            print(f"AUDIT: Transaction {tx.id} marked as FAILED.")

    @staticmethod
    async def _handle_invoice_paid(db: AsyncSession, invoice):
        # Handle recurring subscription payment success
        subscription_id = invoice.get('subscription')
        customer_id = invoice.get('customer')
        
        if not subscription_id:
            return

        # Find user by Stripe Customer ID
        result = await db.execute(select(UserModel).where(UserModel.stripe_customer_id == customer_id))
        user = result.scalars().first()
        
        if not user:
            print(f"AUDIT WARN: Invoice paid for unknown customer {customer_id}")
            return

        # Update User Status
        user.subscriptionActive = True
        user.nextBillingDate = datetime.datetime.fromtimestamp(invoice['lines']['data'][0]['period']['end'])
        
        # Update/Create Subscription Record
        sub_res = await db.execute(select(SubscriptionModel).where(SubscriptionModel.stripe_subscription_id == subscription_id))
        sub = sub_res.scalars().first()
        
        if sub:
            sub.status = 'active'
            sub.current_period_end = user.nextBillingDate
        else:
            # Create new if missing (maybe created via Stripe Dashboard)
            sub = SubscriptionModel(
                user_id=user.id,
                plan_id="plan_pro_recurring", # Placeholder
                stripe_subscription_id=subscription_id,
                stripe_customer_id=customer_id,
                status='active',
                current_period_start=datetime.datetime.utcnow(),
                current_period_end=user.nextBillingDate,
                cancel_at_period_end=False
            )
            db.add(sub)
        
        print(f"AUDIT: Invoice paid for User {user.email}. Access extended.")

    @staticmethod
    async def _handle_subscription_deleted(db: AsyncSession, subscription):
        # Handle cancellation/expiration
        subscription_id = subscription['id']
        
        sub_res = await db.execute(select(SubscriptionModel).where(SubscriptionModel.stripe_subscription_id == subscription_id))
        sub = sub_res.scalars().first()
        
        if sub:
            sub.status = 'canceled'
            sub.canceled_at = datetime.datetime.utcnow()
            
            # Find user and revoke access
            user_res = await db.execute(select(UserModel).where(UserModel.id == sub.user_id))
            user = user_res.scalars().first()
            if user:
                user.subscriptionActive = False
                user.subscriptionPlan = None
                print(f"AUDIT: Subscription deleted for User {user.email}. Access revoked.")
        else:
             print(f"AUDIT WARN: Deleted unknown subscription {subscription_id}")
