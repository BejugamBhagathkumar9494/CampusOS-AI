from fastapi import APIRouter

router = APIRouter(prefix="/faculty", tags=["Faculty"])


@router.get("/")
def get_faculty_list():
    """Get list of faculty members."""
    return {
        "faculty": [
            {"id": 1, "name": "Dr. Alan Turing", "department": "Computer Science & Engineering", "designation": "Professor & HOD", "email": "a.turing@university.edu"},
            {"id": 2, "name": "Dr. Grace Hopper", "department": "Information Technology", "designation": "Associate Professor", "email": "g.hopper@university.edu"},
            {"id": 3, "name": "Prof. Claude Shannon", "department": "Electrical & Electronics", "designation": "Assistant Professor", "email": "c.shannon@university.edu"},
        ]
    }


@router.get("/{faculty_id}/schedule")
def get_faculty_schedule(faculty_id: str):
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
def get_departments():
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
