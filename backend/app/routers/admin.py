from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from app.models.user import User
from app.models.report import Report, ReportStatus
from app.models.ngo import NGO
from app.core.auth import require_ngo_or_admin, require_admin
from app.schemas.schemas import (
    ReportListItem, ReportDetail, UpdateReportRequest, NGOCreate, NGOResponse
)
from app.routers.reports import _to_list_item, _to_detail

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


# ─── Reports ─────────────────────────────────────────────────────────────────

@router.get("/reports", response_model=list[ReportListItem])
async def list_all_reports(
    status: Optional[str] = None,
    tier: Optional[str] = None,
    _: User = Depends(require_ngo_or_admin),
):
    query = Report.find()
    if status:
        query = Report.find(Report.status == status)
    if tier:
        query = Report.find(Report.urgency_tier == tier)
    reports = await query.sort(-Report.urgency_score).to_list()
    return [_to_list_item(r) for r in reports]


@router.get("/reports/{report_id}", response_model=ReportDetail)
async def get_report_detail(report_id: str, _: User = Depends(require_ngo_or_admin)):
    report = await Report.find_one(Report.report_id == report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return _to_detail(report)


@router.patch("/reports/{report_id}")
async def update_report(
    report_id: str,
    body: UpdateReportRequest,
    current_user: User = Depends(require_ngo_or_admin),
):
    report = await Report.find_one(Report.report_id == report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    update_data = {Report.updated_at: datetime.utcnow()}
    if body.status:
        update_data[Report.status] = body.status
        if body.status == ReportStatus.resolved:
            update_data[Report.resolved_at] = datetime.utcnow()
    if body.responder_name:
        update_data[Report.responder_name] = body.responder_name
    if body.vet_notes is not None:
        update_data[Report.vet_notes] = body.vet_notes
    if body.animal_rescued is not None:
        update_data[Report.animal_rescued] = body.animal_rescued

    await report.set(update_data)
    return {"status": "updated", "report_id": report_id}


@router.get("/dashboard")
async def dashboard_stats(_: User = Depends(require_ngo_or_admin)):
    total = await Report.count()
    pending = await Report.find(Report.status == "pending").count()
    in_progress = await Report.find(Report.status == "in_progress").count()
    resolved = await Report.find(Report.status == "resolved").count()
    critical = await Report.find(Report.urgency_tier == "CRITICAL").count()
    high = await Report.find(Report.urgency_tier == "HIGH").count()

    recent = await Report.find().sort(-Report.created_at).limit(5).to_list()
    recent_data = [
        {
            "report_id": r.report_id,
            "species": r.species,
            "urgency_tier": r.urgency_tier,
            "urgency_score": r.urgency_score,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
            "thumbnail_url": r.thumbnail_url,
            "address": r.address,
        }
        for r in recent
    ]

    return {
        "total": total,
        "pending": pending,
        "in_progress": in_progress,
        "resolved": resolved,
        "critical": critical,
        "high": high,
        "recent_reports": recent_data,
    }


# ─── NGOs ─────────────────────────────────────────────────────────────────────

@router.get("/ngos", response_model=list[NGOResponse])
async def list_ngos(_: User = Depends(require_ngo_or_admin)):
    ngos = await NGO.find_all().to_list()
    return [NGOResponse(id=str(n.id), name=n.name, city=n.city, contact_email=n.contact_email,
                        is_active=n.is_active, total_rescues=n.total_rescues) for n in ngos]


@router.post("/ngos", response_model=NGOResponse, status_code=201)
async def create_ngo(body: NGOCreate, _: User = Depends(require_admin)):
    ngo = NGO(**body.model_dump())
    await ngo.insert()
    return NGOResponse(id=str(ngo.id), name=ngo.name, city=ngo.city,
                       contact_email=ngo.contact_email, is_active=ngo.is_active,
                       total_rescues=ngo.total_rescues)


@router.patch("/ngos/{ngo_id}/toggle")
async def toggle_ngo(ngo_id: str, _: User = Depends(require_admin)):
    ngo = await NGO.get(ngo_id)
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    await ngo.set({NGO.is_active: not ngo.is_active})
    return {"is_active": not ngo.is_active}


# ─── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(_: User = Depends(require_admin)):
    users = await User.find_all().to_list()
    return [{"id": str(u.id), "name": u.name, "email": u.email,
             "role": u.role, "reports_submitted": u.reports_submitted} for u in users]


@router.patch("/users/{user_id}/role")
async def change_user_role(user_id: str, role: str, _: User = Depends(require_admin)):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await user.set({User.role: role})
    return {"status": "updated", "role": role}
