from beanie import Document
from pydantic import Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum


class ReportStatus(str, Enum):
    pending = "pending"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"


class UrgencyTier(str, Enum):
    monitor = "MONITOR"
    low = "LOW"
    medium = "MEDIUM"
    high = "HIGH"
    critical = "CRITICAL"


class Report(Document):
    model_config = ConfigDict(protected_namespaces=())

    report_id: str
    status: ReportStatus = ReportStatus.pending
    urgency_score: float = 0.0
    urgency_tier: UrgencyTier = UrgencyTier.monitor
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Reporter info
    user_id: str
    reporter_name: str
    reporter_email: str
    reporter_phone: Optional[str] = None

    # Location
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None

    # Media
    image_url: str
    thumbnail_url: Optional[str] = None

    # AI Analysis
    species: Optional[str] = None
    breed_estimate: Optional[str] = None
    detection_confidence: Optional[float] = None
    injury_class: Optional[int] = None
    injury_label: Optional[str] = None
    ai_confidence: Optional[float] = None
    is_juvenile: bool = False
    inference_time_ms: Optional[int] = None
    model_version: str = "yolov8m-v1 | effnetv2s-v1"

    # Description by reporter
    description: Optional[str] = None

    # Assignment
    assigned_ngo_id: Optional[str] = None
    assigned_ngo_name: Optional[str] = None
    assigned_ngo_email: Optional[str] = None
    assigned_at: Optional[datetime] = None
    responder_name: Optional[str] = None
    resolved_at: Optional[datetime] = None

    # Outcome
    animal_rescued: Optional[bool] = None
    vet_notes: Optional[str] = None

    class Settings:
        name = "reports"
