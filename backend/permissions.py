from fastapi import Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from .models import UserModel, SubscriptionModel
from .database import get_db
from datetime import datetime

from .dependencies import get_current_user

async def verify_subscription_access(current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Middleware-like dependency to block access if subscription is inactive.
    Admins bypass this check.
    """
    if current_user.role == 'admin':
        return True

    # 1. Fetch Active Subscription
    # Use proper logic based on status and dates
    result = await db.execute(
        select(SubscriptionModel).where(
            SubscriptionModel.user_id == current_user.id
        )
    )
    subscriptions = result.scalars().all()
    
    # Filter for valid subscription
    # Valid statuses: active, trialing
    # Incomplete/Past_due might be valid depending on grace period, handled below
    valid_sub = None
    
    for sub in subscriptions:
        if sub.status in ['active', 'trialing']:
            valid_sub = sub
            break
        elif sub.status == 'past_due' or sub.status == 'canceled':
            # Check if period end is in future (Grace period or paid until end of month)
            if sub.current_period_end and sub.current_period_end > datetime.utcnow():
                valid_sub = sub
                break

    if not valid_sub:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Subscription required to access this resource."
        )

    return True
