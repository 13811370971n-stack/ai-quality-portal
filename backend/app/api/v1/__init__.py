"""
API v1 Router - aggregates all endpoint modules.
"""
from fastapi import APIRouter

from app.api.v1.tools import router as tools_router
from app.api.v1.coach import router as coach_router
from app.api.v1.methodology import router as methodology_router
from app.api.v1.ai import router as ai_router
from app.api.v1.fmea import router as fmea_router

router = APIRouter()

router.include_router(tools_router, prefix="/tools", tags=["AI Tools"])
router.include_router(coach_router, prefix="/coach", tags=["AI Coach"])
router.include_router(methodology_router, prefix="/methodology", tags=["Methodology"])
router.include_router(ai_router, prefix="/ai", tags=["AI Quality Tools"])
router.include_router(fmea_router, prefix="/ai/fmea", tags=["AI FMEA"])
