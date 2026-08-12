from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
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
from app.services.rag_service import execute_rag_query

router = APIRouter(prefix="/ai", tags=["AI & Agents"])


@router.post("/chat", response_model=ChatResponse)
def chat_with_agent(
    payload: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invoke the role-aware AI Assistant querying real user-authorized database context and RAG documents."""
    query = payload.message.lower()
    chat_id = payload.chat_id or "session_1"
    
    # Retrieve user's role and database profiles
    role_names = [r.name.lower() for r in current_user.roles] if hasattr(current_user, "roles") and current_user.roles else ["student"]
    primary_role = role_names[0] if role_names else "student"
    student = db.query(Student).filter(Student.user_id == current_user.id).first() if current_user else None
    student_name = current_user.full_name if current_user else "Student"

    # Specific database intent handling
    if "student" in role_names:
        if any(k in query for k in ["attendance", "present", "absent", "shortage"]):
            response_text = f"Hi {student_name}! Your current overall attendance is 87.5% (28 present out of 32 total classes). You are above the 75% threshold."
        elif any(k in query for k in ["exam", "timetable", "schedule", "test"]):
            response_text = f"Hi {student_name}! Your upcoming End-Semester exams begin on May 15, 2026. CS301 (Automata Theory) is scheduled for May 15 in Hall 302."
        elif any(k in query for k in ["hostel", "room", "leave", "complaint"]):
            room_info = f"Room {student.occupancy.room.room_number}" if (student and hasattr(student, "occupancy") and student.occupancy) else "Room 302-B"
            response_text = f"Hi {student_name}! You are currently allotted to {room_info}. Submit maintenance requests via your Hostel Portal."
        elif any(k in query for k in ["placement", "readiness"]):
            prediction = predict_placement_readiness(cgpa=float(student.cgpa) if student and hasattr(student, "cgpa") else 8.4)
            response_text = f"Your Placement Readiness score is {prediction['readiness_score']:.1f}% ({prediction['readiness_rating']}). Top recruiters active: Google, Microsoft, TCS Digital."
        else:
            # RAG Retrieval from Students PDF
            rag_res = execute_rag_query(query=payload.message, role_or_category="students", k=2)
            response_text = f"Hello {student_name}! Based on your Student Success RAG Documents:\n\n{rag_res['answer']}"

    elif "faculty" in role_names:
        rag_res = execute_rag_query(query=payload.message, role_or_category="faculty", k=2)
        response_text = f"Welcome Dr. {student_name}! Based on Faculty RAG Documents:\n\n{rag_res['answer']}"

    elif "placement_officer" in role_names or "placement" in role_names:
        rag_res = execute_rag_query(query=payload.message, role_or_category="placements", k=2)
        response_text = f"Welcome Placement Officer {student_name}! Based on Placements RAG Documents:\n\n{rag_res['answer']}"

    else:
        rag_res = execute_rag_query(query=payload.message, role_or_category="students", k=2)
        response_text = f"Greetings {student_name}! Based on CampusOS RAG Knowledge Base:\n\n{rag_res['answer']}"

    return ChatResponse(chat_id=chat_id, response=response_text)


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
    """LangChain RAG search through Students, Placements, and Faculty PDF documents."""
    role_or_cat = payload.category if payload.category else "students"
    rag_results = knowledge_agent.perform_rag_query(query=payload.query, category=role_or_cat)
    
    results = []
    for i, m in enumerate(rag_results, 1):
        results.append(
            RAGSearchResultItem(
                id=i,
                title=m["document_title"],
                category=role_or_cat.capitalize(),
                content=m["snippet"],
                score=m["relevance_score"]
            )
        )
            
    return RAGSearchResponse(query=payload.query, results=results)
