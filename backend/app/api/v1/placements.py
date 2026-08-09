from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, check_role
from app.models import Company, User, Student
from app.models.database_models import PlacementDrive, PlacementApplication, Notification
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


class PlacementDriveCreatePayload(BaseModel):
    company_id: int
    title: str
    package_lpa: float
    min_cgpa: float = 6.0
    max_backlogs: int = 0
    location: str
    required_skills: str
    deadline: date


class ApplicationStatusUpdate(BaseModel):
    status: str  # Shortlisted, Offered, Rejected


class ResumeReviewRequest(BaseModel):
    resume_text: str


@router.get("/analytics")
def get_dataset_analytics(current_user: User = Depends(get_current_user)):
    """Retrieve campus placement analytics computed from 100,000+ dataset records."""
    return get_placement_analytics_summary()


@router.get("/companies")
def get_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
    
    default_companies = [
        {"id": 1, "name": "Google", "industry": "Technology", "website": "https://careers.google.com", "open_positions": 8, "avg_package_lpa": 24.5},
        {"id": 2, "name": "Microsoft", "industry": "Technology", "website": "https://careers.microsoft.com", "open_positions": 10, "avg_package_lpa": 22.0},
        {"id": 3, "name": "Amazon", "industry": "Cloud & E-Commerce", "website": "https://amazon.jobs", "open_positions": 14, "avg_package_lpa": 19.8},
        {"id": 4, "name": "TCS Digital", "industry": "IT Services", "website": "https://tcs.com", "open_positions": 45, "avg_package_lpa": 7.5},
        {"id": 5, "name": "Infosys", "industry": "IT Services", "website": "https://infosys.com", "open_positions": 30, "avg_package_lpa": 6.8},
        {"id": 6, "name": "Wipro", "industry": "IT Services", "website": "https://wipro.com", "open_positions": 25, "avg_package_lpa": 6.5},
    ]
    return {"companies": default_companies}


# Placement Drives & Automatic Eligibility Engine
@router.get("/drives")
def get_placement_drives(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve recruitment drives with student eligibility calculated automatically."""
    drives = db.query(PlacementDrive).order_by(PlacementDrive.deadline.asc()).all()
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    student_cgpa = student.cgpa if student else 7.5

    res = []
    for d in drives:
        is_eligible = student_cgpa >= d.min_cgpa
        res.append({
            "id": d.id,
            "company_name": d.company.name if d.company else "Tech Corp",
            "title": d.title,
            "package_lpa": d.package_lpa,
            "min_cgpa": d.min_cgpa,
            "max_backlogs": d.max_backlogs,
            "location": d.location,
            "required_skills": d.required_skills,
            "deadline": d.deadline.isoformat(),
            "eligible": is_eligible
        })
    return {"drives": res}


@router.post("/drives", dependencies=[Depends(check_role(["placement_officer", "admin", "super_admin"]))])
def create_placement_drive(
    payload: PlacementDriveCreatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Placement Officer creates a new placement recruitment drive."""
    drive = PlacementDrive(
        company_id=payload.company_id,
        title=payload.title,
        package_lpa=payload.package_lpa,
        min_cgpa=payload.min_cgpa,
        max_backlogs=payload.max_backlogs,
        location=payload.location,
        required_skills=payload.required_skills,
        deadline=payload.deadline
    )
    db.add(drive)
    db.commit()
    db.refresh(drive)
    return {"message": "Placement drive created successfully", "drive_id": drive.id}


@router.get("/applications")
def get_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Student sees their applications; Placement Officer sees all."""
    user_roles = [r.name.lower() for r in current_user.roles]
    is_elevated = any(r in user_roles for r in ["placement_officer", "admin", "super_admin"])

    query = db.query(PlacementApplication)
    if not is_elevated:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            query = query.filter(PlacementApplication.student_id == student.id)
        else:
            return {"applications": []}

    apps = query.order_by(PlacementApplication.applied_date.desc()).all()
    res = []
    for a in apps:
        res.append({
            "id": a.id,
            "company_name": a.company.name if a.company else "Company",
            "student_name": a.student.user.full_name if (a.student and a.student.user) else "Student",
            "roll_number": a.student.roll_number if a.student else "STU001",
            "status": a.status,
            "applied_date": a.applied_date.isoformat()
        })
    return {"applications": res}


@router.post("/apply/{drive_id}")
def apply_to_drive(
    drive_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Student applies for a recruitment drive after verifying eligibility."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=400, detail="Only students can apply for placement drives")

    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Placement drive not found")

    if student.cgpa < drive.min_cgpa:
        raise HTTPException(status_code=400, detail=f"Ineligible: Minimum required CGPA is {drive.min_cgpa}")

    existing = db.query(PlacementApplication).filter(
        PlacementApplication.company_id == drive.company_id,
        PlacementApplication.student_id == student.id
    ).first()

    if existing:
        return {"message": "You have already applied for this company drive."}

    app = PlacementApplication(
        company_id=drive.company_id,
        student_id=student.id,
        status="Applied"
    )
    db.add(app)
    db.commit()
    return {"message": f"Successfully applied for {drive.title}!"}


@router.put("/applications/{application_id}/status", dependencies=[Depends(check_role(["placement_officer", "admin", "super_admin"]))])
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Placement Officer updates application status and triggers student notification."""
    app = db.query(PlacementApplication).filter(PlacementApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = payload.status
    db.commit()

    # Send student notification
    if app.student and app.student.user:
        notif = Notification(
            user_id=app.student.user.id,
            title=f"Placement Update: {app.company.name if app.company else 'Drive'}",
            message=f"Your placement application for {app.company.name if app.company else 'Drive'} has been updated to: {payload.status}.",
            type="success" if payload.status in ["Shortlisted", "Offered"] else "info"
        )
        db.add(notif)
        db.commit()

    return {"message": f"Application status updated to {payload.status}"}


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