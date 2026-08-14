from datetime import date, datetime, time
from typing import List, Optional
from pydantic import BaseModel, EmailStr


# Token / Authentication Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    institution_id: Optional[str] = None
    status: Optional[str] = "active"
    is_active: Optional[bool] = True


class UserCreate(UserBase):
    password: str
    role: str = "student"


class AdminUserCreate(BaseModel):
    email: EmailStr
    full_name: str
    institution_id: str
    role: str = "admin"
    password: str


class UserStatusUpdate(BaseModel):
    status: str  # active, suspended, rejected, pending


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None


class RoleSchema(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class UserResponse(UserBase):
    id: int
    role: Optional[str] = None
    created_at: datetime
    roles: List[RoleSchema] = []

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: int
    actor_user_id: Optional[str] = None
    action: str
    target_user_id: Optional[str] = None
    timestamp: datetime
    metadata_json: Optional[str] = None

    class Config:
        from_attributes = True



# Student Schemas
class StudentBase(BaseModel):
    roll_number: str
    current_semester: Optional[int] = 1


class StudentCreate(StudentBase):
    user_id: int


class StudentResponse(StudentBase):
    id: int
    cgpa: float
    user: UserResponse

    class Config:
        from_attributes = True


# Hostel Schemas
class HostelRoomBase(BaseModel):
    room_number: str
    block_name: str
    capacity: int


class HostelRoomResponse(HostelRoomBase):
    id: int
    occupancy_count: int

    class Config:
        from_attributes = True


class HostelComplaintCreate(BaseModel):
    title: str
    description: str
    room_id: int
    category: str


class HostelComplaintResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# Library Schemas
class BookBase(BaseModel):
    title: str
    author: str
    isbn: str
    category: Optional[str] = None
    copies_available: int


class BookResponse(BookBase):
    id: int

    class Config:
        from_attributes = True


# Placement Schemas
class ResumeReviewResponse(BaseModel):
    score: float
    feedback: str
    skills_detected: List[str]


class PlacementReadinessResponse(BaseModel):
    student_id: int
    readiness_score: float
    recommended_courses: List[str]


# AI Chat Schemas
class ChatMessage(BaseModel):
    message: str
    chat_id: Optional[str] = None
    category: Optional[str] = None
    role: Optional[str] = None
    agentic_mode: Optional[bool] = True


class ChatResponse(BaseModel):
    chat_id: str
    response: str
    agent_name: Optional[str] = None
    confidence_score: Optional[float] = None
    reasoning_chain: Optional[List[str]] = None
    source_documents: Optional[List[dict]] = None



# Knowledge Search Schemas
class RAGSearchQuery(BaseModel):
    query: str


class RAGSearchResultItem(BaseModel):
    id: int
    title: str
    category: str
    content: str
    score: Optional[float] = None


class RAGSearchResponse(BaseModel):
    query: str
    results: List[RAGSearchResultItem]


# Extended Platform Schemas
class ExamTimetableResponse(BaseModel):
    id: int
    subject_code: str
    subject_name: str
    semester: int
    exam_date: date
    start_time: time
    end_time: time
    room_number: str
    exam_type: str

    class Config:
        from_attributes = True


class GradePredictionResponse(BaseModel):
    id: int
    subject_code: str
    subject_name: str
    predicted_grade: str
    predicted_score: str
    confidence: float

    class Config:
        from_attributes = True


class AssignmentCreate(BaseModel):
    title: str
    description: str
    subject_id: int
    deadline: datetime


class AssignmentResponse(BaseModel):
    id: int
    title: str
    description: str
    subject_code: str
    subject_name: str
    faculty_name: str
    deadline: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class AssignmentSubmissionCreate(BaseModel):
    assignment_id: int
    file_path: str


class AssignmentSubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    assignment_title: str
    student_id: int
    student_name: str
    file_path: str
    submission_date: datetime
    marks_obtained: Optional[float] = None
    feedback: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class PlacementDriveCreate(BaseModel):
    company_id: int
    title: str
    package_lpa: float
    min_cgpa: float = 6.0
    max_backlogs: int = 0
    location: str
    required_skills: str
    deadline: date


class PlacementDriveResponse(BaseModel):
    id: int
    company_name: str
    title: str
    package_lpa: float
    min_cgpa: float
    max_backlogs: int
    location: str
    required_skills: str
    deadline: date
    eligible: Optional[bool] = None

    class Config:
        from_attributes = True


class HostelLeaveRequestCreate(BaseModel):
    reason: str
    start_date: date
    end_date: date


class HostelLeaveRequestResponse(BaseModel):
    id: int
    student_name: str
    roll_number: str
    reason: str
    start_date: date
    end_date: date
    status: str
    reviewed_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target_role: str = "all"


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    author_role: str
    target_role: str
    created_at: datetime

    class Config:
        from_attributes = True


class ClubResponse(BaseModel):
    id: int
    name: str
    description: str
    category: str
    president_name: Optional[str] = None
    is_member: Optional[bool] = False

    class Config:
        from_attributes = True

