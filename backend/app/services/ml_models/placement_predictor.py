"""Placement Predictor ML model.

Estimates placement readiness using skills, CGPA, coding progress, and certifications.
"""
from typing import List, Dict, Any



def predict_placement_readiness(
    cgpa: float,
    skills: List[str],
    certifications_count: int,
    coding_platform_score: int,
) -> Dict[str, Any]:
    """Calculates placement readiness score and maps to a rating."""
    score = (cgpa * 5.0) + (len(skills) * 3.0) + (certifications_count * 5.0) + (coding_platform_score / 100.0)
    
    # Normalize to 0-100 scale
    normalized_score = min(100.0, max(0.0, score))
    
    if normalized_score > 80.0:
        readiness = "Ready"
    elif normalized_score > 50.0:
        readiness = "Needs Improvement"
    else:
        readiness = "Unprepared"
        
    return {
        "readiness_score": normalized_score,
        "readiness_rating": readiness,
    }
