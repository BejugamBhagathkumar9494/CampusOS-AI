from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.services.rag_service import init_rag_service
from app.api.v1 import (
    auth,
    admin_management,
    students,
    faculty,
    hostel,
    library,
    transport,
    placements,
    finance,
    ai,
    analytics,
    notifications,
    academics,
    academics_extended,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan Context Manager.
    1. Validates required environment variables at startup.
    2. Initializes singleton embedding model and global FAISS index once.
    """
    print("[CampusOS AI] Initializing system & validating startup configuration...")
    settings.validate_required_env()
    init_rag_service()
    print("[CampusOS AI] Startup complete. Service ready on 1 worker (<450MB RAM).")
    yield
    print("[CampusOS AI] Shutting down backend service...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CampusOS AI - AI-Powered University Operating System API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration - strict origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under v1 namespace
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(admin_management.router, prefix=settings.API_V1_STR)
app.include_router(students.router, prefix=settings.API_V1_STR)
app.include_router(faculty.router, prefix=settings.API_V1_STR)
app.include_router(hostel.router, prefix=settings.API_V1_STR)
app.include_router(library.router, prefix=settings.API_V1_STR)
app.include_router(transport.router, prefix=settings.API_V1_STR)
app.include_router(placements.router, prefix=settings.API_V1_STR)
app.include_router(finance.router, prefix=settings.API_V1_STR)
app.include_router(academics.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(academics_extended.router, prefix=f"{settings.API_V1_STR}/academic-ext")


@app.get("/", tags=["General"])
def read_root():
    """Welcome endpoint for the CampusOS AI system API."""
    return {
        "message": "Welcome to CampusOS AI API",
        "version": "1.0.0",
        "docs_url": "/docs",
    }


@app.get("/health", tags=["General"])
def health_check():
    """Verify application health and availability."""
    return {"status": "healthy", "version": "1.0.0"}

