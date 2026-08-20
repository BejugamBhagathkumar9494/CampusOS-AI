"""Attendance & Engagement Trend Predictor ML Model.

Applies trend forecasting and linear regression modeling to predict future attendance,
VLE engagement, and classroom participation rates.
"""
from __future__ import annotations

from typing import Dict, List, Any


def calculate_attendance_buffer(total_classes: int, attended_classes: int, target_pct: float = 75.0) -> Dict[str, Any]:
    """
    Calculates exact buffer metrics:
    - If current attendance < target_pct: returns required consecutive future classes to reach target_pct.
    - If current attendance >= target_pct: returns maximum allowed future absences before falling below target_pct.
    """
    if total_classes <= 0:
        return {
            "current_rate": 100.0,
            "target_pct": target_pct,
            "status": "Safe",
            "required_future_classes": 0,
            "margin_absences_allowed": 0,
            "message": "No classes logged yet."
        }

    current_rate = round((attended_classes / total_classes) * 100.0, 1)

    if current_rate >= target_pct:
        # Maximum additional absences 'a' such that (attended_classes) / (total_classes + a) >= target_pct / 100
        # attended_classes >= (total_classes + a) * target_pct / 100
        # a <= (attended_classes * 100 / target_pct) - total_classes
        import math
        margin = math.floor((attended_classes * 100.0 / target_pct) - total_classes)
        margin = max(0, margin)
        return {
            "current_rate": current_rate,
            "target_pct": target_pct,
            "status": "Safe",
            "required_future_classes": 0,
            "margin_absences_allowed": margin,
            "message": f"You are safe! You can miss up to {margin} class{'es' if margin != 1 else ''} without falling below {target_pct}%."
        }
    else:
        # Required consecutive present classes 'p' such that (attended_classes + p) / (total_classes + p) >= target_pct / 100
        # (attended_classes + p) * 100 >= target_pct * total_classes + target_pct * p
        # p * (100 - target_pct) >= target_pct * total_classes - 100 * attended_classes
        import math
        numerator = (target_pct * total_classes) - (100.0 * attended_classes)
        denominator = 100.0 - target_pct
        required_p = math.ceil(numerator / denominator) if denominator > 0 else 0
        required_p = max(1, required_p)
        return {
            "current_rate": current_rate,
            "target_pct": target_pct,
            "status": "Warning",
            "required_future_classes": required_p,
            "margin_absences_allowed": 0,
            "message": f"Shortage warning! You must attend the next {required_p} consecutive class{'es' if required_p != 1 else ''} to reach {target_pct}%."
        }


def predict_attendance_trend(past_attendance_rates: List[float], total_classes: int = 0, attended_classes: int = 0) -> Dict[str, Any]:
    """Predicts next month's attendance percentage using weighted linear trend extrapolation and calculates target buffer."""
    import numpy as np
    buffer_info = calculate_attendance_buffer(total_classes, attended_classes)

    if not past_attendance_rates:
        return {
            "predicted_attendance": buffer_info["current_rate"],
            "historical_avg": buffer_info["current_rate"],
            "trend": "Stable",
            "trend_slope": 0.0,
            "shortage_risk": buffer_info["status"] != "Safe",
            "recommendation": buffer_info["message"],
            "buffer": buffer_info,
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
    shortage_risk = pred_bounded < 75.0 or buffer_info["status"] != "Safe"

    return {
        "predicted_attendance": pred_bounded,
        "historical_avg": round(float(np.mean(rates)), 1),
        "trend": trend,
        "trend_slope": round(float(slope), 2),
        "shortage_risk": shortage_risk,
        "recommendation": buffer_info["message"],
        "buffer": buffer_info,
    }

