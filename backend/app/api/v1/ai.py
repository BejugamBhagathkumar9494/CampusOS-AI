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

router = APIRouter(prefix="/ai", tags=["AI & Agents"])


@router.post("/chat", response_model=ChatResponse)
def chat_with_agent(
    payload: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invoke the student success/academic agent via LangGraph flow routing."""
    query = payload.message.lower()
    chat_id = payload.chat_id or "session_1"
    
    # Get student profile if exists
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    student_name = current_user.full_name
    cgpa_str = f"with CGPA {student.cgpa}" if student else ""
    
    # Route logic based on query intents (simulating LangGraph Supervisor Router)
    if any(k in query for k in ["hostel", "room", "curfew", "complaint", "warden"]):
        # Hostel Agent
        rules = knowledge_agent.perform_rag_query(payload.message, "hostel")
        room_info = ""
        if student and student.occupancy:
            room_info = f" You are currently allotted room {student.occupancy.room.room_number} in {student.occupancy.room.block_name}."
        
        response_text = (
            f"Hi {student_name}! I queried the Hostel Agent rules database. "
            f"According to Section 4 of the Hostel Rulebook: 'Curfew is at 10:30 PM. Late entries require warden authorization.' "
            f"{room_info} Let me know if you would like me to file a support ticket."
        )
        
    elif any(k in query for k in ["explain", "algorithm", "networks", "quiz", "study", "subject"]):
        # Academic Agent
        if "quiz" in query:
            topic = "Computer Networks" if "networks" in query else "Automata Theory"
            questions = academic.generate_quiz(topic, 2)
            q_text = "\n\n".join([f"Q{q['question_id']}: {q['question']}\nOptions: {', '.join(q['options'])}" for q in questions])
            response_text = f"Generating a practice quiz on {topic} for you:\n\n{q_text}"
        elif "explain" in query:
            concept = "Dijkstra's Algorithm" if "dijkstra" in query else "Context-Free Grammars"
            explanation = academic.explain_concept(concept)
            response_text = f"Here is a summary from the Academic Agent: {explanation} It uses a greedy approach to find the shortest path."
        else:
            roadmap = academic.generate_learning_roadmap("Fullstack AI Development")
            response_text = f"Here is your study roadmap:\n" + "\n".join(roadmap)
            
    elif any(k in query for k in ["placement", "job", "tcs", "resume", "readiness"]):
        # Use the model trained from the supplied placement data, rather than a fixed score.
        prediction = predict_placement_readiness(cgpa=float(student.cgpa) if student else 7.0)
        response_text = (
            f"Your Placement Readiness prediction is {prediction['readiness_score']:.1f}% "
            f"({prediction['readiness_rating']}). This estimate is based on "
            f"{prediction['training_rows']:,} 2026 placement records. "
            "Recommended focus areas: System Design and mock coding rounds."
        )
    elif any(k in query for k in ["bus", "route", "eta", "transport"]):
        # Transport Agent
        response_text = (
            "Checking live tracking... Bus TS-09-UA-1234 on Route 10A is currently 8 minutes away from the Main Gate. "
            "Passenger density is High right now. I recommend waiting for the 10:15 AM shuttle if you want to avoid crowds."
        )
        
    elif any(k in query for k in ["fee", "scholarship", "transaction", "finance"]):
        # Finance Agent
        response_text = (
            f"Hi {student_name}, you have a pending semester fee of $1,250.00 due on next month. "
            "Also, you are matching 95% of eligibility requirements for the 'Merit Academic Excellence Grant' ($2,500). "
            "Would you like me to guide you through the application?"
        )
        
    elif any(k in query for k in ["book", "library", "borrow", "author", "isbn"]):
        # Library Agent
        response_text = (
            "Searching library shelves... 'Introduction to Algorithms' is available (3 copies in Rack C-4). "
            "However, 'Compilers: Principles, Techniques, and Tools' is currently out of stock. "
            "Would you like to reserve a copy or find similar recommendations?"
        )
        
    else:
        # Default RAG agent response
        response_text = (
            f"Hello {student_name} {cgpa_str}! I am your CampusOS AI assistant. "
            "I can assist you with hostel rules, explanation of concepts, quiz generation, placement reviews, "
            "bus timetables, or scholarship queries. How can I help you today?"
        )
        
    return ChatResponse(chat_id=chat_id, response=response_text)


@router.get("/chat/history")
def get_chat_history(user_id: str, db: Session = Depends(get_db)):
    """Retrieve chat history for the user."""
    # Placeholder: fetch from ai_chat_history table
    return {"user_id": user_id, "history": []}


@router.post("/knowledge/search", response_model=RAGSearchResponse)
def knowledge_rag_search(
    payload: RAGSearchQuery, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """RAG-only search through rules, circulars, syllabus, and policies."""
    # Query database documents or fall back to static vector search
    docs = db.query(KnowledgeDocument).filter(
        KnowledgeDocument.content.like(f"%{payload.query}%")
    ).all()
    
    results = []
    for d in docs:
        results.append(
            RAGSearchResultItem(
                id=d.id,
                title=d.title,
                category=d.category or "General",
                content=d.content,
                score=0.92
            )
        )
        
    # If no matches, seed with mock RAG results
    if not results:
        mock_results = knowledge_agent.perform_rag_query(payload.query)
        for i, m in enumerate(mock_results):
            results.append(
                RAGSearchResultItem(
                    id=i + 1,
                    title=m["document_title"],
                    category="Policy",
                    content=m["snippet"],
                    score=m["relevance_score"]
                )
            )
            
    return RAGSearchResponse(query=payload.query, results=results)

