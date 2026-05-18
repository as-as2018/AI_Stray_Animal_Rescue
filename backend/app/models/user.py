from beanie import Document
from pydantic import EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    citizen = "citizen"
    ngo_admin = "ngo_admin"
    super_admin = "super_admin"


class User(Document):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password_hash: str
    role: UserRole = UserRole.citizen
    reports_submitted: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        indexes = ["email"]
