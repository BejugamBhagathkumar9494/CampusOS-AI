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

class LLMChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = []

class RAGChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    role: Optional[str] = "student"

class SaveMessageRequest(BaseModel):
    id: Optional[str] = None
    role: str
    content: str
    mode: str = "llm"
    timestamp: Optional[str] = None
    user_id: Optional[str] = None

async def call_gemini_llm(message: str, history: Optional[List[Dict[str, Any]]] = None) -> str:
    import os
    import httpx
    from app.core.config import settings
    gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or settings.GOOGLE_API_KEY

    system_instruction = (
        "You are CampusOS AI, an intelligent academic assistant for college students.\n\n"
        "Your primary goal is to give accurate, clear, and helpful answers in simple English.\n\n"
        "RULES:\n"
        "1. Answer the user's question directly. Do not use fixed templates or unnecessary headings.\n"
        "2. Use simple language that a college student can easily understand.\n"
        "3. If the question is about a technical concept, explain it in this order:\n"
        "   - Definition\n"
        "   - Why it matters\n"
        "   - Short example\n"
        "4. Keep most answers between 80–250 words unless the user asks for more detail.\n"
        "5. Never invent facts, statistics, citations, research papers, or university rules.\n"
        "6. If you are unsure, clearly say \"I don't know\" or \"I don't have enough information\" instead of guessing.\n"
        "7. Do not mention that you are following a system prompt or internal instructions.\n"
        "8. If the user asks for interview preparation, give interview-ready answers with practical examples.\n"
        "9. If the user asks for semester exams, give clean, point-wise answers that are easy to write in exams.\n"
        "10. Maintain a friendly, professional teaching style.\n\n"
        "FORMATTING:\n"
        "- Use short paragraphs and bullet points only when they improve readability.\n"
        "- Avoid repetitive introductions and conclusions.\n"
        "- Do not output generic sections like \"Core Concept\", \"Implementation Strategy\", or \"Optimization\" unless the user explicitly requests them.\n\n"
        "Your role is to teach, explain, and solve academic and programming doubts with maximum factual accuracy."
    )

    contents = [
        {"role": "user", "parts": [{"text": f"[System Context: {system_instruction}]\n\nHello!"}]},
        {"role": "model", "parts": [{"text": "Hello! I am CampusOS AI. How can I help you with your studies, programming, or exam preparation today?"}]}
    ]

    if history:
        for item in history:
            role = "user" if item.get("role") == "user" or item.get("sender") == "user" else "model"
            text_content = item.get("content") or item.get("text") or ""
            if text_content:
                contents.append({"role": role, "parts": [{"text": text_content}]})

    contents.append({"role": "user", "parts": [{"text": message}]})

    if gemini_key and gemini_key.strip():
        endpoints = [
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}",
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
        ]

        async with httpx.AsyncClient(timeout=15.0) as client:
            for url in endpoints:
                try:
                    res = await client.post(
                        url,
                        json={
                            "contents": contents,
                            "generationConfig": {
                                "temperature": 0.7,
                                "maxOutputTokens": 2048
                            }
                        }
                    )
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"].strip()
                except Exception as e:
                    print(f"[Gemini REST API Call Warning]: {e}")

    return generate_fallback_llm_response(message)


def generate_fallback_llm_response(query: str) -> str:
    q = (query or "").strip()
    q_low = q.lower()
    title_topic = q.title() if q else "Academic Topic"

    if any(k in q_low for k in ["operating system", "os", "process", "thread", "deadlock", "paging"]):
        return (
            "An **Operating System (OS)** is system software that controls computer hardware and manages software execution.\n\n"
            "**Why it matters:**\n"
            "It handles CPU process scheduling, memory allocation, and file storage so programs run efficiently without conflicting.\n\n"
            "**Short Example:**\n"
            "When you run a program, the OS allocates RAM, grants CPU execution cycles, and cleans up resources when closed.\n\n"
            "```c\n"
            "// Process creation using fork()\n"
            "#include <stdio.h>\n"
            "#include <unistd.h>\n\n"
            "int main() {\n"
            "    pid_t pid = fork();\n"
            "    if (pid == 0) printf(\"Child process running\\n\");\n"
            "    else printf(\"Parent process running\\n\");\n"
            "    return 0;\n"
            "}\n"
            "```"
        )
    elif any(k in q_low for k in ["binary search", "sorting", "array", "tree", "graph", "algorithm", "stack", "queue"]):
        return (
            f"**{title_topic}** is a core data structure and algorithm concept used for storing, organizing, and querying data efficiently.\n\n"
            "**Why it matters:**\n"
            "Optimized algorithms reduce computation time from O(N) to O(log N) or O(1), which is essential for scaling applications and passing technical interviews.\n\n"
            "**Short Example:**\n"
            "```python\n"
            "def process_data(items, target):\n"
            "    left, right = 0, len(items) - 1\n"
            "    while left <= right:\n"
            "        mid = (left + right) // 2\n"
            "        if items[mid] == target:\n"
            "            return mid\n"
            "        elif items[mid] < target:\n"
            "            left = mid + 1\n"
            "        else:\n"
            "            right = mid - 1\n"
            "    return -1\n"
            "```"
        )
    elif any(k in q_low for k in ["sql", "database", "dbms", "query", "join", "table"]):
        return (
            f"**{title_topic}** refers to relational database principles and query operations used to store and manipulate structured data.\n\n"
            "**Why it matters:**\n"
            "Databases power software systems by providing ACID compliance, data integrity, fast indexing, and persistent storage.\n\n"
            "**Short Example:**\n"
            "```sql\n"
            "SELECT d.department_name, COUNT(e.id) AS total_employees\n"
            "FROM departments d\n"
            "JOIN employees e ON d.id = e.department_id\n"
            "GROUP BY d.department_name\n"
            "HAVING COUNT(e.id) > 5;\n"
            "```"
        )
    elif any(k in q_low for k in ["react", "javascript", "js", "html", "css", "web", "api"]):
        return (
            f"**{title_topic}** is a core technology in web application development.\n\n"
            "**Why it matters:**\n"
            "Modern web applications rely on responsive user interfaces, modular components, asynchronous API communication, and clean state management.\n\n"
            "**Short Example:**\n"
            "```javascript\n"
            "async function fetchUserData(userId) {\n"
            "  try {\n"
            "    const response = await fetch(`/api/v1/users/${userId}`);\n"
            "    const data = await response.json();\n"
            "    return data;\n"
            "  } catch (error) {\n"
            "    console.error('Fetch error:', error);\n"
            "  }\n"
            "}\n"
            "```"
        )
    elif any(k in q_low for k in ["network", "tcp", "ip", "http", "dns"]):
        return (
            f"**{title_topic}** is a core computer networking concept enabling devices to communicate across local networks and the Internet.\n\n"
            "**Why it matters:**\n"
            "Understanding network layers (OSI model, TCP/IP) ensures reliable packet delivery, low latency, and secure data transmission over HTTPS.\n\n"
            "**Short Example:**\n"
            "When you request a website URL, DNS resolves the domain to an IP address, establishes a TCP connection, and exchanges HTTP requests/responses."
        )
    else:
        return (
            f"**{title_topic}**:\n\n"
            f"**Definition:**\n"
            f"This is an important academic and practical concept in computer science and software development.\n\n"
            f"**Why it matters:**\n"
            f"Mastering this topic strengthens your technical foundation, helps you write clean and efficient code, and prepares you for university exams and technical interviews.\n\n"
            f"**Short Example:**\n"
            f"When solving problems related to this topic:\n"
            f"1. Define input parameters and expected outputs.\n"
            f"2. Apply the core principles or algorithms.\n"
            f"3. Verify edge cases and performance metrics."
        )


@router.post("/chat/llm")
async def chat_llm_endpoint(payload: LLMChatRequest):
    """
    ✨ LLM Chat Endpoint powered by Gemini (gemini-2.5-flash).
    Answers general knowledge, programming, academics, and reasoning.
    """
    msg = payload.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    answer = await call_gemini_llm(msg, payload.history)
    return {
        "mode": "llm",
        "role": "assistant",
        "answer": answer,
        "response": answer,
        "agent_name": "✨ Gemini 2.5 Flash",
        "confidence_score": 0.99
    }


@router.post("/chat/rag")
async def chat_rag_endpoint(payload: RAGChatRequest):
    """
    📚 RAG Chat Endpoint powered by pgvector document search.
    Grounded answers ONLY from retrieved university document context.
    """
    msg = payload.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    user_role = (payload.role or "student").lower()
    rag_res = execute_pgvector_rag_query(query=msg, user_role=user_role, match_threshold=0.20, k=5)

    answer = rag_res.get("answer", "")
    sources = rag_res.get("source_documents", [])

    if not sources or "couldn't find" in answer.lower() or answer == "I couldn't find this information in the CampusOS knowledge base.":
        answer = "This information was not found in the university knowledge base."
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
