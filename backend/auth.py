
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt

import os

# Security: Load from environment or FAIL
# Security: Load from environment
SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    print("WARNING: SECRET_KEY not configured in environment. Using insecure fallback.")
    SECRET_KEY = "dev_fallback_insecure_key_123"
elif "supersecret" in SECRET_KEY or "PLACEHOLDER" in SECRET_KEY:
    print("WARNING: Insecure SECRET_KEY detected.")

ALGORITHM = "HS256"
# Default to 60 minutes if not set
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
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
