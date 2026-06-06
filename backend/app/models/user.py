from beanie import Document
from pydantic import EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import IntEnum

class UserRole(IntEnum):
    admin = 1
    user = 2
    ngo = 3


class User(Document):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password_hash: str
    role: UserRole = UserRole.user
    reports_submitted: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        indexes = ["email"]
