
import asyncio
from backend.database import SessionLocal
from backend.models import UserModel
from backend.auth import get_password_hash
from sqlalchemy import select, update

async def reset():
    print("Resetting admin password...")
    async with SessionLocal() as db:
        # Check if user exists first
        result = await db.execute(select(UserModel).where(UserModel.email == 'adminadmin@gmail.com'))
        user = result.scalars().first()
        
        hashed = get_password_hash("Password123")
        
        if user:
            print("User found. Updating password...")
            q = update(UserModel).where(UserModel.email == 'adminadmin@gmail.com').values(hashed_password=hashed)
            await db.execute(q)
        else:
            print("User not found. Creating admin user...")
            new_user = UserModel(
                id="admin_recovery",
                email="adminadmin@gmail.com",
                name="Deepmind Admin",
                hashed_password=hashed,
                role="admin",
                favorites=[]
            )
            db.add(new_user)
            
        await db.commit()
        print("Password reset for adminadmin@gmail.com to 'Password123'")

if __name__ == "__main__":
    asyncio.run(reset())
