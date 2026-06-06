from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ─── Auth Schemas ──────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    is_ngo: bool = False


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    role: str


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    reports_submitted: int
    created_at: datetime


# ─── Report Schemas ────────────────────────────────────────────────────────────
class AIAnalysisResult(BaseModel):
    species: str
    breed_estimate: str
    detection_confidence: float
    injury_class: int
    injury_label: str
    ai_confidence: float
    moondream_text: Optional[str] = None
    is_juvenile: bool
    inference_time_ms: int


class ReportSubmitResponse(BaseModel):
    status: str
    report_id: str
    urgency_score: float
    urgency_tier: str
    ai_result: AIAnalysisResult
    message: str


class ReportListItem(BaseModel):
    id: str
    report_id: str
    status: str
    urgency_score: float
    urgency_tier: str
    species: Optional[str]
    injury_label: Optional[str]
    user_injury_label: Optional[str] = None
    image_url: str
    thumbnail_url: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    reporter_name: str
    created_at: datetime
    is_juvenile: bool
    assigned_ngo_name: Optional[str] = None


class ReportDetail(ReportListItem):
    description: Optional[str]
    reporter_email: str
    reporter_phone: Optional[str]
    detection_confidence: Optional[float]
    ai_confidence: Optional[float]
    assigned_ngo_name: Optional[str]
    assigned_at: Optional[datetime]
    responder_name: Optional[str]
    resolved_at: Optional[datetime]
    animal_rescued: Optional[bool]
    vet_notes: Optional[str]


class UpdateReportRequest(BaseModel):
    status: Optional[str] = None
    responder_name: Optional[str] = None
    vet_notes: Optional[str] = None
    animal_rescued: Optional[bool] = None


# ─── NGO Schemas ───────────────────────────────────────────────────────────────
class NGOCreate(BaseModel):
    name: str
    city: str
    coverage_radius_km: float = 20.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_email: EmailStr
    contact_phone: Optional[str] = None


class NGOResponse(BaseModel):
    id: str
    name: str
    city: str
    contact_email: str
    is_active: bool
    total_rescues: int
