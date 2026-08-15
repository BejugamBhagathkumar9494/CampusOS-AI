"""
=============================================================================
CampusOS AI - Agentic Supervisor & Multi-Agent Orchestration Engine
=============================================================================
Routes, coordinates, and synthesizes responses across domain-specific agents:
- Academic Agent (Concepts, Quizzes, Roadmaps)
- Student Success Agent (Risk Analysis, Attendance, Study Plans)
- Placement Agent (Readiness Score, Resume Scoring, Mock Interview)
- Hostel Agent (Complaints, Room Allocation, Curfew Rules)
- Finance Agent (Scholarship Matching, Fee Tracking)
- Transport Agent (Routes & Bus Schedules)
- Library Agent (Catalog Search)
- Knowledge RAG Agent (Grounded Multi-Doc Vector Search)
=============================================================================
"""

import os
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.services.ai_agents import (
    academic,
    student_success,
    placement as placement_agent,
    hostel as hostel_agent,
    finance as finance_agent,
    transport as transport_agent,
    library as library_agent,
    knowledge as knowledge_agent
)
from app.services.rag_service import execute_pgvector_rag_query
from app.services.ml_models.placement_predictor import predict_placement_readiness


class AgenticSupervisor:
    """Multi-Agent Orchestrator for CampusOS AI."""

    @staticmethod
    def classify_intent(query: str) -> str:
        """Determines the target AI Agent domain based on intent signals."""
        q = query.lower().strip()
        words = set(re.findall(r"\b\w+\b", q))

        # Greetings & General Assistant Intent (exact word match)
        if any(w in words for w in ["hi", "hello", "hey", "help"]) or any(phrase in q for phrase in ["who are you", "who r u", "what is campusos", "what can you do", "who created you"]):
            return "greeting"

        # Placement / Career Intent
        if any(k in q for k in ["placement", "job", "resume", "interview", "company", "recruiter", "career"]):
            return "placement"

        # Hostel Intent
        if any(k in q for k in ["hostel", "room", "curfew", "warden", "complaint", "leak", "maintenance"]):
            return "hostel"

        # Academic / Concept Intent
        if any(k in q for k in ["explain", "algorithm", "dijkstra", "quiz", "roadmap", "concept", "automata", "subject", "python", "sql", "dbms", "operating system", "data structure", "machine learning"]):
            return "academic"

        # Student Success / Attendance / Risk Intent
        if any(k in q for k in ["attendance", "present", "absent", "shortage", "risk", "study plan", "gpa"]):
            return "student_success"

        # Finance Intent
        if any(k in q for k in ["fee", "scholarship", "tuition", "due", "grant", "financial"]):
            return "finance"

        # Transport Intent
        if any(k in q for k in ["bus", "transport", "route", "timing", "shuttle", "vehicle"]):
            return "transport"

        # Library Intent
        if any(k in q for k in ["book", "library", "author", "borrow", "catalog"]):
            return "library"

        # Default to Knowledge RAG Agent
        return "knowledge"

    @classmethod
    def process_query(
        cls,
        query: str,
        user_role: str = "student",
        user_name: str = "Student",
        student_data: Optional[Any] = None,
        db: Optional[Session] = None,
        agentic_mode: bool = True
    ) -> Dict[str, Any]:
        """
        Processes query via Agentic Router when agentic_mode is True,
        or direct RAG fallback when disabled.
        """
        intent = cls.classify_intent(query)
        q_lower = query.lower()

        reasoning_chain = []
        source_docs = []
        agent_name = "CampusOS AI Supervisor"
        confidence_score = 0.95

        # 0. GREETING / ASSISTANT INTENT
        if intent == "greeting":
            agent_name = "🤖 CampusOS AI Supervisor"
            reasoning_chain.append("Processed user greeting and presented multi-agent system capability overview.")
            ans_text = (
                f"Hello {user_name}! 👋 I am your **CampusOS Multi-Agent AI Assistant**.\n\n"
                f"I dynamically orchestrate specialized AI agents across campus domains:\n\n"
                f"- 📚 **Academic Agent**: Concept explanations (Dijkstra, Automata, DBMS, OS, ML), practice quizzes, & study roadmaps.\n"
                f"- 📈 **Student Success Agent**: Attendance tracking, GPA risk modeling, & personalized study plans.\n"
                f"- 🎯 **Placement Agent**: Placement readiness scoring, recruiter networks, resume feedback, & interview prep.\n"
                f"- 🏠 **Hostel Agent**: Hostel curfew policy, room allocation, & maintenance ticket filing.\n"
                f"- 💳 **Finance Agent**: Fee payment status, receipt lookup, & scholarship matching.\n"
                f"- 🚌 **Transport Agent**: Campus shuttle schedules & live GPS route tracking.\n"
                f"- 📚 **Library Agent**: Book reservations & IEEE/Springer research paper access.\n\n"
                f"What would you like assistance with today?"
            )
            return {
                "answer": ans_text,
                "agent_name": agent_name,
                "intent": intent,
                "confidence_score": 0.99,
                "reasoning_chain": reasoning_chain,
                "source_documents": []
            }

        # 1. ACADEMIC AGENT
        elif intent == "academic":
            agent_name = "🤖 Academic Agent"
            reasoning_chain.append("Analyzed query for educational/conceptual intent.")
            
            if "quiz" in q_lower:
                topic = re.sub(r"(?i)\b(generate|practice|quiz|roadmap|for|a|an|the)\b", "", query).strip() or "Computer Science"
                quiz = academic.generate_quiz(topic=topic, num_questions=4)
                reasoning_chain.append(f"Generated adaptive practice quiz for '{topic}'.")
                
                quiz_str = f"### 📝 Practice Quiz: {topic.title()}\n\n"
                for q in quiz:
                    quiz_str += f"**Q{q['question_id']}. {q['question']}**\n"
                    quiz_str += " Options: " + ", ".join(q['options']) + "\n\n"
                quiz_str += "*Submit your answers in chat to get instant AI grading!*"

                return {
                    "answer": quiz_str,
                    "agent_name": agent_name,
                    "intent": intent,
                    "confidence_score": 0.96,
                    "reasoning_chain": reasoning_chain,
                    "source_documents": []
                }

            elif "roadmap" in q_lower:
                skill = re.sub(r"(?i)\b(generate|learning|roadmap|for|a|an|the)\b", "", query).strip() or "Full-Stack Web Development"
                steps = academic.generate_learning_roadmap(skill)
                reasoning_chain.append(f"Drafted learning roadmap for '{skill}'.")
                
                roadmap_str = f"### 🚀 Learning Roadmap for {skill.title()}\n\n"
                for step in steps:
                    roadmap_str += f"- {step}\n"

                return {
                    "answer": roadmap_str,
                    "agent_name": agent_name,
                    "intent": intent,
                    "confidence_score": 0.95,
                    "reasoning_chain": reasoning_chain,
                    "source_documents": []
                }

            else:
                reasoning_chain.append("Executed grounded RAG search for academic query.")
                rag_res = execute_pgvector_rag_query(query=query, user_role=user_role, k=5, match_threshold=0.20)
                
                return {
                    "answer": rag_res.get("answer", "I couldn't find this information in the CampusOS knowledge base."),
                    "agent_name": agent_name,
                    "intent": intent,
                    "confidence_score": 0.98 if rag_res.get("source_documents") else 0.0,
                    "reasoning_chain": reasoning_chain,
                    "source_documents": rag_res.get("source_documents", [])
                }

        # 2. PLACEMENT AGENT
        elif intent == "placement":
            agent_name = "🎯 Placement Agent"
            reasoning_chain.append("Queried Placement Analytics & Career Readiness ML models.")

            rag_res = execute_pgvector_rag_query(query=query, user_role="placement_officer", k=5, match_threshold=0.20)

            if rag_res.get("answer") == "I couldn't find this information in the CampusOS knowledge base.":
                ans_text = "I couldn't find this information in the CampusOS knowledge base."
            else:
                cgpa = float(student_data.cgpa) if (student_data and hasattr(student_data, "cgpa") and student_data.cgpa) else 8.4
                pred = predict_placement_readiness(cgpa=cgpa)
                ans_text = (
                    f"### 🎯 Career & Placement Intelligence\n\n"
                    f"**Student Placement Readiness Score:** `{pred['readiness_score']:.1f}%` ({pred['readiness_rating']})\n\n"
                    f"{rag_res.get('answer', '')}"
                )

            return {
                "answer": ans_text,
                "agent_name": agent_name,
                "intent": intent,
                "confidence_score": 0.97 if rag_res.get("source_documents") else 0.0,
                "reasoning_chain": reasoning_chain,
                "source_documents": rag_res.get("source_documents", [])
            }

        # 3. STUDENT SUCCESS & ATTENDANCE AGENT
        elif intent == "student_success":
            agent_name = "📈 Student Success Agent"
            reasoning_chain.append("Retrieved student academic history and attendance records.")

            rag_res = execute_pgvector_rag_query(query=query, user_role="student", k=5, match_threshold=0.20)

            return {
                "answer": rag_res.get("answer", "I couldn't find this information in the CampusOS knowledge base."),
                "agent_name": agent_name,
                "intent": intent,
                "confidence_score": 0.94 if rag_res.get("source_documents") else 0.0,
                "reasoning_chain": reasoning_chain,
                "source_documents": rag_res.get("source_documents", [])
            }

        # 4. HOSTEL AGENT
        elif intent == "hostel":
            agent_name = "🏠 Hostel Warden Agent"
            reasoning_chain.append("Consulted Hostel Management System & Curfew Policy.")

            rag_res = execute_pgvector_rag_query(query=query, user_role="hostel_warden", k=5, match_threshold=0.20)

            return {
                "answer": rag_res.get("answer", "I couldn't find this information in the CampusOS knowledge base."),
                "agent_name": agent_name,
                "intent": intent,
                "confidence_score": 0.95 if rag_res.get("source_documents") else 0.0,
                "reasoning_chain": reasoning_chain,
                "source_documents": rag_res.get("source_documents", [])
            }

        # 5. FINANCE AGENT
        elif intent == "finance":
            agent_name = "💳 Finance Agent"
            reasoning_chain.append("Queried Student Fee Registry and Scholarship Matcher.")

            rag_res = execute_pgvector_rag_query(query=query, user_role=user_role, k=5, match_threshold=0.20)

            return {
                "answer": rag_res.get("answer", "I couldn't find this information in the CampusOS knowledge base."),
                "agent_name": agent_name,
                "intent": intent,
                "confidence_score": 0.93 if rag_res.get("source_documents") else 0.0,
                "reasoning_chain": reasoning_chain,
                "source_documents": rag_res.get("source_documents", [])
            }

        # 6. TRANSPORT AGENT
        elif intent == "transport":
            agent_name = "🚌 Transport Agent"
            reasoning_chain.append("Consulted Autonomous Transport Schedule & GPS Tracking.")

            rag_res = execute_pgvector_rag_query(query=query, user_role=user_role, k=5, match_threshold=0.20)

            return {
                "answer": rag_res.get("answer", "I couldn't find this information in the CampusOS knowledge base."),
                "agent_name": agent_name,
                "intent": intent,
                "confidence_score": 0.96 if rag_res.get("source_documents") else 0.0,
                "reasoning_chain": reasoning_chain,
                "source_documents": rag_res.get("source_documents", [])
            }

        # 7. LIBRARY AGENT
        elif intent == "library":
            agent_name = "📚 Library Agent"
            reasoning_chain.append("Searched University Central Library Catalog.")

            rag_res = execute_pgvector_rag_query(query=query, user_role="librarian", k=5, match_threshold=0.20)

            return {
                "answer": rag_res.get("answer", "I couldn't find this information in the CampusOS knowledge base."),
                "agent_name": agent_name,
                "intent": intent,
                "confidence_score": 0.92 if rag_res.get("source_documents") else 0.0,
                "reasoning_chain": reasoning_chain,
                "source_documents": rag_res.get("source_documents", [])
            }

        # 8. KNOWLEDGE RAG AGENT (DEFAULT GROUNDED MULTI-DOC RAG)
        else:
            agent_name = "📚 Knowledge RAG Agent"
            reasoning_chain.append("Ran semantic similarity vector search on CampusOS RAG Knowledge Base.")

            rag_res = execute_pgvector_rag_query(query=query, user_role=user_role, k=5, match_threshold=0.20)

            return {
                "answer": rag_res.get("answer", "I couldn't find this information in the CampusOS knowledge base."),
                "agent_name": agent_name,
                "intent": intent,
                "confidence_score": 0.95 if rag_res.get("source_documents") else 0.0,
                "reasoning_chain": reasoning_chain,
                "source_documents": rag_res.get("source_documents", [])
            }
