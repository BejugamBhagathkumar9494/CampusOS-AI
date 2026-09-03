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
    exam_prep,
)


import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan Context Manager.
    1. Validates required environment variables at startup.
    2. Initializes singleton embedding model and global FAISS index non-blocking.
    """
    print("[CampusOS AI] Initializing system & validating startup configuration...")
    settings.validate_required_env()
    try:
        from app.core.database import Base, engine
        import app.models.database_models
        Base.metadata.create_all(bind=engine)
        from app.core.init_db import init_db
        init_db()
    except Exception as db_init_err:
        print(f"[CampusOS AI Startup Warning] Database init warning: {db_init_err}")

    try:
        asyncio.create_task(asyncio.to_thread(init_rag_service))
    except Exception as e:
        print(f"[CampusOS AI Startup Warning] RAG background init warning: {e}")
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
app.include_router(exam_prep.router, prefix=settings.API_V1_STR)

# Direct aliases for /api/chat/llm and /api/chat/rag as per specification
from app.api.v1.ai import chat_llm_endpoint, chat_rag_endpoint, LLMChatRequest, RAGChatRequest

@app.post("/api/chat/llm", tags=["AI & Agents"])
async def root_chat_llm(payload: LLMChatRequest):
    return await chat_llm_endpoint(payload)

@app.post("/api/chat/rag", tags=["AI & Agents"])
async def root_chat_rag(payload: RAGChatRequest):
    return await chat_rag_endpoint(payload)



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

