import asyncio
from backend.database import SessionLocal
from backend.models import UserModel
from sqlalchemy import select

async def check():
    async with SessionLocal() as db:
        res = await db.execute(select(UserModel))
        users = res.scalars().all()
        print("USERS IN DB:")
        for u in users:
            print(f"Email: {u.email}, Role: {u.role}")

if __name__ == "__main__":
    asyncio.run(check())
