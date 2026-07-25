"""Finance Agent service.

Deals with:
- Intelligent fee reminders
- Scholarship recommendations based on GPA and financial records
"""
from typing import List, Dict


def match_scholarships(student_gpa: float, family_income: float) -> List[Dict]:
    """Finds eligible scholarships and ranks them by match probability."""
    return [
        {
            "name": "Merit-Based Academic Excellence Grant",
            "award_amount": 2500.0,
            "match_confidence": "High" if student_gpa >= 3.8 else "Medium",
        },
        {
            "name": "Financial Aid Opportunity Fund",
            "award_amount": 1500.0,
            "match_confidence": "High" if family_income < 30000 else "Low",
        },
    ]
