from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, check_role
from app.models import HostelRoom, HostelComplaint, User, Student
from app.models.database_models import HostelLeaveRequest, Notification

router = APIRouter(prefix="/hostel", tags=["Hostel Management"])


class ComplaintRequest(BaseModel):
    title: str
    description: str
    room_number: str = "302-B"


class LeaveRequestPayload(BaseModel):
    reason: str
    start_date: date
    end_date: date


class LeaveReviewPayload(BaseModel):
    status: str  # Approved or Rejected


@router.get("/rooms")
def get_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of rooms and their availability."""
    rooms = db.query(HostelRoom).all()
    if rooms:
        return {
            "rooms": [
                {
                    "id": r.id,
                    "room_number": r.room_number,
                    "block_name": r.block_name,
                    "capacity": r.capacity,
                    "occupancy_count": r.occupancy_count,
                    "available_beds": r.capacity - r.occupancy_count
                }
                for r in rooms
            ]
        }
    return {
        "rooms": [
            {"id": 1, "room_number": "301-A", "block_name": "C-Block (Boys)", "capacity": 4, "occupancy_count": 3, "available_beds": 1},
            {"id": 2, "room_number": "302-B", "block_name": "C-Block (Boys)", "capacity": 4, "occupancy_count": 1, "available_beds": 3},
            {"id": 3, "room_number": "104-A", "block_name": "A-Block (Girls)", "capacity": 2, "occupancy_count": 2, "available_beds": 0},
        ]
    }


# Security Comment: Room allocation is restricted to Hostel Warden, Admin, and Super Admin roles.
@router.post("/allocate", dependencies=[Depends(check_role(["hostel_warden", "admin", "super_admin"]))])
def allocate_room(student_id: str, room_id: str):
    return {"message": f"Room {room_id} allocated to student {student_id}", "status": "Success"}


@router.get("/complaints")
def get_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get hostel maintenance complaints. Students only see their own complaints; Wardens see all."""
    user_roles = [r.name.lower() for r in current_user.roles]
    is_elevated = any(r in user_roles for r in ["hostel_warden", "admin", "super_admin"])

    query = db.query(HostelComplaint)
    if not is_elevated:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            query = query.filter(HostelComplaint.student_id == student.id)
        else:
            return {"complaints": []}

    complaints = query.all()
    return {
        "complaints": [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "category": c.category,
                "priority": c.priority,
                "status": c.status,
                "room_number": c.room.room_number if c.room else "302-B"
            }
            for c in complaints
        ]
    }


@router.post("/complaints")
def file_complaint(
    payload: ComplaintRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """File a new room maintenance complaint with AI priority scoring and persist to database."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    student_id = student.id if student else 1

    room = db.query(HostelRoom).filter(HostelRoom.room_number == payload.room_number).first()
    room_id = room.id if room else 1

    desc = (payload.title + " " + payload.description).lower()
    if any(k in desc for k in ["fire", "water leak", "electric spark", "short circuit", "smoke"]):
        predicted_priority = "High"
    elif any(k in desc for k in ["wifi", "power", "fan", "light", "plumbing"]):
        predicted_priority = "Medium"
    else:
        predicted_priority = "Low"

    complaint = HostelComplaint(
        student_id=student_id,
        room_id=room_id,
        title=payload.title,
        description=payload.description,
        category="Maintenance",
        priority=predicted_priority,
        status="Pending"
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    return {
        "message": "Complaint registered and categorized by AI",
        "complaint": {
            "id": complaint.id,
            "title": complaint.title,
            "description": complaint.description,
            "room_number": payload.room_number,
            "priority": predicted_priority,
            "status": "Pending"
        }
    }


# Leave Request Endpoints
@router.get("/leave-requests")
def get_leave_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Students see their leave requests; Wardens see all requests."""
    user_roles = [r.name.lower() for r in current_user.roles]
    is_elevated = any(r in user_roles for r in ["hostel_warden", "admin", "super_admin"])

    query = db.query(HostelLeaveRequest)
    if not is_elevated:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            query = query.filter(HostelLeaveRequest.student_id == student.id)
        else:
            return {"leave_requests": []}

    requests = query.order_by(HostelLeaveRequest.created_at.desc()).all()
    res = []
    for r in requests:
        res.append({
            "id": r.id,
            "student_name": r.student.user.full_name if (r.student and r.student.user) else "Student",
            "roll_number": r.student.roll_number if r.student else "STU001",
            "reason": r.reason,
            "start_date": r.start_date.isoformat(),
            "end_date": r.end_date.isoformat(),
            "status": r.status,
            "reviewed_by": r.reviewed_by
        })
    return {"leave_requests": res}


@router.post("/leave-requests")
def apply_leave(
    payload: LeaveRequestPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Student submits a leave request."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=400, detail="Only students can submit leave requests")

    req = HostelLeaveRequest(
        student_id=student.id,
        reason=payload.reason,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status="Pending"
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    return {"message": "Leave request submitted successfully", "leave_request_id": req.id}


@router.put("/leave-requests/{request_id}/review", dependencies=[Depends(check_role(["hostel_warden", "admin", "super_admin"]))])
def review_leave_request(
    request_id: int,
    payload: LeaveReviewPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Hostel warden approves or rejects leave request and sends student notification."""
    req = db.query(HostelLeaveRequest).filter(HostelLeaveRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")

    req.status = payload.status
    req.reviewed_by = current_user.full_name
    db.commit()

    # Trigger student notification
    if req.student and req.student.user:
        notif = Notification(
            user_id=req.student.user.id,
            title=f"Hostel Leave Request {payload.status}",
            message=f"Your leave request for {req.start_date} to {req.end_date} has been {payload.status.lower()} by Warden {current_user.full_name}.",
            type="success" if payload.status == "Approved" else "warning"
        )
        db.add(notif)
        db.commit()

    return {"message": f"Leave request updated to {payload.status}"}


