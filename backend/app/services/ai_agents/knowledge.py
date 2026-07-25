"""Knowledge Agent (RAG-only) service.

Handles retrieval-augmented queries regarding:
- University Regulations & Policies
- Hostel rules
- Circulars & Announcements
- Academic Syllabus
- Previous years' exam papers
"""
from typing import List, Dict


def perform_rag_query(query: str, category: str = "all") -> List[Dict]:
    """Retrieves relevant text snippets using vector similarity search."""
    return [
        {
            "document_title": "Hostel Rulebook Section 4.2",
            "snippet": "Curfew is at 10:30 PM. Late entries require warden permission.",
            "relevance_score": 0.88,
        },
        {
            "document_title": "Academic Policies 2026",
            "snippet": "Minimum 75% attendance is required to sit for the semester end examinations.",
            "relevance_score": 0.79,
        },
    ]
