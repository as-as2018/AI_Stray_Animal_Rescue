from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from app.models.user import User
from app.models.report import Report
from app.models.ngo import NGO
from app.core.auth import require_ngo_or_admin
from app.routers.reports import _to_list_item

router = APIRouter(prefix="/api/v1/ngo", tags=["NGO Portal"])

async def get_current_ngo(current_user: User = Depends(require_ngo_or_admin)):
    ngo = await NGO.find_one(NGO.contact_email == current_user.email)
    if not ngo:
        raise HTTPException(status_code=404, detail="Your account is not linked to any registered NGO profile. Please contact the administrator.")
    return ngo

async def get_active_ngo(ngo: NGO = Depends(get_current_ngo)):
    if not ngo.is_active:
        raise HTTPException(status_code=403, detail="Your NGO profile is pending verification from the Super Admin. Please ensure your profile is complete.")
    return ngo

@router.get("/me")
async def get_ngo_profile(ngo: NGO = Depends(get_current_ngo)):
    return {
        "id": str(ngo.id),
        "name": ngo.name,
        "city": ngo.city,
        "latitude": ngo.latitude,
        "longitude": ngo.longitude,
        "coverage_radius_km": ngo.coverage_radius_km,
        "is_active": ngo.is_active,
        "contact_email": ngo.contact_email
    }

@router.patch("/profile")
async def update_ngo_profile(
    name: str = Body(...),
    city: str = Body(...),
    latitude: float = Body(...),
    longitude: float = Body(...),
    coverage_radius_km: float = Body(...),
    ngo: NGO = Depends(get_current_ngo)
):
    await ngo.set({
        NGO.name: name,
        NGO.city: city,
        NGO.latitude: latitude,
        NGO.longitude: longitude,
        NGO.coverage_radius_km: coverage_radius_km
    })
    return {"status": "success", "message": "Profile updated successfully"}

@router.get("/dashboard")
async def get_ngo_dashboard(ngo: NGO = Depends(get_active_ngo)):
    total = await Report.find(Report.assigned_ngo_id == str(ngo.id)).count()
    pending = await Report.find(Report.assigned_ngo_id == str(ngo.id), Report.status == "pending").count()
    assigned = await Report.find(Report.assigned_ngo_id == str(ngo.id), Report.status == "assigned").count()
    in_progress = await Report.find(Report.assigned_ngo_id == str(ngo.id), Report.status == "in_progress").count()
    resolved = await Report.find(Report.assigned_ngo_id == str(ngo.id), Report.status == "resolved").count()
    
    critical = await Report.find(Report.assigned_ngo_id == str(ngo.id), Report.urgency_tier == "CRITICAL").count()
    high = await Report.find(Report.assigned_ngo_id == str(ngo.id), Report.urgency_tier == "HIGH").count()

    return {
        "total": total,
        "pending": pending + assigned,
        "in_progress": in_progress,
        "resolved": resolved,
        "critical": critical,
        "high": high,
        "ngo_name": ngo.name,
        "ngo_city": ngo.city,
        "total_rescues": ngo.total_rescues
    }

@router.get("/reports")
async def list_ngo_reports(
    status: Optional[str] = None,
    tier: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 10,
    sort_by: str = "urgency_score",
    sort_order: str = "desc",
    ngo: NGO = Depends(get_active_ngo)
):
    query = Report.find(Report.assigned_ngo_id == str(ngo.id))
    
    if status:
        query = query.find(Report.status == status)
    if tier:
        query = query.find(Report.urgency_tier == tier)
    if search:
        query = query.find({"$or": [
            {"report_id": {"$regex": search, "$options": "i"}},
            {"species": {"$regex": search, "$options": "i"}},
            {"injury_label": {"$regex": search, "$options": "i"}},
            {"address": {"$regex": search, "$options": "i"}},
            {"reporter_name": {"$regex": search, "$options": "i"}}
        ]})
        
    total = await query.count()
    sort_prefix = "-" if sort_order == "desc" else "+"
    reports = await query.sort(sort_prefix + sort_by).skip(skip).limit(limit).to_list()
    return {
        "total": total,
        "items": [_to_list_item(r) for r in reports]
    }
