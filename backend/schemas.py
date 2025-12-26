
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any, Dict

# --- ADS SCHEMAS ---
class AdBase(BaseModel):
    id: str
    title: Optional[str] = None
    brandId: Optional[str] = None
    brandLogo: Optional[str] = None
    platform: Optional[str] = "Meta Ads"
    niche: Optional[str] = "Business"
    type: Optional[str] = "Image"
    status: Optional[str] = "Active"
    tags: List[str] = []
    thumbnail: Optional[str] = None
    mediaUrl: Optional[str] = None
    mediaHash: Optional[str] = None
    copy: Optional[str] = None
    cta: Optional[str] = "Learn More"
    insights: Optional[str] = None
    rating: Optional[float] = 0.0
    adCount: Optional[int] = 1
    ticketPrice: Optional[str] = None
    funnelType: Optional[str] = None
    salesPageUrl: Optional[str] = None
    checkoutUrl: Optional[str] = None
    libraryUrl: Optional[str] = None
    performance: Optional[Dict[str, Any]] = {}
    siteTraffic: Optional[Dict[str, Any]] = {}
    techStack: Optional[Dict[str, Any]] = {}
    targeting: Optional[Dict[str, Any]] = {}
    forensicData: Optional[Dict[str, Any]] = None

class AdCreate(AdBase):
    pass

class Ad(AdBase):
    addedAt: str

    class Config:
        from_attributes = True

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str
    role: str
    subscriptionActive: bool
    subscriptionPlan: Optional[str] = None
    nextBillingDate: Optional[str] = None
    favorites: List[str] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: User
