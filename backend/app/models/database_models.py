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
from sqlalchemy.ext.compiler import compiles

@compiles(Vector, "sqlite")
def compile_vector_sqlite(type_, compiler, **kw):
    return "TEXT"


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


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, index=True)  # UUID string matching Supabase auth.users id
    auth_user_id = Column(String(36), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    role = Column(String(50), nullable=False, index=True)  # student, faculty, admin, hostel_warden, placement_officer, super_admin
    institution_id = Column(String(50), unique=True, nullable=True, index=True)
    status = Column(String(20), default="active", nullable=False)  # pending, active, suspended, rejected
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AuthorizedUser(Base):
    __tablename__ = "authorized_users"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)  # student, faculty, admin, hostel_warden, placement_officer, super_admin
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(String(36), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    target_user_id = Column(String(36), nullable=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    metadata_json = Column(Text, nullable=True)  # JSON-encoded additional parameters


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
    institution_id = Column(String(50), nullable=True)
    status = Column(String(20), default="active")  # pending, active, suspended, rejected
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


class RegistrationRequest(Base):
    __tablename__ = "registration_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # student, faculty, placement_officer, hostel_warden
    department = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    status = Column(String(20), default="pending", nullable=False)  # pending, approved, rejected
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    rejection_reason = Column(Text, nullable=True)


class AIChatSession(Base):
    __tablename__ = "ai_chat_sessions"

    id = Column(String(36), primary_key=True, index=True)  # UUID session_id
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), default="New AI Chat Session")
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

    user = relationship("User")
    messages = relationship("AIChatMessage", back_populates="session", cascade="all, delete-orphan")


class AIChatMessage(Base):
    __tablename__ = "ai_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), ForeignKey("ai_chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user, assistant
    message = Column(Text, nullable=False)
    mode = Column(String(20), default="llm")  # llm, rag
    sources_json = Column(Text, nullable=True)  # JSON-encoded array of sources
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("AIChatSession", back_populates="messages")
    user = relationship("User")


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


# Extended CampusOS Platform Models
class ExamTimetable(Base):
    __tablename__ = "exam_timetables"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"))
    semester = Column(Integer, nullable=False)
    exam_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room_number = Column(String(50), nullable=False)
    exam_type = Column(String(50), default="End Semester")  # Mid Semester, End Semester, Quiz

    subject = relationship("Subject")


class GradePrediction(Base):
    __tablename__ = "grade_predictions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"))
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"))
    predicted_grade = Column(String(10), nullable=False)  # A+, A, B+, B, C, F
    predicted_score = Column(String(20), nullable=False)  # e.g., "82-88%"
    confidence = Column(Float, default=85.0)  # Percentage confidence
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student")
    subject = relationship("Subject")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"))
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"))
    deadline = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    faculty = relationship("Faculty")
    subject = relationship("Subject")
    submissions = relationship("AssignmentSubmission", back_populates="assignment")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"))
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"))
    file_path = Column(String(255), nullable=False)
    submission_date = Column(DateTime, default=datetime.utcnow)
    marks_obtained = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    status = Column(String(30), default="Submitted")  # Submitted, Graded, Late

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("Student")


class PlacementDrive(Base):
    __tablename__ = "placement_drives"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"))
    title = Column(String(200), nullable=False)
    package_lpa = Column(Float, nullable=False)  # e.g., 12.5 LPA
    min_cgpa = Column(Float, default=6.0)
    max_backlogs = Column(Integer, default=0)
    location = Column(String(100), nullable=False)
    required_skills = Column(Text, nullable=False)  # Comma-separated or text
    deadline = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")


class HostelLeaveRequest(Base):
    __tablename__ = "hostel_leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"))
    reason = Column(Text, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(20), default="Pending")  # Pending, Approved, Rejected
    reviewed_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info, warning, success, alert
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    author_role = Column(String(50), nullable=False)
    target_role = Column(String(50), default="all")  # all, student, faculty, etc.
    created_at = Column(DateTime, default=datetime.utcnow)


class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), default="Technical")  # Technical, Cultural, Sports
    president_name = Column(String(100), nullable=True)

    memberships = relationship("ClubMembership", back_populates="club")


class ClubMembership(Base):
    __tablename__ = "club_memberships"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"))
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"))
    joined_date = Column(Date, default=datetime.utcnow)
    status = Column(String(20), default="Active")  # Active, Inactive

    club = relationship("Club", back_populates="memberships")
    student = relationship("Student")


# ==============================================================================
# AI EXAM PREPARATION PLATFORM MODELS
# ==============================================================================

class StudyCollection(Base):
    __tablename__ = "study_collections"

    id = Column(String(36), primary_key=True, index=True)  # UUID
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_name = Column(String(150), nullable=False)
    course_code = Column(String(50), nullable=False)
    semester = Column(Integer, nullable=False, default=1)
    branch = Column(String(100), nullable=False, default="CSE")
    academic_year = Column(String(50), nullable=False, default="2025-2026")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    documents = relationship("StudyDocument", back_populates="collection", cascade="all, delete-orphan")
    chunks = relationship("StudyChunk", back_populates="collection", cascade="all, delete-orphan")
    materials = relationship("GeneratedExamMaterial", back_populates="collection", cascade="all, delete-orphan")


class StudyDocument(Base):
    __tablename__ = "study_documents"

    id = Column(String(36), primary_key=True, index=True)  # UUID
    collection_id = Column(String(36), ForeignKey("study_collections.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    storage_path = Column(String(500), nullable=True)
    page_count = Column(Integer, default=1)
    unit_detected = Column(String(50), nullable=True)  # e.g., "Unit 1"
    processing_status = Column(String(50), default="processed")  # pending, processing, processed, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    collection = relationship("StudyCollection", back_populates="documents")
    chunks = relationship("StudyChunk", back_populates="document", cascade="all, delete-orphan")


class StudyChunk(Base):
    __tablename__ = "study_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String(36), ForeignKey("study_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    collection_id = Column(String(36), ForeignKey("study_collections.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    page_number = Column(Integer, default=1, nullable=False)
    unit = Column(String(50), default="General", nullable=False)  # e.g. "Unit 1", "Unit 2"
    topic = Column(String(200), default="General Concepts", nullable=False)
    chunk_index = Column(Integer, default=1)
    has_diagram = Column(Boolean, default=False)
    diagram_caption = Column(String(255), nullable=True)
    metadata_json = Column(Text, nullable=True)  # Serialized JSON
    embedding = Column(Vector(1536), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    collection = relationship("StudyCollection", back_populates="chunks")
    document = relationship("StudyDocument", back_populates="chunks")


class GeneratedExamMaterial(Base):
    __tablename__ = "generated_exam_material"

    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(String(36), ForeignKey("study_collections.id", ondelete="CASCADE"), nullable=False, index=True)
    material_type = Column(String(50), nullable=False)  # summary, 2_mark, 4_mark, 10_mark, important_q, definition, formula, diagram, revision_one_day, revision_last_minute
    question = Column(Text, nullable=True)
    answer = Column(Text, nullable=False)
    marks = Column(Integer, default=0)
    unit = Column(String(50), default="General")
    topic = Column(String(200), default="General")
    keywords = Column(Text, nullable=True)  # JSON or comma-separated keywords
    diagram_info = Column(Text, nullable=True)  # JSON with diagram type, source page, or flowchart
    sources = Column(Text, nullable=True)  # JSON array of sources [{file_name, page_number, relevance}]
    priority_rank = Column(Integer, default=1)
    grounded_confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    collection = relationship("StudyCollection", back_populates="materials")


# ==============================================================================
# REPODNA — AI-POWERED GITHUB REPOSITORY INTELLIGENCE MODELS
# ==============================================================================

class StudyRepository(Base):
    __tablename__ = "study_repositories"

    id = Column(String(36), primary_key=True, index=True)  # UUID
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    github_url = Column(String(500), nullable=False)
    owner = Column(String(150), nullable=False)
    repo_name = Column(String(150), nullable=False)
    default_branch = Column(String(100), default="main")
    description = Column(Text, nullable=True)
    stars_count = Column(Integer, default=0)
    forks_count = Column(Integer, default=0)
    primary_language = Column(String(100), default="Unknown")
    commit_sha = Column(String(100), nullable=True)
    file_count = Column(Integer, default=0)
    status = Column(String(50), default="pending")  # pending, scanning, analyzed, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    files = relationship("RepositoryFile", back_populates="repository", cascade="all, delete-orphan")
    chunks = relationship("RepositoryChunk", back_populates="repository", cascade="all, delete-orphan")
    analysis = relationship("RepositoryAnalysis", uselist=False, back_populates="repository", cascade="all, delete-orphan")


class RepositoryFile(Base):
    __tablename__ = "repository_files"

    id = Column(String(36), primary_key=True, index=True)  # UUID
    repository_id = Column(String(36), ForeignKey("study_repositories.id", ondelete="CASCADE"), nullable=False, index=True)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), default="source")  # controller, model, route, component, service, config, manifest
    language = Column(String(50), default="text")
    file_size_bytes = Column(Integer, default=0)
    purpose_summary = Column(Text, nullable=True)
    content_excerpt = Column(Text, nullable=True)
    content_hash = Column(String(64), nullable=True)
    imports_json = Column(Text, nullable=True)
    exports_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    repository = relationship("StudyRepository", back_populates="files")
    chunks = relationship("RepositoryChunk", back_populates="file", cascade="all, delete-orphan")


class RepositoryChunk(Base):
    __tablename__ = "repository_chunks"

    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(String(36), ForeignKey("study_repositories.id", ondelete="CASCADE"), nullable=False, index=True)
    file_id = Column(String(36), ForeignKey("repository_files.id", ondelete="CASCADE"), nullable=False, index=True)
    file_path = Column(String(500), nullable=False)
    chunk_index = Column(Integer, default=1)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    repository = relationship("StudyRepository", back_populates="chunks")
    file = relationship("RepositoryFile", back_populates="chunks")


class RepositoryAnalysis(Base):
    __tablename__ = "repository_analysis"

    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(String(36), ForeignKey("study_repositories.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    one_line_desc = Column(String(255), nullable=True)
    short_summary = Column(Text, nullable=True)
    detailed_overview = Column(Text, nullable=True)
    beginner_explanation = Column(Text, nullable=True)
    interview_pitch = Column(Text, nullable=True)
    architecture_json = Column(Text, nullable=True)
    tech_stack_json = Column(Text, nullable=True)
    project_structure_json = Column(Text, nullable=True)
    application_flows_json = Column(Text, nullable=True)
    database_analysis_json = Column(Text, nullable=True)
    api_analysis_json = Column(Text, nullable=True)
    authentication_analysis_json = Column(Text, nullable=True)
    project_health_json = Column(Text, nullable=True)
    improvements_json = Column(Text, nullable=True)
    interview_questions_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    repository = relationship("StudyRepository", back_populates="analysis")



