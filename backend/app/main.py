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

# CORS configurations - Allow Vercel frontend, local development, and wildcard origins
origins_list = list(settings.cors_origins) if settings.cors_origins else []
default_origins = [
    "https://campus-os-ai-jbth.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000"
]
for o in default_origins:
    if o not in origins_list:
        origins_list.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in origins_list else origins_list,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
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

from app.api.v1 import academics_extended
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
