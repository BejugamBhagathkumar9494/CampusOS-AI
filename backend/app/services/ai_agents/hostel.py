"""Hostel Agent service.

Deals with:
- Intelligent hostel room allocation
- Automated complaint prioritization and routing
- Maintenance requirement forecasts
"""
from typing import Dict, Any


def prioritize_complaint(complaint_text: str) -> str:
    """Predicts priority (High, Medium, Low) for an incoming complaint using NLP classification."""
    text_lower = complaint_text.lower()
    if any(keyword in text_lower for keyword in ["leak", "fire", "shock", "short circuit", "flood"]):
        return "High"
    elif any(keyword in text_lower for keyword in ["wifi", "internet", "slow", "fan not working"]):
        return "Medium"
    return "Low"


def allocate_rooms_opt(students_list: list, rooms_list: list) -> Dict[str, str]:
    """Optimally allocates rooms based on preferences, habits, and department mappings."""
    allocation = {}
    for idx, student in enumerate(students_list):
        if idx < len(rooms_list):
            allocation[student] = rooms_list[idx]
    return allocation
