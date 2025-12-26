
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# Default to SQLite for local dev if ENV var not set, but support Postgres
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./adscale.db")

# Postgres requires different connection args (no check_same_thread)
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

# Pool configuration for Production (Postgres)
engine_kwargs = {
    "echo": False, # Set to False in production
    "connect_args": connect_args,
}

if "postgresql" in DATABASE_URL:
    engine_kwargs["pool_size"] = 20
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_pre_ping"] = True

engine = create_async_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# --- SYNCHRONOUS SETUP FOR CELERY WORKERS ---
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker as sync_sessionmaker

# Convert async url to sync url (hacky but works for standard drivers)
# sqlite+aiosqlite -> sqlite
# postgresql+asyncpg -> postgresql+psycopg2 (or just postgresql)
SYNC_DATABASE_URL = DATABASE_URL.replace("+aiosqlite", "").replace("+asyncpg", "")
# Ensure we use psycopg2 for postgres if not specified
if "postgresql" in SYNC_DATABASE_URL and "psycopg2" not in SYNC_DATABASE_URL:
     # If it was just postgresql:// it defaults to psycopg2 usually, but let's be safe if we stripped asyncpg
     pass

sync_engine = create_engine(SYNC_DATABASE_URL, echo=False)
SyncSessionLocal = sync_sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

def get_sync_db():
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()
