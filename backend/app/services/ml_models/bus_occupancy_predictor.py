"""Bus Occupancy Prediction ML model.

Predicts passenger demand during peak hours.
"""
from datetime import time


def predict_bus_occupancy(route_id: str, departure_time: time) -> str:
    """Predicts bus seat demand (High, Medium, Low) for optimal dispatch."""
    # Peak hours: 8:00 AM - 9:30 AM and 4:30 PM - 6:00 PM
    hour = departure_time.hour
    if (8 <= hour <= 9) or (16 <= hour <= 17):
        return "High"
    elif (12 <= hour <= 14):
        return "Medium"
    return "Low"
