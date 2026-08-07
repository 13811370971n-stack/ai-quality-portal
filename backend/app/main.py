"""
AI Quality Portal - Backend Application
FastAPI backend providing APIs for AI-powered quality management tools.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import router as api_v1_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Quality Portal API",
        description="AI赋能质量管理平台 - 后端API服务",
        version="0.1.0",
    )

    # CORS - allow frontend dev server
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register API routes
    app.include_router(api_v1_router, prefix="/api/v1")

    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "service": "ai-quality-portal"}

    return app


app = create_app()
