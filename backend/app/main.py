from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
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
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CampusOS AI - AI-Powered University Operating System API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configurations
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
