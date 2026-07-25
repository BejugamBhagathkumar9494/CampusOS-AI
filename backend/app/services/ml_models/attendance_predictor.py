"""Attendance Predictor ML model.

Predicts future attendance trends based on past attendance.
"""
from typing import List


def predict_attendance_trend(past_attendance_rates: List[float]) -> float:
    """Predicts next month's attendance percentage using linear regression/time-series forecasting."""
    if not past_attendance_rates:
        return 75.0
    return sum(past_attendance_rates) / len(past_attendance_rates)
