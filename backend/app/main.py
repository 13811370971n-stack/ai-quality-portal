"""
AI Quality Portal - Backend Application
FastAPI backend providing APIs for AI-powered quality management tools.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import router as api_v1_router
from app.database.session import init_db


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Quality Portal API",
        description="AI赋能质量管理平台 - 后端API服务",
        version="0.2.0",
    )

    # CORS - allow frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://8.146.227.10:8080", "http://aidmaic.top"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register API routes
    app.include_router(api_v1_router, prefix="/api/v1")

    @app.on_event("startup")
    async def startup():
        init_db()

    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "service": "ai-quality-portal", "version": "0.2.0"}

    return app


app = create_app()
