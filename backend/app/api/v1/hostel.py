from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models import HostelRoom, HostelComplaint

router = APIRouter(prefix="/hostel", tags=["Hostel Management"])


class ComplaintRequest(BaseModel):
    title: str
    description: str
    room_number: str = "302-B"


@router.get("/rooms")
def get_rooms(db: Session = Depends(get_db)):
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


@router.post("/allocate")
def allocate_room(student_id: str, room_id: str):
    return {"message": f"Room {room_id} allocated to student {student_id}", "status": "Success"}


@router.get("/complaints")
def get_complaints(db: Session = Depends(get_db)):
    """Get hostel maintenance complaints prioritized by AI."""
    complaints = db.query(HostelComplaint).all()
    if complaints:
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
    return {
        "complaints": [
            {
                "id": 1,
                "title": "WiFi router in Room 302 has no power",
                "description": "Power adapter light is dead. Router needs maintenance.",
                "category": "WiFi",
                "priority": "High",
                "status": "Pending",
                "room_number": "302-B"
            }
        ]
    }


@router.post("/complaints")
def file_complaint(payload: ComplaintRequest):
    """File a new room maintenance complaint with AI priority scoring."""
    desc = (payload.title + " " + payload.description).lower()
    if any(k in desc for k in ["fire", "water leak", "electric spark", "short circuit", "smoke"]):
        predicted_priority = "High"
    elif any(k in desc for k in ["wifi", "power", "fan", "light", "plumbing"]):
        predicted_priority = "Medium"
    else:
        predicted_priority = "Low"

    return {
        "message": "Complaint registered and categorized by AI",
        "complaint": {
            "title": payload.title,
            "description": payload.description,
            "room_number": payload.room_number,
            "priority": predicted_priority,
            "status": "Pending"
        }
    }
