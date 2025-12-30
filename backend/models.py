
from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime
import uuid

# Helper to choose UUID type based on DB dialect (SQLite doesn't have native UUID)
def GUID():
    return String(36) 
    # In a real Pure-Postgres app we would use:
    # return UUID(as_uuid=True)
    # But for hybrid compatibility in this transition phase, String is safer for SQLite fallback.
    # For STRICT Postgres production, replace with UUID(as_uuid=True).

class AdModel(Base):
    __tablename__ = "ads"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    
    # Multi-tenancy support (Future proofing)
    owner_id = Column(String, index=True, nullable=True) 
    organization_id = Column(String, index=True, nullable=True)

    title = Column(String, index=True)
    brandId = Column(String)
    brandLogo = Column(String)
    platform = Column(String)
    niche = Column(String)
    type = Column(String)
    status = Column(String)
    
    # Using JSON for SQLite/PG compatibility, but ideally JSONB for Postgres
    tags = Column(JSON) 
    
    thumbnail = Column(String)
    mediaUrl = Column(String)
    mediaHash = Column(String)
    copy = Column(Text)
    cta = Column(String)
    insights = Column(Text)
    rating = Column(Float)
    
    # Timezone aware timestamp
    addedAt = Column(DateTime(timezone=True), default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())

    adCount = Column(Integer)
    ticketPrice = Column(String)
    funnelType = Column(String)
    salesPageUrl = Column(String)
    checkoutUrl = Column(String)
    libraryUrl = Column(String)
    
    performance = Column(JSON)
    siteTraffic = Column(JSON)
    techStack = Column(JSON)
    targeting = Column(JSON)
    forensicData = Column(JSON, nullable=True)
    
    # Advanced Intelligence Fields
    pixels = Column(JSON, default=[]) # List of detected pixel IDs
    tld = Column(String, index=True) # Domain TLD (e.g., .com.br, .shop)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "brandId": self.brandId,
            "brandLogo": self.brandLogo,
            "platform": self.platform,
            "niche": self.niche,
            "type": self.type,
            "status": self.status,
            "tags": self.tags,
            "thumbnail": self.thumbnail,
            "mediaUrl": self.mediaUrl,
            "mediaHash": self.mediaHash,
            "copy": self.copy,
            "cta": self.cta,
            "insights": self.insights,
            "rating": self.rating,
            "addedAt": self.addedAt.isoformat() if self.addedAt else None,
            "adCount": self.adCount,
            "ticketPrice": self.ticketPrice,
            "funnelType": self.funnelType,
            "salesPageUrl": self.salesPageUrl,
            "checkoutUrl": self.checkoutUrl,
            "libraryUrl": self.libraryUrl,
            "performance": self.performance,
            "siteTraffic": self.siteTraffic,
            "techStack": self.techStack,
            "targeting": self.targeting,
            "forensicData": self.forensicData,
            "pixels": self.pixels,
            "tld": self.tld
        }

class AdHistoryModel(Base):
    __tablename__ = "ad_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ad_id = Column(String, ForeignKey("ads.id"), nullable=False, index=True)
    
    adCount = Column(Integer, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=func.now())

    def to_dict(self):
        return {
            "adCount": self.adCount,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }

class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)
    role = Column(String, default="user")
    
    # Cloud / Multi-tenancy
    stripe_customer_id = Column(String, unique=True, index=True, nullable=True)
    tenant_id = Column(String, index=True, nullable=True)

    # Legacy fields (maintained for compatibility, but logic should move to Subscription table)
    subscriptionActive = Column(Boolean, default=False)
    subscriptionPlan = Column(String, nullable=True)
    nextBillingDate = Column(DateTime(timezone=True), nullable=True)
    
    favorites = Column(JSON, default=[])
    createdAt = Column(DateTime(timezone=True), default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "stripe_customer_id": self.stripe_customer_id,
            "subscriptionActive": self.subscriptionActive,
            "subscriptionPlan": self.subscriptionPlan,
            "nextBillingDate": self.nextBillingDate.isoformat() if self.nextBillingDate else None,
            "favorites": self.favorites,
            "createdAt": self.createdAt.isoformat() if self.createdAt else None
        }

# --- SAAS BILLING MODELS ---

class PlanModel(Base):
    __tablename__ = "plans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False) # e.g. "Pro Monthly"
    key = Column(String, unique=True, nullable=False) # e.g. "pro_monthly"
    
    stripe_product_id = Column(String, nullable=False)
    stripe_price_id = Column(String, nullable=False)
    
    # Feature Flags / Limits (JSONB)
    features = Column(JSON, default={}) 
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "key": self.key,
            "features": self.features,
            "priceId": self.stripe_price_id
        }

class SubscriptionModel(Base):
    __tablename__ = "subscriptions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    plan_id = Column(String, ForeignKey("plans.id"), nullable=False)
    
    stripe_subscription_id = Column(String, unique=True, nullable=False)
    stripe_customer_id = Column(String, nullable=False)
    
    # active, past_due, trialing, canceled, incomplete
    status = Column(String, nullable=False, index=True)
    
    current_period_start = Column(DateTime(timezone=True))
    current_period_end = Column(DateTime(timezone=True))
    cancel_at_period_end = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "planId": self.plan_id,
            "status": self.status,
            "currentPeriodEnd": self.current_period_end.isoformat() if self.current_period_end else None,
            "cancelAtPeriodEnd": self.cancel_at_period_end
        }

class SubscriptionEventModel(Base):
    __tablename__ = "subscription_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    subscription_id = Column(String, ForeignKey("subscriptions.id"))
    
    stripe_event_id = Column(String, unique=True, index=True)
    event_type = Column(String, nullable=False) # invoice.payment_succeeded
    status_captured = Column(String)
    
    payload = Column(JSON)
    processed_at = Column(DateTime(timezone=True), default=func.now())



class CheckoutSettingsModel(Base):
    __tablename__ = "checkout_settings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    active = Column(Boolean, default=True)
    gateway = Column(String, default="stripe") # stripe, asaas, pagarme
    amount = Column(Integer, nullable=False) # em centavos
    currency = Column(String, default="brl")
    billing_type = Column(String, default="subscription") # one_time, subscription
    
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    updated_by = Column(String, nullable=True)
    credentials = Column(JSON, default={}) # Stores gateway-specific keys (clientId, secret, etc)

    def to_dict(self):
        return {
            "id": self.id,
            "active": self.active,
            "gateway": self.gateway,
            "amount": self.amount,
            "currency": self.currency,
            "billingType": self.billing_type,
            "credentials": self.credentials or {}
        }

class TransactionModel(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    gateway = Column(String, nullable=False, default="stripe") # stripe, asaas
    gateway_transaction_id = Column(String, unique=True, index=True) # Unified ID
    
    amount = Column(Float, nullable=False) # Stored in database as float/decimal representation of the value
    currency = Column(String, default="brl")
    
    status = Column(String, nullable=False, default="pending", index=True) # pending, paid, failed, expired, refunded
    payment_method = Column(String, default="pix")
    
    # Legacy/Specific columns kept for safety/compatibility or detailed auditing if needed
    stripe_payment_intent_id = Column(String, nullable=True) 
    stripe_charge_id = Column(String, nullable=True)
    
    qr_code = Column(Text, nullable=True)
    qr_code_url = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "amount": self.amount,
            "status": self.status,
            "method": self.payment_method,
            "gateway": self.gateway,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "paidAt": self.paid_at.isoformat() if self.paid_at else None
        }



