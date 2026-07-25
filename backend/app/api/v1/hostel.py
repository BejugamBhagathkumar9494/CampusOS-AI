from fastapi import APIRouter

router = APIRouter(prefix="/hostel", tags=["Hostel Management"])


@router.get("/rooms")
def get_rooms():
    """Get list of rooms and their availability."""
    return {"rooms": []}


@router.post("/allocate")
def allocate_room(student_id: str, room_id: str):
    """Allocate a room to a student."""
    return {"message": f"Room {room_id} allocated to student {student_id}"}


@router.get("/complaints")
def get_complaints():
    """Get hostel maintenance complaints (prioritized by AI)."""
    return {"complaints": []}


@router.post("/complaints")
def file_complaint(title: str, description: str, room_id: str):
    """File a new room maintenance complaint."""
    return {"message": "Complaint registered and categorized by AI"}
