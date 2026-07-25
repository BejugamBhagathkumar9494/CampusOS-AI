from fastapi import APIRouter

router = APIRouter(prefix="/notifications", tags=["Notifications & Announcements"])


@router.get("/")
def get_notifications(user_id: str):
    """Get active notifications for a specific user."""
    return {"user_id": user_id, "notifications": []}


@router.post("/send")
def send_notification(user_id: str, title: str, body: str):
    """Send a notification to a specific user."""
    return {"message": f"Notification sent to user {user_id}"}


@router.get("/announcements")
def get_announcements():
    """Get campus-wide announcements."""
    return {"announcements": []}


@router.post("/announcements")
def post_announcement(title: str, body: str, target_roles: str):
    """Publish a new campus-wide announcement."""
    return {"message": "Announcement published successfully"}
