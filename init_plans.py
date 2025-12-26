
import asyncio
from backend.database import SessionLocal
from backend.models import PlanModel, engine, Base
from sqlalchemy import select

async def init_plans():
    print("Initializing Plans...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with SessionLocal() as db:
        # Check pro plan
        result = await db.execute(select(PlanModel).where(PlanModel.key == "pro_monthly"))
        existing = result.scalars().first()
        
        if not existing:
            print("Creating PRO Monthly Plan...")
            # NOTE: In production, these IDs come from your Stripe Dashboard
            # e.g. price_1Qxyz...
            plan = PlanModel(
                name="AdScale Pro Monthly",
                key="pro_monthly",
                stripe_product_id="prod_test_123", # Replace with real
                stripe_price_id="price_test_123",  # Replace with real
                features={"unlimited_ads": True, "ai_scanner": True}
            )
            db.add(plan)
            await db.commit()
            print("Plan created.")
        else:
            print("Plans already initialized.")

if __name__ == "__main__":
    asyncio.run(init_plans())
