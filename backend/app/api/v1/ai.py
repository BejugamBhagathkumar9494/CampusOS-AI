from typing import List, Optional, Dict, Any
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_user_optional
from app.models import User, Student, HostelRoom, Subject, KnowledgeDocument
from app.schemas import (
    ChatMessage, 
    ChatResponse, 
    RAGSearchQuery, 
    RAGSearchResponse, 
    RAGSearchResultItem
)
from app.services.ml_models.placement_predictor import predict_placement_readiness
from app.services.ai_agents import (
    academic, 
    hostel as hostel_agent, 
    library as library_agent, 
    placement as placement_agent, 
    transport as transport_agent, 
    finance as finance_agent,
    knowledge as knowledge_agent
)
from app.services.ai_agents.agentic_supervisor import AgenticSupervisor
from app.services.rag_service import execute_pgvector_rag_query, process_and_ingest_document

router = APIRouter(prefix="/ai", tags=["AI & Agents"])


class ChatMessagePayload(BaseModel):
    message: Optional[str] = None
    question: Optional[str] = None
    chat_id: Optional[str] = "session_1"
    category: Optional[str] = None
    role: Optional[str] = None
    agentic_mode: Optional[bool] = True


@router.post("/chat")
async def chat_with_agent(
    payload: ChatMessagePayload,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    AI Chat Endpoint.
    Accepts POST JSON payload, queries RAG knowledge base & agents with timeout protection (10s),
    and returns { answer, sources, confidence } without stack traces.
    """
    query_text = (payload.message or payload.question or "").strip()
    if not query_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request JSON payload must contain 'message' or 'question' field."
        )

    chat_id = payload.chat_id or "session_1"
    requested_role = (payload.role or payload.category or "students").lower()

    if current_user and hasattr(current_user, "roles") and current_user.roles:
        primary_role = current_user.roles[0].name.lower()
    else:
        primary_role = requested_role

    try:
        # Wrap execution in asyncio.wait_for with 10s timeout protection
        loop = asyncio.get_event_loop()
        rag_res = await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: execute_pgvector_rag_query(query=query_text, user_role=primary_role, k=3)
            ),
            timeout=10.0
        )

        answer_text = rag_res.get("answer", "No response generated.")
        sources_list = rag_res.get("source_documents", [])
        confidence_score = float(rag_res.get("confidence", 0.95))

        return {
            "answer": answer_text,
            "sources": sources_list,
            "confidence": confidence_score,
            "response": answer_text,
            "chat_id": chat_id,
            "agent_name": "🤖 CampusOS AI Assistant",
            "confidence_score": confidence_score,
            "source_documents": sources_list,
        }

    except asyncio.TimeoutError:
        return {
            "answer": "The request timed out while generating an AI response. Please try again.",
            "sources": [],
            "confidence": 0.0,
            "response": "The request timed out while generating an AI response. Please try again.",
            "chat_id": chat_id,
            "agent_name": "🤖 CampusOS AI Assistant",
            "confidence_score": 0.0,
            "source_documents": [],
        }
    except HTTPException:
        raise
    except Exception as err:
        print(f"[AI Chat Router Error]: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your AI chat request."
        )




@router.post("/knowledge/upload")
async def upload_knowledge_document(
    file: UploadFile = File(...),
    category: str = Form("General"),
    allowed_roles: Optional[str] = Form("student,faculty,admin,hostel_warden,placement_officer"),
    current_user: User = Depends(get_current_user)
):
    """
    Document Ingestion Pipeline:
    Uploads PDF or DOCX file into Supabase Storage 'campusos-media', extracts text,
    splits into chunks, generates 768-dim embeddings, and stores in Supabase pgvector.
    """
    if not file.filename.endswith((".pdf", ".docx", ".doc")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF or DOCX document."
        )

    contents = await file.read()
    roles_list = [r.strip() for r in allowed_roles.split(",") if r.strip()] if allowed_roles else ["student", "faculty", "admin"]

    try:
        res = process_and_ingest_document(
            file_name=file.filename,
            file_bytes=contents,
            category=category,
            uploader_id=str(current_user.id) if current_user else None,
            allowed_roles=roles_list
        )
        return {
            "status": "success",
            "message": f"Successfully processed and indexed '{file.filename}' into Supabase pgvector.",
            "data": res
        }
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document ingestion failed: {str(err)}"
        )


@router.get("/chat/history")
def get_chat_history(user_id: str, db: Session = Depends(get_db)):
    """Retrieve chat history for the user."""
    return {"user_id": user_id, "history": []}


@router.post("/knowledge/search", response_model=RAGSearchResponse)
def knowledge_rag_search(
    payload: RAGSearchQuery, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Role-aware semantic similarity search through Supabase PostgreSQL pgvector document chunks.
    """
    user_role = current_user.roles[0].name.lower() if hasattr(current_user, "roles") and current_user.roles else "student"
    rag_res = execute_pgvector_rag_query(query=payload.query, user_role=user_role, match_threshold=0.20, k=5)
    
    results = []
    for i, doc in enumerate(rag_res.get("source_documents", []), 1):
        results.append(
            RAGSearchResultItem(
                id=i,
                title=f"{doc.get('file_name', 'CampusOS Document')} (Page {doc.get('page_number', 1)})",
                category=user_role.capitalize(),
                content=doc.get("content", ""),
                score=round(doc.get("score", 0.9), 2)
            )
        )
            
    return RAGSearchResponse(query=payload.query, results=results)
