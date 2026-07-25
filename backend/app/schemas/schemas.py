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
    is_active: Optional[bool] = True


class UserCreate(UserBase):
    password: str


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
    created_at: datetime
    roles: List[RoleSchema] = []

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


class ChatResponse(BaseModel):
    chat_id: str
    response: str


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
