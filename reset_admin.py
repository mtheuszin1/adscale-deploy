
import asyncio
from backend.database import SessionLocal
from backend.models import UserModel
from backend.auth import get_password_hash
from sqlalchemy import select

async def reset():
    print("Resetting admin password with compatible hashing...")
    async with SessionLocal() as db:
        # Check if user exists first
        result = await db.execute(select(UserModel).where(UserModel.email == 'adminadmin@gmail.com'))
        user = result.scalars().first()
        
        # New password compatible with the new hashing scheme
        hashed = get_password_hash("Admin123")
        
        if user:
            print("User found. Updating password...")
            user.hashed_password = hashed
        else:
            print("User not found. Creating admin user...")
            new_user = UserModel(
                email="adminadmin@gmail.com",
                name="Admin User",
                hashed_password=hashed,
                role="admin",
                favorites=[]
            )
            db.add(new_user)
            
        await db.commit()
        print("Success! Admin created with email: adminadmin@gmail.com and password: Admin123")

if __name__ == "__main__":
    asyncio.run(reset())
