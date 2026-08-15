"""Attendance & Engagement Trend Predictor ML Model.

Applies trend forecasting and linear regression modeling to predict future attendance,
VLE engagement, and classroom participation rates.
"""
from __future__ import annotations

from typing import Dict, List, Any


def predict_attendance_trend(past_attendance_rates: List[float]) -> Dict[str, Any]:
    """Predicts next month's attendance percentage using weighted linear trend extrapolation."""
    import numpy as np
    if not past_attendance_rates:
        return {
            "predicted_attendance": 75.0,
            "trend": "Stable",
            "confidence": "85.0%",
            "shortage_risk": False,
        }

    rates = np.array(past_attendance_rates, dtype=float)
    n = len(rates)

    if n == 1:
        pred = float(rates[0])
        slope = 0.0
    else:
        # Linear regression slope over time index
        x = np.arange(n)
        slope, intercept = np.polyfit(x, rates, 1)
        pred = float(slope * n + intercept)

    pred_bounded = round(max(0.0, min(100.0, pred)), 1)
    trend = "Improving" if slope > 0.5 else "Declining" if slope < -0.5 else "Stable"
    shortage_risk = pred_bounded < 75.0

    return {
        "predicted_attendance": pred_bounded,
        "historical_avg": round(float(np.mean(rates)), 1),
        "trend": trend,
        "trend_slope": round(float(slope), 2),
        "shortage_risk": shortage_risk,
        "recommendation": (
            "Attendance is on track."
            if not shortage_risk
            else "Attendance risk detected (<75%). Submit condonation request or attend extra sessions."
        ),
    }
