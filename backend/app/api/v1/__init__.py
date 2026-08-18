"""
API v1 Router - aggregates all endpoint modules.
"""
from fastapi import APIRouter

from app.api.v1.tools import router as tools_router
from app.api.v1.coach import router as coach_router
from app.api.v1.methodology import router as methodology_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.cases import router as cases_router
from app.api.v1.files import router as files_router

router = APIRouter()

router.include_router(tools_router, prefix="/tools", tags=["AI Tools"])
router.include_router(coach_router, prefix="/coach", tags=["AI Coach"])
router.include_router(methodology_router, prefix="/methodology", tags=["Methodology"])
router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
router.include_router(users_router, prefix="/users", tags=["Users"])
router.include_router(cases_router, prefix="/cases", tags=["Quality Cases"])
router.include_router(files_router, prefix="", tags=["Files"])
