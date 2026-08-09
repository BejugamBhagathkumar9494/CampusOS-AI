from datetime import datetime, date, time, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, check_role
from app.models.database_models import (
    User, Student, Faculty, Subject, ExamTimetable, GradePrediction,
    Assignment, AssignmentSubmission, Announcement, Club, ClubMembership, Mark, Attendance
)
from app.schemas.schemas import (
    ExamTimetableResponse, GradePredictionResponse, AssignmentCreate, AssignmentResponse,
    AssignmentSubmissionCreate, AssignmentSubmissionResponse, AnnouncementCreate, AnnouncementResponse, ClubResponse
)

router = APIRouter()


# 1. Exam Timetable & Grade Predictions
@router.get("/exams/me", response_model=List[ExamTimetableResponse])
def get_my_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves authorized exam timetable for current student's semester.
    """
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        # Return default exams if not a student
        exams = db.query(ExamTimetable).all()
        res = []
        for e in exams:
            res.append({
                "id": e.id,
                "subject_code": e.subject.code if e.subject else "CS301",
                "subject_name": e.subject.name if e.subject else "Automata Theory",
                "semester": e.semester,
                "exam_date": e.exam_date,
                "start_time": e.start_time,
                "end_time": e.end_time,
                "room_number": e.room_number,
                "exam_type": e.exam_type
            })
        return res

    exams = db.query(ExamTimetable).filter(ExamTimetable.semester == student.current_semester).all()
    res = []
    for e in exams:
        res.append({
            "id": e.id,
            "subject_code": e.subject.code if e.subject else "CS301",
            "subject_name": e.subject.name if e.subject else "Subject",
            "semester": e.semester,
            "exam_date": e.exam_date,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "room_number": e.room_number,
            "exam_type": e.exam_type
        })
    return res


@router.get("/exams/predictions/me", response_model=List[GradePredictionResponse])
def get_my_grade_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Calculates dynamic grade predictions based on internal marks and attendance percentage.
    """
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        return []

    subjects = db.query(Subject).all()
    predictions = []

    for sub in subjects:
        # Check existing prediction or calculate dynamically
        pred_record = db.query(GradePrediction).filter(
            GradePrediction.student_id == student.id,
            GradePrediction.subject_id == sub.id
        ).first()

        if pred_record:
            predictions.append({
                "id": pred_record.id,
                "subject_code": sub.code,
                "subject_name": sub.name,
                "predicted_grade": pred_record.predicted_grade,
                "predicted_score": pred_record.predicted_score,
                "confidence": pred_record.confidence
            })
        else:
            # Calculate dynamic prediction based on attendance and internal marks
            mark = db.query(Mark).filter(Mark.student_id == student.id, Mark.subject_id == sub.id).first()
            internal_pct = (mark.internal_marks / 50.0) * 100.0 if mark else 80.0

            total_att = db.query(Attendance).filter(Attendance.student_id == student.id, Attendance.subject_id == sub.id).count()
            present_att = db.query(Attendance).filter(Attendance.student_id == student.id, Attendance.subject_id == sub.id, Attendance.is_present == True).count()
            att_pct = (present_att / total_att * 100.0) if total_att > 0 else 85.0

            score_est = (internal_pct * 0.5) + (att_pct * 0.5)
            if score_est >= 90:
                grade, score_range = "A+", "90-98%"
            elif score_est >= 80:
                grade, score_range = "A", "80-89%"
            elif score_est >= 70:
                grade, score_range = "B+", "70-79%"
            else:
                grade, score_range = "B", "60-69%"

            predictions.append({
                "id": sub.id,
                "subject_code": sub.code,
                "subject_name": sub.name,
                "predicted_grade": grade,
                "predicted_score": score_range,
                "confidence": round(80.0 + (att_pct * 0.15), 1)
            })

    return predictions


# 2. Assignments & Submissions
@router.get("/assignments", response_model=List[AssignmentResponse])
def list_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    assignments = db.query(Assignment).order_by(Assignment.deadline.asc()).all()
    res = []
    for a in assignments:
        res.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "subject_code": a.subject.code if a.subject else "CS301",
            "subject_name": a.subject.name if a.subject else "Subject",
            "faculty_name": a.faculty.user.full_name if (a.faculty and a.faculty.user) else "Faculty",
            "deadline": a.deadline,
            "created_at": a.created_at
        })
    return res


@router.post("/assignments", response_model=AssignmentResponse, dependencies=[Depends(check_role(["faculty", "admin", "super_admin"]))])
def create_assignment(
    assignment_in: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    faculty_id = faculty.id if faculty else 1

    assignment = Assignment(
        title=assignment_in.title,
        description=assignment_in.description,
        faculty_id=faculty_id,
        subject_id=assignment_in.subject_id,
        deadline=assignment_in.deadline
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "id": assignment.id,
        "title": assignment.title,
        "description": assignment.description,
        "subject_code": assignment.subject.code if assignment.subject else "CS301",
        "subject_name": assignment.subject.name if assignment.subject else "Subject",
        "faculty_name": current_user.full_name,
        "deadline": assignment.deadline,
        "created_at": assignment.created_at
    }


@router.post("/assignments/{assignment_id}/submit", response_model=AssignmentSubmissionResponse, dependencies=[Depends(check_role(["student"]))])
def submit_assignment(
    assignment_id: int,
    submission_in: AssignmentSubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=400, detail="Only students can submit assignments")

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    submission = AssignmentSubmission(
        assignment_id=assignment_id,
        student_id=student.id,
        file_path=submission_in.file_path,
        submission_date=datetime.utcnow(),
        status="Submitted"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return {
        "id": submission.id,
        "assignment_id": assignment.id,
        "assignment_title": assignment.title,
        "student_id": student.id,
        "student_name": current_user.full_name,
        "file_path": submission.file_path,
        "submission_date": submission.submission_date,
        "marks_obtained": submission.marks_obtained,
        "feedback": submission.feedback,
        "status": submission.status
    }


# 3. Announcements & Clubs
@router.get("/announcements", response_model=List[AnnouncementResponse])
def get_announcements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    announcements = db.query(Announcement).order_by(Announcement.created_at.desc()).all()
    return announcements


@router.post("/announcements", response_model=AnnouncementResponse, dependencies=[Depends(check_role(["faculty", "admin", "super_admin"]))])
def create_announcement(
    ann_in: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ann = Announcement(
        title=ann_in.title,
        content=ann_in.content,
        author_role=current_user.user_profile.role if hasattr(current_user, 'user_profile') else "admin",
        target_role=ann_in.target_role
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann


@router.get("/clubs", response_model=List[ClubResponse])
def list_clubs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    clubs = db.query(Club).all()
    res = []
    for c in clubs:
        is_member = False
        if student:
            mem = db.query(ClubMembership).filter(ClubMembership.club_id == c.id, ClubMembership.student_id == student.id).first()
            if mem and mem.status == "Active":
                is_member = True
        res.append({
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "category": c.category,
            "president_name": c.president_name,
            "is_member": is_member
        })
    return res


@router.post("/clubs/{club_id}/join")
def join_club(
    club_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=400, detail="Only students can join clubs")

    existing = db.query(ClubMembership).filter(ClubMembership.club_id == club_id, ClubMembership.student_id == student.id).first()
    if existing:
        existing.status = "Active"
    else:
        mem = ClubMembership(club_id=club_id, student_id=student.id, status="Active")
        db.add(mem)

    db.commit()
    return {"message": "Joined club successfully"}
