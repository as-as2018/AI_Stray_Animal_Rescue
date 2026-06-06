import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from app.models.user import User
from app.models.report import Report, ReportStatus
from app.models.ngo import NGO
from app.core.auth import get_current_user
from app.services.ml_inference import run_full_pipeline
from app.services.urgency_score import compute_urgency_score, get_urgency_tier, get_injury_class
from app.services.cloudinary_svc import upload_image
from app.services.email_svc import send_ngo_alert
import math
from app.schemas.schemas import ReportSubmitResponse, AIAnalysisResult, ReportListItem, ReportDetail
from app.config import get_settings

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


@router.post("/", response_model=ReportSubmitResponse, status_code=201)
async def submit_report(
    image: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    address: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    is_juvenile: bool = Form(False),
    moondream_text: Optional[str] = Form(None),
    ai_species: Optional[str] = Form(None),
    ai_injury_label: Optional[str] = Form(None),
    ai_confidence: Optional[float] = Form(None),
    user_injury_label: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
):
    settings = get_settings()
    image_bytes = await image.read()

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10 MB)")

    # 1. Upload to Cloudinary
    report_id = f"RPT-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    try:
        media = await upload_image(image_bytes, report_id)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 2. Run AI inference if not provided by frontend (fallback)
    if moondream_text and ai_injury_label:
        ai = {
            "moondream_text": moondream_text,
            "species": ai_species or "unknown",
            "injury_label": ai_injury_label,
            "ai_confidence": ai_confidence or 0.85,
            "detection_confidence": 0.85,
            "breed_estimate": f"Unknown {ai_species} breed" if ai_species else "N/A",
            "inference_time_ms": 0
        }
    else:
        import asyncio
        ai = await asyncio.to_thread(
            run_full_pipeline, image_bytes, settings.yolo_model_path
        )

    # 3. Compute urgency score using the user_injury_label if they corrected it, otherwise the AI's label
    active_label = user_injury_label if user_injury_label else ai.get("injury_label", "healthy")
    
    score = compute_urgency_score(
        injury_type=active_label,
        ai_confidence=ai.get("ai_confidence", 0.0),
        detection_confidence=ai.get("detection_confidence", 0.0),
        is_juvenile=is_juvenile,
    )
    tier = get_urgency_tier(score)

    # 4. Save report to DB
    report = Report(
        report_id=report_id,
        urgency_score=score,
        urgency_tier=tier,
        user_id=str(current_user.id),
        reporter_name=current_user.name,
        reporter_email=current_user.email,
        reporter_phone=current_user.phone,
        latitude=latitude,
        longitude=longitude,
        address=address,
        image_url=media["image_url"],
        thumbnail_url=media["thumbnail_url"],
        species=ai.get("species"),
        breed_estimate=ai.get("breed_estimate"),
        detection_confidence=ai.get("detection_confidence"),
        injury_class=get_injury_class(ai.get("injury_label", "healthy")),
        injury_label=ai.get("injury_label"),
        user_injury_label=user_injury_label,
        ai_confidence=ai.get("ai_confidence"),
        is_juvenile=is_juvenile,
        inference_time_ms=ai.get("inference_time_ms"),
        description=description,
        moondream_text=ai.get("moondream_text"),
    )
    await report.insert()

    # 5. Update user report count
    await current_user.set({User.reports_submitted: current_user.reports_submitted + 1})

    # 6. Find nearest active NGO using Haversine and send email alert
    nearest_ngo = None
    min_dist = float('inf')
    active_ngos = await NGO.find(NGO.is_active == True).to_list()

    if latitude is not None and longitude is not None:
        for n in active_ngos:
            if n.latitude is not None and n.longitude is not None:
                dist = haversine(latitude, longitude, n.latitude, n.longitude)
                if dist < min_dist and dist <= n.coverage_radius_km:
                    min_dist = dist
                    nearest_ngo = n
                    
    # Fallback to the first available NGO if no coordinates match or no GPS provided
    if not nearest_ngo and active_ngos:
        nearest_ngo = active_ngos[0]

    ngo = nearest_ngo
    if ngo:
        await report.set({
            Report.assigned_ngo_id: str(ngo.id),
            Report.assigned_ngo_name: ngo.name,
            Report.assigned_ngo_email: ngo.contact_email,
            Report.assigned_at: datetime.utcnow(),
            Report.status: ReportStatus.assigned,
        })
        dashboard_url = f"{settings.frontend_url}/admin/reports/{report_id}"
        await send_ngo_alert(
            ngo_email=ngo.contact_email,
            ngo_name=ngo.name,
            report_id=report_id,
            species=ai.get("species", "unknown"),
            injury_label=ai.get("injury_label", "Unknown"),
            urgency_score=score,
            urgency_tier=tier.value,
            address=address or "",
            image_url=media["image_url"],
            dashboard_url=dashboard_url,
        )

    return ReportSubmitResponse(
        status="success",
        report_id=report_id,
        urgency_score=score,
        urgency_tier=tier.value,
        ai_result=AIAnalysisResult(
            species=ai.get("species", "unknown"),
            breed_estimate=ai.get("breed_estimate", "N/A"),
            detection_confidence=ai.get("detection_confidence", 0.0),
            injury_class=ai.get("injury_class", 0),
            injury_label=ai.get("injury_label", "Healthy"),
            ai_confidence=ai.get("ai_confidence", 0.0),
            moondream_text=ai.get("moondream_text", ""),
            is_juvenile=is_juvenile,
            inference_time_ms=ai.get("inference_time_ms", 0),
        ),
        message=(
            f"Report submitted. {'NGO notified via email.' if ngo else 'No NGO assigned yet.'}"
        ),
    )

@router.post("/analyze-image", response_model=AIAnalysisResult)
async def analyze_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    settings = get_settings()
    image_bytes = await image.read()
    
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10 MB)")
        
    import asyncio
    ai = await asyncio.to_thread(
        run_full_pipeline, image_bytes, settings.yolo_model_path
    )
    
    return AIAnalysisResult(
        species=ai.get("species", "unknown"),
        breed_estimate=ai.get("breed_estimate", "N/A"),
        detection_confidence=ai.get("detection_confidence", 0.0),
        injury_class=get_injury_class(ai.get("injury_label", "healthy")),
        injury_label=ai.get("injury_label", "Healthy"),
        ai_confidence=ai.get("ai_confidence", 0.0),
        moondream_text=ai.get("moondream_text", ""),
        is_juvenile=False,
        inference_time_ms=ai.get("inference_time_ms", 0),
    )


@router.get("/")
async def my_reports(skip: int = 0, limit: int = 10, current_user: User = Depends(get_current_user)):
    query = Report.find(Report.user_id == str(current_user.id))
    total = await query.count()
    reports = await query.sort(-Report.created_at).skip(skip).limit(limit).to_list()
    return {
        "total": total,
        "items": [_to_list_item(r) for r in reports]
    }


@router.get("/{report_id}", response_model=ReportDetail)
async def get_report(report_id: str, current_user: User = Depends(get_current_user)):
    report = await Report.find_one(Report.report_id == report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.user_id != str(current_user.id) and current_user.role == "citizen":
        raise HTTPException(status_code=403, detail="Access denied")
    return _to_detail(report)


# ─── Helpers ──────────────────────────────────────────────────────────────────
def _to_list_item(r: Report) -> ReportListItem:
    return ReportListItem(
        id=str(r.id), report_id=r.report_id, status=r.status, urgency_score=r.urgency_score,
        urgency_tier=r.urgency_tier, species=r.species, injury_label=r.injury_label,
        user_injury_label=r.user_injury_label,
        image_url=r.image_url, thumbnail_url=r.thumbnail_url, latitude=r.latitude,
        longitude=r.longitude, address=r.address, reporter_name=r.reporter_name,
        created_at=r.created_at, is_juvenile=r.is_juvenile,
        assigned_ngo_name=r.assigned_ngo_name,
    )


def _to_detail(r: Report) -> ReportDetail:
    return ReportDetail(
        id=str(r.id), report_id=r.report_id, status=r.status, urgency_score=r.urgency_score,
        urgency_tier=r.urgency_tier, species=r.species, injury_label=r.injury_label,
        user_injury_label=r.user_injury_label,
        image_url=r.image_url, thumbnail_url=r.thumbnail_url, latitude=r.latitude,
        longitude=r.longitude, address=r.address, reporter_name=r.reporter_name,
        created_at=r.created_at, is_juvenile=r.is_juvenile, description=r.description,
        reporter_email=r.reporter_email, reporter_phone=r.reporter_phone,
        detection_confidence=r.detection_confidence, ai_confidence=r.ai_confidence,
        assigned_ngo_name=r.assigned_ngo_name, assigned_at=r.assigned_at,
        responder_name=r.responder_name, resolved_at=r.resolved_at,
        animal_rescued=r.animal_rescued, vet_notes=r.vet_notes,
    )
