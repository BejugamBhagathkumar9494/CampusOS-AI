"""Academic & Curriculum Data ML API Router.

Exposes endpoints for dataset-backed student performance risk prediction,
curriculum analytics, and model anti-overfitting validation metrics.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import Student, User
from app.services.ml_models.curriculum_analyzer import get_curriculum_analytics_summary
from app.services.ml_models.performance_predictor import (
    get_academic_model_metrics,
    predict_student_risk,
    trainer,
)

router = APIRouter(prefix="/academics", tags=["Academics & Curriculum ML"])


class StudentRiskPredictionRequest(BaseModel):
    attendance: float = Field(default=80.0, ge=0.0, le=100.0, description="Attendance rate percentage")
    internals: float = Field(default=70.0, ge=0.0, le=100.0, description="Internal assessment marks")
    assignments: float = Field(default=75.0, ge=0.0, le=100.0, description="Assignment score percentage")
    cgpa: float = Field(default=7.5, ge=0.0, le=10.0, description="Cumulative Grade Point Average")
    num_of_prev_attempts: Optional[int] = Field(default=0, ge=0, description="Number of previous attempts")
    studied_credits: Optional[int] = Field(default=60, ge=0, description="Total studied credits")
    late_submissions: Optional[int] = Field(default=0, ge=0, description="Number of late assessment submissions")
    code_module: Optional[str] = Field(default="BBB", description="Course module code (e.g. AAA, BBB, CCC)")


@router.post("/predict-risk")
def predict_academic_risk(
    payload: StudentRiskPredictionRequest,
    current_user: User = Depends(get_current_user),
):
    """Predict student academic risk level and performance outcome using trained ML pipeline."""
    sample = payload.model_dump()
    result = predict_student_risk(
        attendance=payload.attendance,
        internals=payload.internals,
        assignments=payload.assignments,
        cgpa=payload.cgpa,
        **sample,
    )
    return result


@router.get("/curriculum-analytics")
def get_curriculum_analytics(
    current_user: User = Depends(get_current_user),
):
    """Retrieve curriculum-wide and course-module performance analytics from the academic dataset."""
    summary = get_curriculum_analytics_summary()
    if "error" in summary:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=summary["error"],
        )
    return summary


@router.get("/model-metrics")
def get_model_validation_metrics(
    current_user: User = Depends(get_current_user),
):
    """Retrieve ML model training metrics, validation scores, and anti-overfitting accuracy gap."""
    metrics = get_academic_model_metrics()
    return metrics


@router.get("/student/{student_id}/risk")
def get_student_risk_profile(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get academic risk profile for a specific student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    cgpa = float(student.cgpa) if student.cgpa else 7.0
    risk_prediction = predict_student_risk(
        attendance=85.0,
        internals=72.0,
        assignments=78.0,
        cgpa=cgpa,
        studied_credits=student.current_semester * 30,
    )

    return {
        "student_id": student.id,
        "roll_number": student.roll_number,
        "name": student.user.full_name if student.user else "Student",
        "cgpa": cgpa,
        "current_semester": student.current_semester,
        "risk_analysis": risk_prediction,
    }
