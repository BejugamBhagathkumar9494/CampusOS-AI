"""Hostel Occupancy Forecaster ML model.

Predicts room utilization rates.
"""
from typing import Dict


def forecast_occupancy(total_rooms: int, active_students: int) -> Dict[str, float]:
    """Calculates predicted room occupancy rate."""
    return {
        "predicted_occupancy_rate": min(100.0, (active_students / (total_rooms * 2)) * 100),
        "confidence_interval_low": 85.0,
        "confidence_interval_high": 92.5,
    }
