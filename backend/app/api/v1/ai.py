from fastapi import APIRouter

router = APIRouter(prefix="/ai", tags=["AI & Agents"])


@router.post("/chat")
def chat_with_agent(message: str, chat_id: str = None):
    """Invoke the student success/academic agent via LangGraph flow."""
    return {
        "chat_id": chat_id or "new_chat_1",
        "response": "Hello, I am your CampusOS AI assistant. How can I help you today?",
    }


@router.get("/chat/history")
def get_chat_history(user_id: str):
    """Retrieve chat history for the user."""
    return {"user_id": user_id, "history": []}


@router.post("/knowledge/search")
def knowledge_rag_search(query: str):
    """RAG-only search through rules, circulars, syllabus, and policies."""
    return {"query": query, "results": []}
