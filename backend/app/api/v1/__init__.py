"""
API v1 Router - aggregates all endpoint modules.
All routers from both development sessions are registered here.
DO NOT overwrite this file without including ALL routers.
"""
from fastapi import APIRouter

from app.api.v1.tools import router as tools_router
from app.api.v1.coach import router as coach_router
from app.api.v1.methodology import router as methodology_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.cases import router as cases_router
from app.api.v1.files import router as files_router
from app.api.v1.export import router as export_router
from app.api.v1.data_analysis import router as data_analysis_router
from app.api.v1.paywall import router as paywall_router
from app.api.v1.ai import router as ai_router
from app.api.v1.fmea import router as fmea_router
from app.api.v1.doe import router as doe_router
from app.api.v1.eightd import router as eightd_router
from app.api.v1.case_analysis import router as case_analysis_router
from app.api.v1.billing import router as billing_router

router = APIRouter()

# Original platform routes
router.include_router(tools_router, prefix="/tools", tags=["AI Tools"])
router.include_router(coach_router, prefix="/coach", tags=["AI Coach"])
router.include_router(methodology_router, prefix="/methodology", tags=["Methodology"])

# Auth & Users (Session A)
router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
router.include_router(users_router, prefix="/users", tags=["Users"])

# Quality Cases (Session A)
router.include_router(cases_router, prefix="/cases", tags=["Quality Cases"])
router.include_router(files_router, prefix="", tags=["Files"])
router.include_router(export_router, prefix="", tags=["Export"])

# Data Analysis & Subscription (Session A)
router.include_router(data_analysis_router, prefix="/analysis", tags=["Data Analysis"])
router.include_router(paywall_router, prefix="/subscription", tags=["Subscription"])

# AI Quality Tools - Fishbone, 5Whys, Pareto (Session B)
router.include_router(ai_router, prefix="/ai", tags=["AI Quality Tools"])

# FMEA API (Session B)
router.include_router(fmea_router, prefix="/ai/fmea", tags=["AI FMEA"])

# DOE (P2)
router.include_router(doe_router, prefix="/ai/doe", tags=["AI DOE"])

# Standalone 8D (P2)
router.include_router(eightd_router, prefix="/ai/8d", tags=["AI 8D"])

# Case analysis: root causes, actions, verification (P1)
router.include_router(case_analysis_router, prefix="/cases", tags=["Case Analysis"])

# Billing, subscription, feedback (P3)
router.include_router(billing_router, prefix="/billing", tags=["Billing & Feedback"])
