from fastapi import APIRouter

router = APIRouter(prefix="/faculty", tags=["Faculty"])


@router.get("/")
def get_faculty_list():
    """Get list of faculty members."""
    return {"faculty": []}


@router.get("/{faculty_id}/schedule")
def get_faculty_schedule(faculty_id: str):
    """Get weekly class schedule for a faculty member."""
    return {"faculty_id": faculty_id, "schedule": []}


@router.get("/departments")
def get_departments():
    """Get list of academic departments."""
    return {"departments": []}
