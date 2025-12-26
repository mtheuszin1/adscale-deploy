
import asyncio
import sys
from backend.database import SessionLocal
from backend.models import UserModel
from sqlalchemy import select, update

async def list_and_promote(target_email=None):
    async with SessionLocal() as db:
        # LIST USERS
        print("\n--- ATUAL USUÁRIOS NO BANCO DE DADOS ---")
        result = await db.execute(select(UserModel))
        users = result.scalars().all()
        
        if not users:
            print("Nenhum usuário encontrado.")
            return

        for u in users:
            print(f"- {u.email} (Rol: {u.role}, ID: {u.id})")

        print("------------------------------------------")

        if not target_email:
            # If no email provided, maybe prompt or just exit?
            # Implements interactive prompt if running in TTY, else default to last user?
            # For automation safety, we require an argument or just promote the Last One if flag set.
            # Let's ask via Input if interactive.
            
            # NOTE: Tool execution is non-interactive.
            # I will Auto-Promote the LAST created user if no email given, as a convenience for the dev.
            target_user = users[-1]
            print(f"\n[AUTO-SELECTION] Promovendo o último usuário criado: {target_user.email}")
            target_email = target_user.email
        
        print(f"\nTentando promover: {target_email}...")
        
        q = update(UserModel).where(UserModel.email == target_email).values(role='admin')
        await db.execute(q)
        await db.commit()
        
        # Verify
        result = await db.execute(select(UserModel).where(UserModel.email == target_email))
        updated_user = result.scalars().first()
        if updated_user and updated_user.role == 'admin':
            print(f"SUCESSO: {updated_user.email} agora é ADMIN!")
        else:
            print("FALHA: Usuário não encontrado ou não atualizado.")

if __name__ == "__main__":
    email_arg = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(list_and_promote(email_arg))
