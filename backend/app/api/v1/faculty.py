from typing import List, Optional
from datetime import date
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db, check_role
from app.models import User, Student, Subject, Attendance


router = APIRouter(prefix="/faculty", tags=["Faculty"])


class AttendanceMarkItem(BaseModel):
    student_id: int
    subject_id: int
    date: str
    is_present: bool


class AttendanceBatchPayload(BaseModel):
    records: List[AttendanceMarkItem]


@router.get("/")
def get_faculty_list(current_user: User = Depends(get_current_user)):
    """Get list of faculty members."""
    return {
        "faculty": [
            {"id": 1, "name": "Dr. Alan Turing", "department": "Computer Science & Engineering", "designation": "Professor & HOD", "email": "a.turing@university.edu"},
            {"id": 2, "name": "Dr. Grace Hopper", "department": "Information Technology", "designation": "Associate Professor", "email": "g.hopper@university.edu"},
            {"id": 3, "name": "Prof. Claude Shannon", "department": "Electrical & Electronics", "designation": "Assistant Professor", "email": "c.shannon@university.edu"},
        ]
    }


@router.get("/courses")
def get_faculty_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get academic courses from DB."""
    subjects = db.query(Subject).all()
    if not subjects:
        return [
            {"id": 1, "code": "CS101", "name": "Data Structures & Algorithms", "semester": 5},
            {"id": 2, "code": "CS102", "name": "Database Management Systems", "semester": 5},
            {"id": 3, "code": "CS103", "name": "Operating Systems & Architecture", "semester": 5},
            {"id": 4, "code": "CS104", "name": "Machine Learning & AI", "semester": 5}
        ]
    return [{"id": s.id, "code": s.code, "name": s.name, "semester": s.semester} for s in subjects]


@router.get("/courses/{subject_id}/roster")
def get_course_roster(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get student roster from DB for a course."""
    students = db.query(Student).all()
    res = []
    for s in students:
        res.append({
            "student_id": s.id,
            "roll_number": s.roll_number,
            "full_name": s.user.full_name if s.user else "Student",
            "email": s.user.email if s.user else "student@campus.edu",
            "current_semester": s.current_semester,
            "cgpa": float(s.cgpa) if s.cgpa else 8.0
        })
    return {"subject_id": subject_id, "students": res}


@router.post("/attendance", dependencies=[Depends(check_role(["faculty", "admin", "super_admin"]))])
def mark_faculty_attendance(
    payload: AttendanceBatchPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Faculty marks student attendance in DB."""
    saved_count = 0
    for item in payload.records:
        parsed_date = date.fromisoformat(item.date) if isinstance(item.date, str) else item.date
        att = Attendance(
            student_id=item.student_id,
            subject_id=item.subject_id,
            date=parsed_date,
            is_present=item.is_present
        )
        db.add(att)
        saved_count += 1

    db.commit()
    return {"message": f"Successfully marked attendance for {saved_count} students in DB."}


@router.get("/{faculty_id}/schedule")
def get_faculty_schedule(faculty_id: str, current_user: User = Depends(get_current_user)):
    """Get weekly class schedule for a faculty member."""
    return {
        "faculty_id": faculty_id,
        "schedule": [
            {"day": "Monday", "subject": "Automata Theory (CS301)", "time": "10:00 AM - 11:30 AM", "room": "LH-101"},
            {"day": "Wednesday", "subject": "Computer Networks (CS302)", "time": "02:00 PM - 03:30 PM", "room": "Lab-3"},
            {"day": "Friday", "subject": "Placement Mock Technical Evaluation", "time": "11:00 AM - 01:00 PM", "room": "Seminar Hall"}
        ]
    }


@router.get("/departments")
def get_departments(current_user: User = Depends(get_current_user)):
    """Get list of academic departments."""
    return {
        "departments": [
            {"id": 1, "name": "Computer Science & Engineering", "code": "CSE", "student_count": 420},
            {"id": 2, "name": "Information Technology", "code": "IT", "student_count": 310},
            {"id": 3, "name": "Electrical & Electronics Engineering", "code": "EEE", "student_count": 280},
            {"id": 4, "name": "Mechanical Engineering", "code": "MECH", "student_count": 240},
            {"id": 5, "name": "Civil Engineering", "code": "CIVIL", "student_count": 200},
        ]
    }

