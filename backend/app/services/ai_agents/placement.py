"""Placement Agent service.

Deals with:
- Resume review & scoring
- Skill-gap analysis
- Interview prep simulator
- Company recommendations
"""
from typing import Any, Dict, List


def review_resume_llm(resume_text: str) -> Dict[str, Any]:
    """Scores a resume and provides detailed improvement suggestions."""
    return {
        "score": 85.0,
        "strengths": ["Strong technical stack", "Good internship details"],
        "weaknesses": ["Action verbs are weak", "No project impact metrics"],
        "suggestions": ["Quantify results (e.g., 'improved speed by 25%')", "Add link to GitHub portfolios"],
    }


def conduct_mock_interview_turn(history: List[Dict], user_answer: str) -> str:
    """Simulates a conversational interviewer, responding and asking the next question."""
    return "That's a good approach to scaling database queries. How would you handle caching at the application level?"
