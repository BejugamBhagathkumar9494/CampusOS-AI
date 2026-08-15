from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, get_current_user, check_role
from app.models import User, Student, Attendance, Mark, Subject
from app.schemas import StudentResponse

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/", dependencies=[Depends(check_role(["admin", "faculty", "super_admin"]))])
def get_students(db: Session = Depends(get_db)):
    """Get list of students (Admin/Faculty/Super Admin only)."""
    students = db.query(Student).all()
    return [{
        "id": s.id,
        "roll_number": s.roll_number,
        "cgpa": s.cgpa,
        "current_semester": s.current_semester,
        "name": s.user.full_name,
        "email": s.user.email
    } for s in students]


@router.get("/me", response_model=StudentResponse)
def get_current_student(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Restrict this query to the authenticated user's ID.
    # This prevents one student from accessing another student's private data.
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Student profile not found for authenticated user"
        )
    return student


@router.get("/{student_id}/attendance")
def get_student_attendance(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get attendance statistics for a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found")
        
    # Level 2 Security: Verify user-specific ownership or elevated role
    if str(student.user_id) != str(current_user.id):
        user_roles = [r.name.lower() for r in current_user.roles]
        if not any(r in user_roles for r in ["admin", "faculty", "super_admin"]):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. You cannot view another student's attendance records.")
            
    # Calculate attendance per subject
    attendance_records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    subject_stats = {}
    for record in attendance_records:
        sub_id = record.subject_id
        if sub_id not in subject_stats:
            subject = db.query(Subject).filter(Subject.id == sub_id).first()
            subject_stats[sub_id] = {
                "subject_name": subject.name if subject else "Unknown",
                "subject_code": subject.code if subject else "",
                "total_classes": 0,
                "attended_classes": 0
            }
        subject_stats[sub_id]["total_classes"] += 1
        if bool(record.is_present):
            subject_stats[sub_id]["attended_classes"] += 1
            
    stats_list = []
    total_attended = 0
    total_classes = 0
    for sub_id, stat in subject_stats.items():
        rate = (stat["attended_classes"] / stat["total_classes"] * 100.0) if stat["total_classes"] > 0 else 100.0
        stats_list.append({
            "subject_name": stat["subject_name"],
            "subject_code": stat["subject_code"],
            "total_classes": stat["total_classes"],
            "attended_classes": stat["attended_classes"],
            "attendance_rate": round(rate, 1),
            "status": "Safe" if rate >= 75.0 else "Shortage Alert"
        })
        total_attended += stat["attended_classes"]
        total_classes += stat["total_classes"]
        
    overall_rate = (total_attended / total_classes * 100.0) if total_classes > 0 else 0.0
    return {
        "student_id": student_id,
        "roll_number": student.roll_number,
        "overall_rate": round(overall_rate, 1),
        "subjects": stats_list
    }


@router.get("/{student_id}/marks")
def get_student_marks(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get marks/grades for all semesters of a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found")
        
    # Level 2 Security: Verify user-specific ownership or elevated role
    if str(student.user_id) != str(current_user.id):
        user_roles = [r.name.lower() for r in current_user.roles]
        if not any(r in user_roles for r in ["admin", "faculty", "super_admin"]):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. You cannot view another student's marks.")
            
    marks = db.query(Mark).filter(Mark.student_id == student_id).all()
    return {
        "student_id": student_id,
        "semesters": [
            {
                "id": m.id,
                "semester": m.semester,
                "subject_code": m.subject.code,
                "subject_name": m.subject.name,
                "internal_marks": m.internal_marks,
                "external_marks": m.external_marks,
                "total_marks": m.total_marks
            }
            for m in marks
        ]
    }


