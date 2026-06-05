import motor.motor_asyncio
import beanie
from app.config import get_settings
from app.models.user import User
from app.models.report import Report
from app.models.ngo import NGO
from app.models.rule import RuleTier


async def seed_rules():
    count = await RuleTier.find_all().count()
    if count == 0:
        default_tiers = [
            RuleTier(
                tier_name="MONITOR", 
                base_score=0, 
                action="Log only", 
                conditions=["healthy", "old_scar", "minor_hair_loss", "minor_skin_discoloration", "resting_animal", "no_visible_injury"]
            ),
            RuleTier(
                tier_name="LOW", 
                base_score=25, 
                action="Schedule patrol", 
                conditions=["minor_skin_disease", "mild_eye_irritation", "small_wound", "minor_cut", "small_abrasion", "mild_limping", "minor_swelling", "minor_ear_injury"]
            ),
            RuleTier(
                tier_name="MEDIUM", 
                base_score=50, 
                action="Within 4 hours", 
                conditions=["moderate_wound", "moderate_bleeding", "eye_infection", "skin_infection", "infected_wound", "moderate_burn", "moderate_swelling", "unable_to_use_one_leg", "visible_pain", "moderate_laceration"]
            ),
            RuleTier(
                tier_name="HIGH", 
                base_score=75, 
                action="Within 1 hour", 
                conditions=["deep_wound", "severe_burn", "major_eye_injury", "large_skin_infection", "severe_laceration", "severe_swelling", "unable_to_walk_properly", "major_bleeding", "large_open_wound", "advanced_infection"]
            ),
            RuleTier(
                tier_name="CRITICAL", 
                base_score=100, 
                action="Dispatch immediately", 
                conditions=["fracture", "exposed_bone", "heavy_bleeding", "road_accident", "hit_by_vehicle", "unconscious", "unable_to_stand", "severe_trauma", "life_threatening_burn", "multiple_fractures", "severe_head_injury", "critical_condition"]
            )
        ]
        await RuleTier.insert_many(default_tiers)

async def init_db():
    settings = get_settings()
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongodb_uri)
    await beanie.init_beanie(
        database=client.stray_rescue,
        document_models=[User, Report, NGO, RuleTier],
    )
    await seed_rules()
