from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db
from app.routers import auth, reports, admin, rules
from app.config import get_settings
from app.services.urgency_score import refresh_rule_engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await refresh_rule_engine()
    yield


settings = get_settings()

app = FastAPI(
    title="🐾 Stray Animal Rescue API",
    description="AI-powered stray animal rescue and triage platform",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(admin.router)
app.include_router(rules.router)


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": "2.0.0"}
