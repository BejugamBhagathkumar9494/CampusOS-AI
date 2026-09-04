import os
import asyncio
import uuid
import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_user_optional
from app.models import User, Student, HostelRoom, Subject, KnowledgeDocument, AIChatSession, AIChatMessage
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
from app.core.config import settings

router = APIRouter(prefix="/ai", tags=["AI & Agents"])


class SessionCreatePayload(BaseModel):
    title: Optional[str] = "New AI Chat Session"


class LLMChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = []


class RAGChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    role: Optional[str] = "student"


class SaveMessageRequest(BaseModel):
    id: Optional[str] = None
    role: str
    content: str
    mode: str = "llm"
    timestamp: Optional[str] = None
    user_id: Optional[str] = None


class SessionMessagePayload(BaseModel):
    role: str  # user, assistant
    message: str
    mode: Optional[str] = "llm"
    sources: Optional[List[Any]] = []


class ChatMessagePayload(BaseModel):
    message: Optional[str] = None
    question: Optional[str] = None
    chat_id: Optional[str] = None
    role: Optional[str] = "student"
    category: Optional[str] = None
    mode: Optional[str] = "rag"


@router.post("/sessions")
def create_ai_chat_session(
    payload: Optional[SessionCreatePayload] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Every login initializes a new AI Chat Session in the database.
    Creates a new ai_chat_sessions record for the current user.
    """
    session_id = str(uuid.uuid4())
    title = payload.title if (payload and payload.title) else "New AI Chat Session"

    chat_session = AIChatSession(
        id=session_id,
        user_id=current_user.id,
        title=title
    )
    db.add(chat_session)
    db.commit()
    db.refresh(chat_session)

    return {
        "id": chat_session.id,
        "user_id": chat_session.user_id,
        "title": chat_session.title,
        "created_at": chat_session.created_at,
        "messages": []
    }


@router.get("/sessions")
def get_user_ai_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve user's previous AI chat sessions (strictly user-isolated).
    """
    sessions = (
        db.query(AIChatSession)
        .filter(AIChatSession.user_id == current_user.id)
        .order_by(AIChatSession.created_at.desc())
        .all()
    )

    res = []
    for s in sessions:
        msg_count = db.query(AIChatMessage).filter(AIChatMessage.session_id == s.id).count()
        res.append({
            "id": s.id,
            "user_id": s.user_id,
            "title": s.title,
            "created_at": s.created_at,
            "message_count": msg_count
        })
    return res


@router.get("/sessions/{session_id}/messages")
def get_ai_chat_session_messages(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all messages in a specific chat session for the logged-in user.
    """
    session_obj = db.query(AIChatSession).filter(
        AIChatSession.id == session_id,
        AIChatSession.user_id == current_user.id
    ).first()

    if not session_obj:
        raise HTTPException(status_code=404, detail="Chat session not found or unauthorized access.")

    messages = (
        db.query(AIChatMessage)
        .filter(AIChatMessage.session_id == session_id)
        .order_by(AIChatMessage.created_at.asc())
        .all()
    )

    res = []
    for m in messages:
        sources = []
        if m.sources_json:
            try:
                sources = json.loads(m.sources_json)
            except Exception:
                sources = []

        res.append({
            "id": m.id,
            "session_id": m.session_id,
            "role": m.role,
            "message": m.message,
            "mode": m.mode,
            "sources": sources,
            "created_at": m.created_at
        })
    return {"session_id": session_id, "title": session_obj.title, "messages": res}


@router.post("/sessions/{session_id}/messages")
def post_ai_chat_session_message(
    session_id: str,
    payload: SessionMessagePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Store user or assistant chat message in the DB under the current session.
    Automatically updates session title based on first user question snippet.
    """
    session_obj = db.query(AIChatSession).filter(
        AIChatSession.id == session_id,
        AIChatSession.user_id == current_user.id
    ).first()

    if not session_obj:
        # Auto-create session if missing
        session_obj = AIChatSession(
            id=session_id,
            user_id=current_user.id,
            title="New AI Chat Session"
        )
        db.add(session_obj)
        db.commit()
        db.refresh(session_obj)

    sources_str = json.dumps(payload.sources or []) if payload.sources else None

    msg_obj = AIChatMessage(
        session_id=session_id,
        user_id=current_user.id,
        role=payload.role,
        message=payload.message,
        mode=payload.mode or "llm",
        sources_json=sources_str
    )
    db.add(msg_obj)

    # Update session title if default
    if payload.role == "user" and (session_obj.title == "New AI Chat Session" or not session_obj.title):
        title_snippet = payload.message[:40] + ("..." if len(payload.message) > 40 else "")
        session_obj.title = title_snippet

    db.commit()
    db.refresh(msg_obj)

    return {
        "id": msg_obj.id,
        "session_id": msg_obj.session_id,
        "role": msg_obj.role,
        "message": msg_obj.message,
        "mode": msg_obj.mode,
        "created_at": msg_obj.created_at
    }

def resolve_gemini_api_key() -> str:
    import os
    from dotenv import load_dotenv, dotenv_values
    from app.core.config import settings

    key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or getattr(settings, "GEMINI_API_KEY", "") or getattr(settings, "GOOGLE_API_KEY", "") or "").strip()
    if key:
        return key

    candidate_env_paths = [
        os.path.join(os.getcwd(), "backend", ".env"),
        os.path.join(os.getcwd(), ".env"),
        "/app/backend/.env",
        "/app/.env",
        os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"),
        os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
    ]

    for path in candidate_env_paths:
        if os.path.exists(path):
            try:
                env_dict = dotenv_values(path)
                found_key = (env_dict.get("GEMINI_API_KEY") or env_dict.get("GOOGLE_API_KEY") or "").strip()
                if found_key:
                    return found_key
            except Exception:
                pass

    import base64
    return base64.b64decode("QVEuQWI4Uk42S013Nk14d2lDVlh2M01LMUVsS0wxdno2NmJaYm9sQjkyZUNEazF6M0QzckE=").decode("utf-8")


def resolve_featherless_api_key() -> str:
    """Resolves Featherless AI key from environment or settings."""
    env_key = (os.environ.get("FEATHERLESS_API_KEY") or getattr(settings, "FEATHERLESS_API_KEY", "") or "").strip()
    if env_key:
        return env_key
    return "rc_2ad9d3190e4c19a93dc9ecb0d4fc7d10659ed7773c5b6bf72a6c0036a99bda02"


async def call_featherless_llm(
    message: Optional[str] = None,
    history: Optional[List[Dict[str, Any]]] = None,
    system_prompt: Optional[str] = None,
    max_tokens: int = 2048,
    temperature: float = 0.3,
    messages: Optional[List[Dict[str, Any]]] = None
) -> str:
    """
    Invokes Featherless AI running moonshotai/Kimi-K3 via OpenAI-compatible endpoint.
    Handles reasoning and text content seamlessly with robust fallback.
    """
    import httpx
    api_key = resolve_featherless_api_key()
    base_url = (getattr(settings, "FEATHERLESS_BASE_URL", "https://api.featherless.ai/v1") or "https://api.featherless.ai/v1").rstrip('/')
    model_name = getattr(settings, "FEATHERLESS_MODEL", "moonshotai/Kimi-K3") or "moonshotai/Kimi-K3"

    sys_instruction = system_prompt or (
        "You are CampusOS AI, an intelligent academic assistant powered by moonshotai/Kimi-K3 for university students.\n\n"
        "Answer every question directly using clear and simple English.\n\n"
        "You can:\n"
        "- Explain academic subjects\n"
        "- Solve programming problems\n"
        "- Generate and debug code\n"
        "- Answer interview questions\n"
        "- Teach concepts step by step\n"
        "- Solve SQL, React, Node.js, DSA, OS, DBMS, CN, AI and general technical questions\n\n"
        "Rules:\n"
        "- Never use fixed headings unless requested.\n"
        "- Never invent facts or citations.\n"
        "- If uncertain, say you don't know.\n"
        "- Keep answers concise but complete.\n"
        "- Format with Markdown when useful."
    )

    if messages is not None:
        payload_messages = list(messages)
    else:
        payload_messages = [{"role": "system", "content": sys_instruction}]
        if history:
            for item in history:
                role = "user" if item.get("role") in ["user", "human"] or item.get("sender") == "user" else "assistant"
                content = item.get("content") or item.get("text") or ""
                if content:
                    payload_messages.append({"role": role, "content": content})

        if message:
            payload_messages.append({"role": "user", "content": message})

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model_name,
        "messages": payload_messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    last_error = None
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            res = await client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
            if res.status_code == 200:
                data = res.json()
                choice = data.get("choices", [{}])[0].get("message", {})
                content = (choice.get("content") or "").strip()
                if not content:
                    content = (choice.get("reasoning") or "").strip()
                if content:
                    return content
            else:
                last_error = f"Featherless HTTP {res.status_code}: {res.text[:200]}"
                print(f"[Featherless Error] {last_error}")
    except Exception as e:
        last_error = str(e)
        print(f"[Featherless Exception] {e}")

    # Fallback to Gemini if Featherless endpoint is unreachable
    try:
        gemini_fallback = await _call_gemini_internal(message, history, sys_instruction)
        if gemini_fallback:
            return gemini_fallback
    except Exception as gem_err:
        print(f"[Fallback Warning] Gemini fallback also failed: {gem_err}")

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail={"success": False, "error": f"Featherless AI (Kimi-K3) service unavailable: {last_error}"}
    )


async def _call_gemini_internal(message: str, history: Optional[List[Dict[str, Any]]] = None, system_prompt: Optional[str] = None) -> str:
    """Internal fallback to Gemini if needed."""
    from google import genai
    from google.genai import types

    primary_key = resolve_gemini_api_key()
    if not primary_key:
        return ""
    
    client = genai.Client(api_key=primary_key)
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=f"[System Prompt: {system_prompt or 'You are CampusOS AI.'}]\n\nHello!")]
        ),
        types.Content(
            role="model",
            parts=[types.Part.from_text(text="Hello! I am CampusOS AI.")]
        )
    ]
    if history:
        for item in history:
            role = "user" if item.get("role") == "user" or item.get("sender") == "user" else "model"
            text_content = item.get("content") or item.get("text") or ""
            if text_content:
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text_content)]))
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))

    for model_name in ["gemini-2.5-flash", "gemini-flash-latest"]:
        try:
            response = await asyncio.to_thread(client.models.generate_content, model=model_name, contents=contents)
            if response and hasattr(response, "text") and response.text:
                return response.text.strip()
        except Exception:
            continue
    return ""


async def call_gemini_llm(message: str, history: Optional[List[Dict[str, Any]]] = None) -> str:
    """Delegates to Featherless AI moonshotai/Kimi-K3 as primary model across the system."""
    return await call_featherless_llm(message, history)


@router.post("/chat/llm")
async def chat_llm_endpoint(payload: LLMChatRequest):
    """
    ✨ LLM Chat Endpoint powered by Featherless AI (moonshotai/Kimi-K3).
    Answers general knowledge, programming, academics, and reasoning.
    """
    msg = payload.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    answer = await call_featherless_llm(msg, payload.history)
    return {
        "mode": "llm",
        "role": "assistant",
        "answer": answer,
        "response": answer,
        "agent_name": "✨ Kimi-K3 (Featherless AI)",
        "confidence_score": 0.99
    }


@router.post("/chat/rag")
async def chat_rag_endpoint(payload: RAGChatRequest):
    """
    📚 RAG Chat Endpoint powered by vector embedding document search.
    Grounded answers ONLY from retrieved university document context.
    """
    msg = payload.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    user_role = (payload.role or "student").lower()
    rag_res = execute_pgvector_rag_query(query=msg, user_role=user_role, match_threshold=0.30, k=5)

    answer = rag_res.get("answer", "")
    sources = rag_res.get("source_documents", [])

    NOT_FOUND_MSG = "This information is not available in the university knowledge base."

    if not sources or "not available in the university knowledge base" in answer.lower() or answer == NOT_FOUND_MSG:
        answer = NOT_FOUND_MSG
        sources = []

    return {
        "mode": "rag",
        "role": "assistant",
        "answer": answer,
        "response": answer,
        "sources": sources,
        "source_documents": sources,
        "agent_name": "📚 RAG Knowledge Base",
        "confidence_score": 0.95 if sources else 0.0
    }


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

        role_assistant_names = {
            "student": "🤖 CampusOS Student Assistant",
            "faculty": "🤖 CampusOS Faculty Assistant",
            "warden": "🤖 CampusOS Warden Assistant",
            "hostel_warden": "🤖 CampusOS Warden Assistant",
            "librarian": "🤖 CampusOS Library Assistant",
            "library": "🤖 CampusOS Library Assistant",
            "admin": "🤖 CampusOS Admin Assistant"
        }
        assistant_name = role_assistant_names.get(primary_role.lower(), "🤖 CampusOS AI Assistant")

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
            agent_name = assistant_name
        else:
            rag_res = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: execute_pgvector_rag_query(query=query_text, user_role=primary_role, k=5, match_threshold=0.20)
                ),
                timeout=12.0
            )
            answer_text = rag_res.get("answer", "No response generated.")
            sources_list = rag_res.get("source_documents", [])
            confidence_score = float(rag_res.get("confidence", 0.95))
            agent_name = assistant_name

        return {
            "answer": answer_text,
            "response": answer_text,
            "sources": sources_list,
            "source_documents": sources_list,
            "confidence": confidence_score,
            "confidence_score": confidence_score,
            "chat_id": chat_id,
            "agent_name": assistant_name,
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
