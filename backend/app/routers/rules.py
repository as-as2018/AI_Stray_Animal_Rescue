from fastapi import APIRouter, HTTPException, Depends
from typing import List
from pydantic import BaseModel
from app.models.rule import RuleTier
from app.routers.auth import get_current_user
from app.models.user import User, UserRole
from app.services.urgency_score import refresh_rule_engine

router = APIRouter(prefix="/api/v1/rules", tags=["Rules"])

class RuleTierUpdate(BaseModel):
    base_score: int
    action: str
    conditions: List[str]

@router.get("/", response_model=List[RuleTier])
async def get_rules():
    return await RuleTier.find_all().to_list()

@router.put("/{tier_name}", response_model=RuleTier)
async def update_rule(tier_name: str, update_data: RuleTierUpdate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.super_admin:
        raise HTTPException(status_code=403, detail="Only Super Admins can modify the Rule Engine")
        
    tier = await RuleTier.find_one(RuleTier.tier_name == tier_name.upper())
    if not tier:
        raise HTTPException(status_code=404, detail="Tier not found")
        
    tier.base_score = update_data.base_score
    tier.action = update_data.action
    tier.conditions = [c.lower().replace(" ", "_") for c in update_data.conditions]
    await tier.save()
    
    # Trigger an immediate refresh of the AI's in-memory rule engine
    await refresh_rule_engine()
    
    return tier
