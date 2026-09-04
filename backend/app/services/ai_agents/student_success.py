"""Student Success Agent using LangGraph.

Deals with:
- Academic risk prediction
- Attendance prediction & monitoring
- Custom study planner generator
- Weekly learning recommendations
"""
from typing import Dict, Any


def run_student_success_agent(student_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """Runs the Student Success AI agent orchestration flow to analyze student data and return dynamic insights."""
    from app.services.ml_models.attendance_predictor import calculate_attendance_buffer, predict_attendance_trend

    total_cls = context.get("total_classes", 20)
    attended_cls = context.get("attended_classes", 17)
    past_rates = context.get("past_attendance_rates", [85.0])

    buffer_info = calculate_attendance_buffer(total_cls, attended_cls, target_pct=75.0)
    trend_prediction = predict_attendance_trend(past_rates, total_cls, attended_cls)

    overall_rate = buffer_info["current_rate"]
    risk_status = "High Risk" if overall_rate < 65.0 else "Warning" if overall_rate < 75.0 else "Safe"

    recommendations = []
    if buffer_info["status"] == "Warning":
        recommendations.append(f"CRITICAL: Attendance is currently {overall_rate}%. Attend the next {buffer_info['required_future_classes']} consecutive classes to regain 75% exam eligibility.")
        recommendations.append("Meet with your academic advisor regarding attendance condonation guidelines.")
    else:
        recommendations.append(f"Attendance is safe at {overall_rate}%. You can miss up to {buffer_info['margin_absences_allowed']} classes while maintaining 75%.")
        recommendations.append("Continue participating in upcoming lab sessions and internal quizzes.")


    # Check if student has mock interview session records to factor into success score
    from app.services.ai_agents.student_success_agent.interview_brain import INTERVIEW_SESSIONS
    recent_interviews = [s for s in INTERVIEW_SESSIONS.values() if s.get("student_id") == student_id]
    latest_eval = recent_interviews[-1].get("evaluation") if recent_interviews and "evaluation" in recent_interviews[-1] else None

    interview_readiness = {
        "completed_sessions": len(recent_interviews),
        "latest_score": latest_eval.get("overall_score") if latest_eval else None,
        "hire_decision": latest_eval.get("hire_decision") if latest_eval else "Not Attempted",
        "has_active_7day_plan": bool(latest_eval and latest_eval.get("seven_day_action_plan"))
    }

    return {
        "student_id": student_id,
        "academic_risk_status": risk_status,
        "current_attendance_rate": overall_rate,
        "predicted_attendance_trends": f"Projected at {trend_prediction['predicted_attendance']}% ({trend_prediction['trend']})",
        "buffer_analysis": buffer_info,
        "study_plan": {
            "focus_subjects": context.get("focus_subjects", ["Automata Theory", "Computer Networks"]),
            "hours_per_week": 12,
        },
        "interview_readiness": interview_readiness,
        "weekly_recommendations": recommendations,
    }


