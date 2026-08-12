"""RAG Service Integration for FastAPI Backend."""
import os
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional

# Add project root and backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BASE_DIR.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

try:
    from rag_langchain_assistant import CampusRAGAssistant, DOCUMENT_MAP
except ImportError:
    # Fallback to local import path if applicable
    from app.services.rag_langchain_assistant import CampusRAGAssistant, DOCUMENT_MAP

_rag_assistant_instance: Optional[CampusRAGAssistant] = None

def get_rag_assistant() -> CampusRAGAssistant:
    """Singleton getter for CampusRAGAssistant."""
    global _rag_assistant_instance
    if _rag_assistant_instance is None:
        _rag_assistant_instance = CampusRAGAssistant()
    return _rag_assistant_instance

def execute_rag_query(query: str, role_or_category: str = "students", k: int = 3) -> Dict[str, Any]:
    """Executes RAG search across Students, Placements, or Faculty documents."""
    assistant = get_rag_assistant()
    
    # Map role names to RAG document categories
    role_map = {
        "student": "students",
        "students": "students",
        "placement_officer": "placements",
        "placement": "placements",
        "placements": "placements",
        "faculty": "faculty",
        "teacher": "faculty",
        "hostel_warden": "students",
        "admin": "faculty"
    }
    
    category = role_map.get(role_or_category.lower(), "students")
    return assistant.docu_chat(user_query=query, category=category, k=k)
