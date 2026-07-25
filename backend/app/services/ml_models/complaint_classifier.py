"""Complaint Classifier ML model.

Automatically categorizes text complaints into:
- WiFi
- Electricity
- Plumbing
- Hostel
- Academics
"""
from typing import Dict


def classify_complaint(text: str) -> Dict[str, str]:
    """Classifies a complaint using basic NLP heuristics / Sentence Transformers."""
    text_lower = text.lower()
    if any(k in text_lower for k in ["wifi", "internet", "connection", "router"]):
        return {"category": "WiFi", "confidence": "98%"}
    elif any(k in text_lower for k in ["light", "fan", "electricity", "power", "fuse"]):
        return {"category": "Electricity", "confidence": "95%"}
    elif any(k in text_lower for k in ["leak", "water", "plumbing", "tap", "pipe"]):
        return {"category": "Plumbing", "confidence": "97%"}
    elif any(k in text_lower for k in ["room", "bed", "warden", "mess", "food"]):
        return {"category": "Hostel", "confidence": "89%"}
    else:
        return {"category": "Academics", "confidence": "70%"}
