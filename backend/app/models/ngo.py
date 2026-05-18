from beanie import Document
from pydantic import EmailStr, Field
from typing import Optional
from datetime import datetime


class NGO(Document):
    name: str
    city: str
    coverage_radius_km: float = 20.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    is_active: bool = True
    total_rescues: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "ngos"
