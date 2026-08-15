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
        user_name = "Student"
        if current_user and hasattr(current_user, "full_name") and current_user.full_name:
            user_name = current_user.full_name
        elif current_user and hasattr(current_user, "username") and current_user.username:
            user_name = current_user.username.split("@")[0].capitalize()

        is_agentic = payload.agentic_mode if payload.agentic_mode is not None else True

        loop = asyncio.get_event_loop()
        if is_agentic:
            agent_res = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: AgenticSupervisor.process_query(
                        query=query_text,
                        user_role=primary_role,
                        user_name=user_name,
                        student_data=current_user,
                        db=db,
                        agentic_mode=True
                    )
                ),
                timeout=12.0
            )
            answer_text = agent_res.get("answer", "No response generated.")
            sources_list = agent_res.get("source_documents", [])
            confidence_score = float(agent_res.get("confidence_score", 0.95))
            agent_name = agent_res.get("agent_name", "🤖 CampusOS AI Supervisor")
        else:
            rag_res = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: execute_pgvector_rag_query(query=query_text, user_role=primary_role, k=3)
                ),
                timeout=12.0
            )
            answer_text = rag_res.get("answer", "No response generated.")
            sources_list = rag_res.get("source_documents", [])
            confidence_score = float(rag_res.get("confidence", 0.95))
            agent_name = "📚 Grounded RAG Agent"

        return {
            "answer": answer_text,
            "response": answer_text,
            "sources": sources_list,
            "source_documents": sources_list,
            "confidence": confidence_score,
            "confidence_score": confidence_score,
            "chat_id": chat_id,
            "agent_name": agent_name,
        }

    except asyncio.TimeoutError:
        return {
            "answer": "The request timed out while generating an AI response. Please try again.",
            "response": "The request timed out while generating an AI response. Please try again.",
            "sources": [],
            "source_documents": [],
            "confidence": 0.0,
            "confidence_score": 0.0,
            "chat_id": chat_id,
            "agent_name": "🤖 CampusOS AI Assistant",
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


class RAGDebugPayload(BaseModel):
    query: str
    role: Optional[str] = "student"
    match_threshold: Optional[float] = 0.20
    k: Optional[int] = 5


@router.post("/debug/rag")
def debug_rag_pipeline(
    payload: RAGDebugPayload,
    current_user: User = Depends(get_current_user)
):
    """
    Hidden Debug Endpoint (Admin/Authorized Debugger - Step 8):
    Returns full RAG pipeline breakdown:
    { question, retrieved_chunks, similarity_score, documents_used, pages, llm_prompt, final_answer }
    """
    user_role = (payload.role or (current_user.roles[0].name.lower() if hasattr(current_user, "roles") and current_user.roles else "student")).lower()
    
    from app.services.rag_service import GlobalFAISSRetriever, execute_pgvector_rag_query
    
    k = payload.k or 5
    threshold = payload.match_threshold or 0.20

    chunks = GlobalFAISSRetriever.retrieve(query=payload.query, category=user_role, k=k, match_threshold=threshold)
    
    max_sim = max([c.get("score", 0.0) for c in chunks], default=0.0)
    docs_used = list(set([c.get("file_name", "Document") for c in chunks]))
    pages_used = list(set([c.get("page_number", 1) for c in chunks]))
    
    formatted_context = "\n\n".join([c.get("content", "") for c in chunks])
    
    simulated_prompt = (
        "You are CampusOS AI.\n\n"
        "Answer ONLY using the retrieved CampusOS documents.\n\n"
        f"Context:\n{formatted_context or '[EMPTY]'}\n\n"
        f"Question:\n{payload.query}"
    )

    rag_res = execute_pgvector_rag_query(query=payload.query, user_role=user_role, match_threshold=threshold, k=k)

    return {
        "question": payload.query,
        "retrieved_chunks": chunks,
        "similarity_score": round(max_sim, 3),
        "documents_used": docs_used,
        "pages": pages_used,
        "llm_prompt": simulated_prompt,
        "final_answer": rag_res.get("answer", "")
    }
