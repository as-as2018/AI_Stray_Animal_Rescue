from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
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

@router.get("/reports")
async def list_all_reports(
    status: Optional[str] = None,
    tier: Optional[str] = None,
    search: Optional[str] = None,
    ngo_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 10,
    sort_by: str = "urgency_score",
    sort_order: str = "desc",
    _: User = Depends(require_ngo_or_admin),
):
    query = Report.find()
    if status:
        query = Report.find(Report.status == status)
    if tier:
        query = query.find(Report.urgency_tier == tier)
    if search:
        query = query.find({"$or": [
            {"report_id": {"$regex": search, "$options": "i"}},
            {"species": {"$regex": search, "$options": "i"}},
            {"injury_label": {"$regex": search, "$options": "i"}},
            {"address": {"$regex": search, "$options": "i"}},
            {"reporter_name": {"$regex": search, "$options": "i"}},
            {"assigned_ngo_name": {"$regex": search, "$options": "i"}}
        ]})
    if ngo_id:
        query = query.find(Report.assigned_ngo_id == ngo_id)
        
    total = await query.count()
    sort_prefix = "-" if sort_order == "desc" else "+"
    reports = await query.sort(sort_prefix + sort_by).skip(skip).limit(limit).to_list()
    return {
        "total": total,
        "items": [_to_list_item(r) for r in reports]
    }


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

@router.patch("/reports/{report_id}/tier")
async def update_report_tier(
    report_id: str,
    tier: str = Body(..., embed=True),
    current_user: User = Depends(require_ngo_or_admin),
):
    report = await Report.find_one(Report.report_id == report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # RLHF logic: If the admin corrects the AI's predicted tier, capture it as a reward signal
    if report.moondream_text and report.urgency_tier.value != tier:
        import os
        import json
        rlhf_file = os.path.join(os.path.dirname(__file__), '..', '..', 'custome_model', 'rlhf_dataset.json')
        
        tier_mapping = {"MONITOR": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
        if tier in tier_mapping:
            label = tier_mapping[tier]
            new_entry = {"text": report.moondream_text, "label": label}
            
            rlhf_data = []
            if os.path.exists(rlhf_file):
                try:
                    with open(rlhf_file, 'r') as f:
                        rlhf_data = json.load(f)
                except Exception:
                    pass
                    
            rlhf_data.append(new_entry)
            with open(rlhf_file, 'w') as f:
                json.dump(rlhf_data, f, indent=4)
                
    await report.set({Report.urgency_tier: tier, Report.updated_at: datetime.utcnow()})
    return {"status": "tier_updated", "new_tier": tier}


@router.get("/dashboard")
async def dashboard_stats(_: User = Depends(require_ngo_or_admin)):
    total = await Report.count()
    pending = await Report.find(Report.status == "pending").count()
    in_progress = await Report.find(Report.status == "in_progress").count()
    resolved = await Report.find(Report.status == "resolved").count()
    critical = await Report.find(Report.urgency_tier == "CRITICAL").count()
    high = await Report.find(Report.urgency_tier == "HIGH").count()
    
    total_users = await User.find(User.role == 2).count()
    total_ngos = await NGO.count()
    active_ngos = await NGO.find(NGO.is_active == True).count()

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
        "total_users": total_users,
        "total_ngos": total_ngos,
        "active_ngos": active_ngos,
        "recent_reports": recent_data,
    }


# ─── NGOs ─────────────────────────────────────────────────────────────────────

@router.get("/ngos")
async def list_ngos(
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 10,
    _: User = Depends(require_ngo_or_admin)
):
    query = NGO.find()
    
    if status:
        is_active = (status == "active")
        query = query.find(NGO.is_active == is_active)

    if search:
        query = query.find({"$or": [
            {"name": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}},
            {"contact_email": {"$regex": search, "$options": "i"}},
            {"contact_phone": {"$regex": search, "$options": "i"}}
        ]})
        
    total = await query.count()
    sort_prefix = "-" if sort_order == "desc" else "+"
    ngos = await query.sort(sort_prefix + sort_by).skip(skip).limit(limit).to_list()
    return {
        "total": total,
        "items": [NGOResponse(id=str(n.id), name=n.name, city=n.city, contact_email=n.contact_email,
                        is_active=n.is_active, total_rescues=n.total_rescues) for n in ngos]
    }


@router.get("/ngos/{ngo_id}")
async def get_ngo_detail(ngo_id: str, _: User = Depends(require_admin)):
    ngo = await NGO.get(ngo_id)
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    return {
        "id": str(ngo.id),
        "name": ngo.name,
        "city": ngo.city,
        "contact_email": ngo.contact_email,
        "contact_phone": ngo.contact_phone,
        "latitude": ngo.latitude,
        "longitude": ngo.longitude,
        "coverage_radius_km": ngo.coverage_radius_km,
        "is_active": ngo.is_active,
        "total_rescues": ngo.total_rescues
    }


@router.post("/ngos", response_model=NGOResponse, status_code=201)
async def create_ngo(body: NGOCreate, _: User = Depends(require_admin)):
    ngo = NGO(**body.model_dump())
    await ngo.insert()
    return NGOResponse(id=str(ngo.id), name=ngo.name, city=ngo.city,
                       contact_email=ngo.contact_email, is_active=ngo.is_active,
                       total_rescues=ngo.total_rescues)


@router.patch("/ngos/{ngo_id}/toggle")
async def toggle_ngo_status(ngo_id: str, _: User = Depends(require_admin)):
    ngo = await NGO.get(ngo_id)
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
        
    if not ngo.is_active and (ngo.latitude is None or ngo.longitude is None):
        raise HTTPException(status_code=400, detail="Cannot activate an NGO with missing geographic coordinates. The NGO must complete their profile first.")
        
    await ngo.set({NGO.is_active: not ngo.is_active})
    return {"status": "success", "is_active": not ngo.is_active}


# ─── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 10,
    _: User = Depends(require_admin)
):
    query = User.find()
    if search:
        query = query.find({"$or": [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]})
        
    total = await query.count()
    users = await query.skip(skip).limit(limit).to_list()
    return {
        "total": total,
        "items": [{"id": str(u.id), "name": u.name, "email": u.email,
              "role": u.role.value, "reports_submitted": u.reports_submitted} for u in users]
    }


@router.patch("/users/{user_id}/role")
async def change_user_role(user_id: str, role: str, _: User = Depends(require_admin)):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await user.set({User.role: role})
    return {"status": "updated", "role": role}
