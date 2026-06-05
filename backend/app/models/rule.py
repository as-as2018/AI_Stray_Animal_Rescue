from beanie import Document
from pydantic import Field
from typing import List

class RuleTier(Document):
    tier_name: str = Field(..., description="The name of the tier, e.g., 'MONITOR', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'")
    base_score: int = Field(..., description="The base urgency score for this tier")
    action: str = Field(..., description="The action to take for this tier")
    conditions: List[str] = Field(default_factory=list, description="A list of injuries or conditions that belong to this tier")

    class Settings:
        name = "rule_tiers"
