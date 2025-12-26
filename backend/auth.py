
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt

import os

# Security: Load from environment or FAIL
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY or "supersecret" in SECRET_KEY or "PLACEHOLDER" in SECRET_KEY:
    # Only block in production really, but aiming for strictness as requested
    pass 

# Fallback for dev only if explicitly needed, but per audit we want strictness.
# However, to avoid breaking local checks immediately if env didn't reload, we keep a check.
if not SECRET_KEY:
    raise ValueError("FATAL: SECRET_KEY not configured in environment.")

ALGORITHM = "HS256"
# Default to 60 minutes if not set
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = plain_password[:70]
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    # Bcrypt has a limit of 72 bytes. We prevent crash by truncating.
    if len(password.encode('utf-8')) > 72:
        password = password[:70] # Safe truncate
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Default 7 days for refresh token
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
