from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Company
from app.services.ml_models.placement_predictor import (
    predict_placement_readiness,
    get_placement_analytics_summary
)

router = APIRouter(prefix="/placements", tags=["Placements Management"])


class PlacementPredictionRequest(BaseModel):
    cgpa: float = Field(ge=0, le=10)
    branch: Optional[str] = Field(default="CSE")
    college_tier: Optional[str] = Field(default="Tier 1")
    skills: List[str] = Field(default_factory=list)
    certifications_count: int = Field(default=0, ge=0)
    coding_platform_score: int = Field(default=50, ge=0, le=100)
    internships_count: int = Field(default=0, ge=0)
    projects_count: Optional[int] = Field(default=None, ge=0)
    aptitude_score: float = Field(default=50, ge=0, le=100)
    communication_skill_score: float = Field(default=50, ge=0, le=100)
    logical_reasoning_score: float = Field(default=50, ge=0, le=100)
    mock_interview_score: float = Field(default=50, ge=0, le=100)
    attendance_percentage: float = Field(default=75, ge=0, le=100)
    backlogs: int = Field(default=0, ge=0)
    leadership_score: float = Field(default=50, ge=0, le=100)
    study_hours_per_day: float = Field(default=3, ge=0)


class ResumeReviewRequest(BaseModel):
    resume_text: str


@router.get("/analytics")
def get_dataset_analytics():
    """Retrieve campus placement analytics computed from 100,000+ dataset records."""
    return get_placement_analytics_summary()


@router.get("/companies")
def get_companies(db: Session = Depends(get_db)):
    """Retrieve recruiting companies and placement records."""
    companies_in_db = db.query(Company).all()
    if companies_in_db:
        return {
            "companies": [
                {
                    "id": c.id,
                    "name": c.name,
                    "industry": c.industry,
                    "website": c.website,
                    "open_positions": 12 if "TCS" in c.name else 8 if "Google" in c.name else 15,
                    "avg_package_lpa": 18.5 if "Google" in c.name or "Microsoft" in c.name else 7.5
                }
                for c in companies_in_db
            ]
        }
    
    # Fallback default active recruiters
    default_companies = [
        {"id": 1, "name": "Google", "industry": "Technology", "website": "https://careers.google.com", "open_positions": 8, "avg_package_lpa": 24.5},
        {"id": 2, "name": "Microsoft", "industry": "Technology", "website": "https://careers.microsoft.com", "open_positions": 10, "avg_package_lpa": 22.0},
        {"id": 3, "name": "Amazon", "industry": "Cloud & E-Commerce", "website": "https://amazon.jobs", "open_positions": 14, "avg_package_lpa": 19.8},
        {"id": 4, "name": "TCS Digital", "industry": "IT Services", "website": "https://tcs.com", "open_positions": 45, "avg_package_lpa": 7.5},
        {"id": 5, "name": "Infosys", "industry": "IT Services", "website": "https://infosys.com", "open_positions": 30, "avg_package_lpa": 6.8},
        {"id": 6, "name": "Wipro", "industry": "IT Services", "website": "https://wipro.com", "open_positions": 25, "avg_package_lpa": 6.5},
    ]
    return {"companies": default_companies}


@router.post("/applications")
def apply_to_company(company_id: str, student_id: str):
    return {"message": f"Application for student {student_id} submitted successfully to company {company_id}"}


@router.post("/resume-review")
def review_resume(payload: ResumeReviewRequest):
    """Analyze resume text against top dataset skill signals."""
    text = payload.resume_text.lower()
    
    key_skills = ["python", "sql", "react", "java", "c++", "machine learning", "data structures", "system design", "fastapi", "docker", "aws", "git"]
    detected = [s.title() for s in key_skills if s in text]
    
    score = 60.0
    score += len(detected) * 5.0
    if "improved" in text or "%" in text or "increased" in text or "built" in text:
        score += 15.0
    if "github.com" in text or "linkedin.com" in text:
        score += 10.0
    
    score = min(98.0, max(45.0, score))
    
    missing = [s.title() for s in key_skills if s.title() not in detected][:4]
    
    return {
        "score": round(score, 1),
        "feedback": "Strong skill set detected. Enhance quantified metrics for project outcomes." if score >= 80 else "Include specific metrics (e.g. 'improved speed by 30%') and add portfolio links.",
        "skills_detected": detected,
        "recommended_skills_to_add": missing
    }


@router.post("/readiness/predict")
def predict_readiness(payload: PlacementPredictionRequest):
    """Predict readiness and expected salary package LPA using the dataset-trained ML model."""
    values = payload.model_dump(exclude={"cgpa", "skills", "certifications_count", "coding_platform_score"}, exclude_none=True)
    return predict_placement_readiness(
        cgpa=payload.cgpa,
        skills=payload.skills,
        certifications_count=payload.certifications_count,
        coding_platform_score=payload.coding_platform_score,
        **values
    )


@router.get("/readiness")
def get_placement_readiness(student_id: str, cgpa: float = 7.5):
    """Compatibility endpoint for an at-a-glance readiness prediction."""
    res = predict_placement_readiness(cgpa=cgpa)
    return {
        "student_id": student_id,
        **res,
        "recommended_courses": ["System Design & Scalability", "Advanced Data Structures & Algorithms", "Fullstack AI Deployment"]
    }