from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    Table,
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from pgvector.sqlalchemy import Vector

# Association table for User <-> Role (for many-to-many if needed, or simple direct mapping)
# For simplicity, we can do direct relationships or association tables.
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE")),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE")),
)

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE")),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE")),
)


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255))


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255))

    permissions = relationship("Permission", secondary=role_permissions)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    roles = relationship("Role", secondary=user_roles)

    # Relationships
    student_profile = relationship("Student", uselist=False, back_populates="user")
    faculty_profile = relationship("Faculty", uselist=False, back_populates="user")
    chat_histories = relationship("AIChatHistory", back_populates="user")
    borrow_records = relationship("BorrowHistory", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    roll_number = Column(String(50), unique=True, nullable=False, index=True)
    cgpa = Column(Float, default=0.0)
    current_semester = Column(Integer, default=1)

    user = relationship("User", back_populates="student_profile")
    attendance = relationship("Attendance", back_populates="student")
    marks = relationship("Mark", back_populates="student")
    occupancy = relationship("HostelOccupant", uselist=False, back_populates="student")
    complaints = relationship("HostelComplaint", back_populates="student")
    applications = relationship("PlacementApplication", back_populates="student")
    resumes = relationship("StudentResume", back_populates="student")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    credits = Column(Integer, default=3)

    attendance = relationship("Attendance", back_populates="subject")
    marks = relationship("Mark", back_populates="subject")


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"))
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"))
    date = Column(Date, nullable=False)
    is_present = Column(Boolean, nullable=False)

    student = relationship("Student", back_populates="attendance")
    subject = relationship("Subject", back_populates="attendance")


class Mark(Base):
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"))
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"))
    semester = Column(Integer, nullable=False)
    internal_marks = Column(Float, default=0.0)
    external_marks = Column(Float, default=0.0)
    total_marks = Column(Float, default=0.0)

    student = relationship("Student", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)

    faculty = relationship("Faculty", back_populates="department")


class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"))

    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department", back_populates="faculty")
    schedules = relationship("FacultySchedule", back_populates="faculty")


class FacultySchedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"))
    subject_name = Column(String(150), nullable=False)
    day_of_week = Column(String(20), nullable=False)  # Monday, etc.
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room_number = Column(String(50))

    faculty = relationship("Faculty", back_populates="schedules")


# Hostel Models
class HostelRoom(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(50), unique=True, nullable=False)
    block_name = Column(String(50), nullable=False)
    capacity = Column(Integer, default=4)
    occupancy_count = Column(Integer, default=0)

    occupants = relationship("HostelOccupant", back_populates="room")
    complaints = relationship("HostelComplaint", back_populates="room")


class HostelOccupant(Base):
    __tablename__ = "occupants"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"))
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), unique=True)
    allotted_date = Column(Date, default=datetime.utcnow)

    room = relationship("HostelRoom", back_populates="occupants")
    student = relationship("Student", back_populates="occupancy")


class HostelComplaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"))
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"))
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50))  # WiFi, Plumbing, etc.
    priority = Column(String(20), default="Low")  # High, Medium, Low (AI priority prediction)
    status = Column(String(20), default="Pending")  # Pending, Resolved
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="complaints")
    room = relationship("HostelRoom", back_populates="complaints")


# Library Models
class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    author = Column(String(150), nullable=False)
    isbn = Column(String(50), unique=True, index=True)
    category = Column(String(100))
    copies_available = Column(Integer, default=1)

    borrowers = relationship("BorrowHistory", back_populates="book")


class BorrowHistory(Base):
    __tablename__ = "borrow_history"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    borrow_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=False)
    return_date = Column(DateTime, nullable=True)

    book = relationship("Book", back_populates="borrowers")
    user = relationship("User", back_populates="borrow_records")


# Transport Models
class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    bus_number = Column(String(50), unique=True, nullable=False)
    driver_name = Column(String(100))
    driver_phone = Column(String(20))
    capacity = Column(Integer, default=50)

    routes = relationship("BusRoute", back_populates="bus")


class BusRoute(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(Integer, ForeignKey("buses.id", ondelete="CASCADE"))
    route_name = Column(String(150), nullable=False)
    stops = Column(Text)  # JSON or Comma-separated list

    bus = relationship("Bus", back_populates="routes")


# Placements Models
class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    industry = Column(String(100))
    website = Column(String(255))

    applications = relationship("PlacementApplication", back_populates="company")


class PlacementApplication(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"))
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"))
    status = Column(String(50), default="Applied")  # Shortlisted, Offered, Rejected
    applied_date = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="applications")
    student = relationship("Student", back_populates="applications")


class StudentResume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"))
    file_path = Column(String(255), nullable=False)  # Supabase / S3 path
    resume_score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)

    student = relationship("Student", back_populates="resumes")


# Finance Models
class FeeStructure(Base):
    __tablename__ = "fees"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"))
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    due_date = Column(Date, nullable=False)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    amount = Column(Float, nullable=False)
    transaction_reference = Column(String(100), unique=True)
    status = Column(String(50), default="Pending")  # Success, Failed, Pending
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")


# AI Models
class AIChatHistory(Base):
    __tablename__ = "ai_chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_histories")


# RAG Knowledge Base
class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100))  # Policy, Circular, Syllabus
    content = Column(Text, nullable=False)
    # pgvector embedding representation
    embedding = Column(Vector(1536))  # e.g., text-embedding-3-small/large or custom-dimension
    created_at = Column(DateTime, default=datetime.utcnow)
