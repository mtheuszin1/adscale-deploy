
from fastapi import FastAPI, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from typing import List, Optional
import uuid
from fastapi.staticfiles import StaticFiles

import time
from dotenv import load_dotenv
import os

load_dotenv()

from .database import engine, Base, get_db
from .models import AdModel, UserModel, AdHistoryModel
from .tasks import import_ads_task, download_file
from .schemas import Ad, AdCreate, User, UserCreate, UserLogin, Token
from .auth import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_access_token
from .dependencies import get_current_user, get_current_admin


def log_to_file(msg):
    with open("backend_debug.log", "a") as f:
        f.write(f"{time.ctime()}: {msg}\n")

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    csv_file = "scalatracker_final.csv"
    if os.path.exists(csv_file):
        print(f"[Auto-Init] Found {csv_file}, triggering cleanup and turbo import...")
        try:
            # We run this in a thread to not block the main loop if its very slow
            import threading
            from clean_ads import clean_ads
            from bulk_importer import run_bulk_import
            
            def run_init():
                log_to_file("[Auto-Init] Starting full wipe...")
                clean_ads(full_wipe=True)
                log_to_file("[Auto-Init] Starting turbo import...")
                run_bulk_import(csv_file)
                log_to_file("[Auto-Init] Cleaning up failed downloads...")
                clean_ads(full_wipe=False) # Remove ads with external (broken) links
                log_to_file("[Auto-Init] Done.")
                if os.path.exists(csv_file):
                    os.rename(csv_file, f"{csv_file}.done")
            
            thread = threading.Thread(target=run_init)
            thread.start()
        except Exception as e:
            print(f"[Auto-Init] Critical error: {e}")


# Allow CORS for local development

# Strict CORS for production
origins_str = os.getenv("ALLOWED_ORIGINS", "")
origins = [origin.strip() for origin in origins_str.split(",") if origin.strip()]

# Auto-allow the known production domain and its variants
variants = [
    "https://adnuvem.com", 
    "http://adnuvem.com", 
    "https://www.adnuvem.com", 
    "http://www.adnuvem.com",
    "https://api.adnuvem.com",
    "http://localhost:5173",
    "http://72.60.2.62",
    "http://72.60.2.62:8000",
    "http://72.60.2.62:8001"
]
for v in variants:
    if v not in origins:
        origins.append(v)

print(f"DEBUG: Initializing CORS with allowed origins: {origins}")
log_to_file(f"CORS ORIGINS: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# --- MEDIA VAULT (Permanent Storage) ---
MEDIA_PATH = os.path.join(os.path.dirname(__file__), "media")
if not os.path.exists(MEDIA_PATH):
    os.makedirs(MEDIA_PATH, exist_ok=True)

app.mount("/media", StaticFiles(directory=MEDIA_PATH), name="media")

# --- SCANNER ---
from .tasks import scan_ad_task, import_ads_task

class ScanRequest(BaseModel):
    url: str

@app.post("/scan-ad")
async def scan_ad(request: ScanRequest, current_user = Depends(get_current_user)):
    try:
        # Try to use Celery
        task = scan_ad_task.delay(request.url)
        return {
            "task_id": task.id,
            "status": "processing", 
            "message": "Scan started in background"
        }
    except Exception as e:
        # FALLBACK: If Redis/Celery fails, run synchronously for LOCAL DEV
        log_to_file(f"Celery failed ({e}), falling back to sync scan")
        from .scanner import AdScanner
        scanner = AdScanner()
        result = scanner.scan_page(request.url)
        
        # We simulate a "mock" task_id for the frontend
        return {
            "task_id": "sync_mode",
            "status": "SUCCESS",
            "result": result
        }

@app.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    if task_id == "sync_mode":
        return {"task_id": "sync_mode", "status": "SUCCESS"}

    from celery.result import AsyncResult
    task_result = AsyncResult(task_id)
    
    result = {
        "task_id": task_id,
        "status": task_result.status,
    }
    
    if task_result.ready():
        result["result"] = task_result.result
        if task_result.status == "SUCCESS":
             # Extract structured data if it's the scanner
             pass
    
    return result

# --- LIFECYCLE ---
@app.on_event("startup")
async def startup():
    log_to_file("Backend starting up...")
    try:
        async with engine.begin() as conn:
            # Manual Migration for existing tables
            try:
                await conn.execute(text("ALTER TABLE ads ADD COLUMN IF NOT EXISTS pixels JSON DEFAULT '[]'"))
                await conn.execute(text("ALTER TABLE ads ADD COLUMN IF NOT EXISTS tld VARCHAR"))
                await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ads_tld ON ads (tld)"))
                log_to_file("Migration: pixels and tld columns verified/added.")
            except Exception as migrate_e:
                log_to_file(f"Migration notice (normal if already exists): {str(migrate_e)}")
                
            await conn.run_sync(Base.metadata.create_all)
        log_to_file("Database initialized.")
    except Exception as e:
        log_to_file(f"STARTUP ERROR: {str(e)}")

# --- AUTH ROUTES ---

@app.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    log_to_file(f"Registering user: {user_data.email}")
    try:
        result = await db.execute(select(UserModel).where(UserModel.email == user_data.email))
        existing = result.scalars().first()
        if existing:
            log_to_file(f"Registration failed: User {user_data.email} already exists")
            raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado.")
        log_to_file("User does not exist, proceeding with creation...")
    except Exception as e:
        log_to_file(f"Error checking existing user: {str(e)}")
        raise e
    
    # Create user
    new_id = str(uuid.uuid4())
    hashed = get_password_hash(user_data.password)
    # SECURITY FIX: Remove automatic admin based on email
    role = "user"
    
    db_user = UserModel(
        id=new_id,
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed,
        role=role,
        favorites=[]
    )
    db.add(db_user)
    try:
        await db.commit()
        await db.refresh(db_user)
        log_to_file(f"User {db_user.email} created successfully.")
    except Exception as e:
        await db.rollback()
        log_to_file(f"DATABASE COMMIT ERROR for {user_data.email}: {str(e)}")
        # Check if it was a race condition
        result = await db.execute(select(UserModel).where(UserModel.email == user_data.email))
        existing = result.scalars().first()
        if existing:
             log_to_file(f"Race condition: User {user_data.email} exists now.")
             raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado.")
        raise HTTPException(status_code=500, detail="Erro interno ao criar conta.")
    
    # Create tokens
    access_token = create_access_token(data={"sub": db_user.email})
    refresh_token = create_refresh_token(data={"sub": db_user.email})
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer", 
        "user": db_user.to_dict()
    }

@app.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserModel).where(UserModel.email == user_data.email))
    user = result.scalars().first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer", 
        "user": user.to_dict()
    }

class RefreshRequest(BaseModel):
    refresh_token: str

@app.post("/auth/refresh", response_model=Token)
async def refresh_token(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_access_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token subject")
        
    # Check if user still exists/active
    result = await db.execute(select(UserModel).where(UserModel.email == email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access_token = create_access_token(data={"sub": user.email})
    # Optional: Rotate refresh token? For now keeping it simple (reuse unless expired)
    # But for better security let's issue a new one too
    new_refresh_token = create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": user.to_dict()
    }

@app.get("/me", response_model=User)
async def read_users_me(current_user = Depends(get_current_user)):
    return current_user.to_dict()

@app.post("/emergency-promote")
async def emergency_promote(current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    current_user.role = "admin"
    db.add(current_user)
    await db.commit()
    return {"status": "promoted", "role": current_user.role}

@app.get("/users", response_model=List[User])
async def get_users(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_admin)):
    result = await db.execute(select(UserModel))
    users = result.scalars().all()
    return [u.to_dict() for u in users]


from fastapi import Request
from .billing import BillingService

# ... existing imports ...

# --- BILLING ROUTES ---



# --- BILLING ROUTES ---

class CheckoutRequest(BaseModel):
    pass # No input required, config is server-side

@app.post("/pay/pix")
async def create_pix_payment(req: CheckoutRequest, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    return await BillingService.create_pix_payment_intent(db, current_user.id)

@app.get("/pay/status/{tx_id}")
async def check_status(tx_id: str, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    return await BillingService.check_payment_status(db, current_user.id, tx_id)

@app.post("/webhook")
async def webhook_received(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    return await BillingService.process_webhook(payload, sig_header)

# --- ADMIN HUB ROUTES ---
from typing import Dict, Any

@app.get("/admin/checkout")
async def get_admin_checkout_settings(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_admin)):
    settings = await BillingService.get_checkout_settings(db)
    return settings.to_dict()

@app.put("/admin/checkout")
async def update_admin_checkout_settings(data: Dict[str, Any], db: AsyncSession = Depends(get_db), current_user = Depends(get_current_admin)):
    settings = await BillingService.update_checkout_settings(db, data, user_id=current_user.email)
    return settings.to_dict()

@app.get("/admin/transactions")
async def get_admin_transactions(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_admin)):
    txs = await BillingService.get_all_transactions(db)
    return [tx.to_dict() for tx in txs]

@app.get("/public/checkout-config")
async def get_public_checkout_config(db: AsyncSession = Depends(get_db)):
    settings = await BillingService.get_checkout_settings(db)
    # Return minimal public info
    return {
        "active": settings.active,
        "amount": settings.amount / 100.0, # Convert to float
        "currency": settings.currency,
        "billingType": settings.billing_type
    }

@app.get("/checkout/public-config")
async def get_public_checkout_config_compliant(db: AsyncSession = Depends(get_db)):
    return await get_public_checkout_config(db)


# --- AD ROUTES (Public) ---

from .permissions import verify_subscription_access


@app.get("/ads", response_model=List[Ad])
async def get_ads(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AdModel).order_by(AdModel.addedAt.desc()))
    ads = result.scalars().all()
    return [ad.to_dict() for ad in ads]

# --- AD ROUTES (Protected/Admin) ---

@app.post("/ads", response_model=Ad)
async def create_ad(ad: AdCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_admin)):
    ad_data = ad.dict()
    # Check if exists
    result = await db.execute(select(AdModel).where(AdModel.id == ad.id))
    existing = result.scalars().first()
    if existing:
        # Update
        for key, value in ad_data.items():
            setattr(existing, key, value)
        await db.commit()
        await db.refresh(existing)
        return existing.to_dict()
    
    # Persistence Logic for Single Create
    original_media = ad_data.get('mediaUrl')
    if original_media:
        # Run blocking I/O in threadpool to keep API responsive
        local_path = await run_in_threadpool(download_file, original_media, ad_data['id'])
        if local_path:
            ad_data['mediaUrl'] = local_path
            if ad_data.get('thumbnail') == original_media:
                ad_data['thumbnail'] = local_path

    db_ad = AdModel(**ad_data)
    db.add(db_ad)
    await db.commit()
    await db.refresh(db_ad)
    
    # Record Initial History (Fail-safe)
    try:
        history = AdHistoryModel(ad_id=db_ad.id, adCount=db_ad.adCount)
        db.add(history)
        await db.commit()
    except Exception as e:
        log_to_file(f"HISTORY SAVE FAILED for {db_ad.id}: {e}")
        # Suppress error so user gets success

    
    return db_ad.to_dict()

@app.post("/ads/import")
async def import_ads(ads: List[AdCreate], current_user = Depends(get_current_admin)):
    ads_data = [ad.dict() for ad in ads]
    log_to_file(f"Import request received for {len(ads_data)} ads")
    
    # Run synchronously so the frontend waits for completion
    # Run synchronously in a thread so the frontend waits for completion without blocking the server
    result = await run_in_threadpool(import_ads_task, ads_data)
    
    return {
        "success": True, 
        "message": "Importação concluída.",
        "count": len(ads),
        "details": result
    }

@app.put("/ads/{ad_id}", response_model=Ad)
async def update_ad(ad_id: str, ad: AdCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AdModel).where(AdModel.id == ad_id))
    db_ad = result.scalars().first()
    if not db_ad:
        raise HTTPException(status_code=404, detail="Ad not found")
    
    ad_data = ad.dict()
    for key, value in ad_data.items():
        setattr(db_ad, key, value)
        
    await db.commit()
    await db.refresh(db_ad)
    return db_ad.to_dict()

@app.delete("/ads/{ad_id}")
async def delete_ad(ad_id: str, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_admin)):
    result = await db.execute(select(AdModel).where(AdModel.id == ad_id))
    ad = result.scalars().first()
    if ad:
        await db.delete(ad)
        await db.commit()
        return {"ok": True}
    raise HTTPException(status_code=404, detail="Ad not found")

@app.post("/ads/batch-delete")
async def batch_delete_ads(ad_ids: List[str], db: AsyncSession = Depends(get_db), current_user = Depends(get_current_admin)):
    try:
        from sqlalchemy import delete
        await db.execute(delete(AdModel).where(AdModel.id.in_(ad_ids)))
        await db.commit()
        return {"ok": True, "count": len(ad_ids)}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ads/clear")
async def clear_all_ads(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_admin)):
    try:
        from sqlalchemy import delete
        await db.execute(delete(AdHistoryModel))
        await db.execute(delete(AdModel))
        await db.commit()
        # Also clean up the media folder
        import shutil
        if os.path.exists(MEDIA_PATH):
            shutil.rmtree(MEDIA_PATH)
            os.makedirs(MEDIA_PATH, exist_ok=True)
        return {"ok": True, "message": "All ads and media cleared"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# --- AI & ANALYTICS ROUTES ---

from .ai_engine import ai_engine

class AICopyRequest(BaseModel):
    ad_id: str
    tone: Optional[str] = "aggressive"

@app.post("/ai/generate-copy")
async def generate_ai_copy(req: AICopyRequest, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    result = await db.execute(select(AdModel).where(AdModel.id == req.ad_id))
    ad = result.scalars().first()
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")
    
    variations = await ai_engine.generate_copy(ad.copy, ad.niche, req.tone)
    return {"variations": variations}

@app.get("/ads/{ad_id}/history")
async def get_ad_history(ad_id: str, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    result = await db.execute(select(AdHistoryModel).where(AdHistoryModel.ad_id == ad_id).order_by(AdHistoryModel.timestamp.asc()))
    history = result.scalars().all()
    return [h.to_dict() for h in history]

@app.get("/ai/strategic-decode/{ad_id}")
async def strategic_decode_ad(ad_id: str, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    result = await db.execute(select(AdModel).where(AdModel.id == ad_id))
    ad = result.scalars().first()
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")
    
    decode = await ai_engine.strategic_decode(ad.copy, ad.niche)
    return decode

@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.time()
    origin = request.headers.get("origin")
    method = request.method
    path = request.url.path
    log_to_file(f"Request started: {method} {path} (Origin: {origin})")
    
    response = await call_next(request)
    duration = time.time() - start_time
    log_to_file(f"Request finished: {method} {path} - {response.status_code} ({duration:.2f}s)")
    return response

@app.get("/")
async def root():
    return {"status": "ok", "service": "adscale-api"}

@app.get("/test-db")
async def test_db(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    try:
        start = time.time()
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "time": time.time() - start}
    except Exception as e:
        return {"status": "error", "error": str(e)}
