from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.auth_demo import router as auth_demo_router
from app.api.dashboard import router as dashboard_router
from app.api.leads import router as leads_router
from app.api.parties import router as parties_router
from app.api.users import router as users_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router)
api_router.include_router(auth_demo_router)
api_router.include_router(dashboard_router)
api_router.include_router(leads_router)
api_router.include_router(parties_router)
api_router.include_router(users_router)
