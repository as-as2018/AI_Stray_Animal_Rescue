import motor.motor_asyncio
import beanie
from app.config import get_settings
from app.models.user import User
from app.models.report import Report
from app.models.ngo import NGO

async def init_db():
    settings = get_settings()
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongodb_uri)
    await beanie.init_beanie(
        database=client.stray_rescue,
        document_models=[User, Report, NGO],
    )
