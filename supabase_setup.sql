-- ==============================================================================
-- CampusOS AI – Intelligent Campus Platform
-- Complete Production Database Migration Script
-- Supabase PostgreSQL Schema with pgvector, RLS, Triggers & Role Policies
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('student', 'faculty', 'admin', 'hostel_warden', 'placement_officer', 'super_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'super_admin';

DO $$ BEGIN
    CREATE TYPE complaint_status_enum AS ENUM ('pending', 'in_progress', 'resolved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE complaint_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE fee_status_enum AS ENUM ('paid', 'pending', 'overdue', 'partial');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE placement_status_enum AS ENUM ('applied', 'shortlisted', 'interviewing', 'offered', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. HELPER FUNCTIONS FOR TIMESTAMPS & RLS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CORE DOMAIN TABLES

-- Profiles Table (Syncs with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'student',
    department TEXT,
    institution_id TEXT UNIQUE,
    avatar_url TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    head_of_department TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    roll_number TEXT UNIQUE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    batch_year INT NOT NULL DEFAULT 2026,
    cgpa NUMERIC(3,2) DEFAULT 8.00,
    semester INT DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Faculty Table
CREATE TABLE IF NOT EXISTS public.faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    designation TEXT DEFAULT 'Professor',
    specialization TEXT DEFAULT 'Computer Science',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Administrators Table
CREATE TABLE IF NOT EXISTS public.administrators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_code TEXT UNIQUE NOT NULL,
    access_level TEXT DEFAULT 'superadmin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hostel Wardens Table
CREATE TABLE IF NOT EXISTS public.hostel_wardens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    warden_code TEXT UNIQUE NOT NULL,
    assigned_hostel_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Placement Officers Table
CREATE TABLE IF NOT EXISTS public.placement_officers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    officer_code TEXT UNIQUE NOT NULL,
    designation TEXT DEFAULT 'Head of Placements',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    credits INT NOT NULL DEFAULT 4,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    instructor_name TEXT DEFAULT 'Faculty Instructor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Course Enrollments Table
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    UNIQUE (course_id, student_id)
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    total_points INT DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assignment Submissions Table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
    marks NUMERIC(5,2),
    feedback TEXT,
    UNIQUE (assignment_id, student_id)
);

-- Student Marks Table
CREATE TABLE IF NOT EXISTS public.student_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    eval_type TEXT NOT NULL CHECK (eval_type IN ('internal', 'assignment', 'exam', 'quiz')),
    marks_obtained NUMERIC(5,2) NOT NULL,
    max_marks NUMERIC(5,2) NOT NULL DEFAULT 100,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Examinations Table
CREATE TABLE IF NOT EXISTS public.examinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    exam_name TEXT NOT NULL,
    exam_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    total_marks INT DEFAULT 100,
    semester INT DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_role TEXT DEFAULT 'all',
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hostels Table
CREATE TABLE IF NOT EXISTS public.hostels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    block_code TEXT NOT NULL,
    total_capacity INT NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    capacity INT DEFAULT 2,
    occupied INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (hostel_id, room_number)
);

-- Hostel Allocations Table
CREATE TABLE IF NOT EXISTS public.hostel_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    student_id UUID UNIQUE NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    bed_number TEXT NOT NULL,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (room_id, bed_number)
);

-- Hostel Leave Requests Table
CREATE TABLE IF NOT EXISTS public.hostel_leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    hostel_id UUID REFERENCES public.hostels(id) ON DELETE SET NULL,
    room_number TEXT,
    reason TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint to hostel_wardens for assigned_hostel_id
ALTER TABLE public.hostel_wardens 
    DROP CONSTRAINT IF EXISTS fk_warden_hostel;
ALTER TABLE public.hostel_wardens 
    ADD CONSTRAINT fk_warden_hostel FOREIGN KEY (assigned_hostel_id) REFERENCES public.hostels(id) ON DELETE SET NULL;

-- Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complainant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    status complaint_status_enum DEFAULT 'pending',
    priority complaint_priority_enum DEFAULT 'medium',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    website TEXT,
    industry TEXT,
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Placements Table / Drives
CREATE TABLE IF NOT EXISTS public.placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    package_ctc NUMERIC(10,2),
    min_cgpa NUMERIC(3,2) DEFAULT 6.00,
    drive_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Placement Applications Table
CREATE TABLE IF NOT EXISTS public.placement_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement_id UUID NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status placement_status_enum DEFAULT 'applied',
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (placement_id, student_id)
);

-- Resumes Table
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    parsed_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Library Books Table
CREATE TABLE IF NOT EXISTS public.library_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    isbn TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT,
    copies_available INT DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Issued Books Table
CREATE TABLE IF NOT EXISTS public.issued_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    fine_amount NUMERIC(8,2) DEFAULT 0.00
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event Registrations Table
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, student_id)
);

-- Clubs Table
CREATE TABLE IF NOT EXISTS public.clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT,
    head_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Club Memberships Table
CREATE TABLE IF NOT EXISTS public.club_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (club_id, student_id)
);

-- Transport Routes Table
CREATE TABLE IF NOT EXISTS public.transport_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_name TEXT NOT NULL,
    start_point TEXT NOT NULL,
    end_point TEXT NOT NULL,
    stops TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Buses Table
CREATE TABLE IF NOT EXISTS public.buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_number TEXT UNIQUE NOT NULL,
    route_id UUID REFERENCES public.transport_routes(id) ON DELETE SET NULL,
    capacity INT DEFAULT 50,
    driver_name TEXT,
    driver_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fee Payments Table
CREATE TABLE IF NOT EXISTS public.fee_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    term TEXT NOT NULL,
    status fee_status_enum DEFAULT 'pending',
    payment_date TIMESTAMPTZ,
    transaction_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. AI & ML EXTENSION TABLES

-- Knowledge Base Documents
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    source_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vector Embeddings Table (pgvector 1536 dim)
CREATE TABLE IF NOT EXISTS public.vector_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
    chunk_content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Chat History Table
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ML Predictions Table
CREATE TABLE IF NOT EXISTS public.ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    prediction_result JSONB NOT NULL,
    confidence_score NUMERIC(5,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Agent Execution Logs Table
CREATE TABLE IF NOT EXISTS public.ai_agent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name TEXT NOT NULL,
    action TEXT NOT NULL,
    input_data JSONB,
    output_data JSONB,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. INDEXES FOR HIGH-PERFORMANCE QUERIES
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_students_roll ON public.students(roll_number);
CREATE INDEX IF NOT EXISTS idx_attendance_student_course ON public.attendance(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_complaints_complainant ON public.complaints(complainant_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_issued_books_student ON public.issued_books(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON public.fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_user_session ON public.ai_chat_history(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_announcements_target ON public.announcements(target_role);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON public.course_enrollments(student_id);

-- 7. TRIGGERS FOR UPDATED_AT & AUTH USER REGISTRATION SYNC

-- Updated At Triggers
CREATE OR REPLACE TRIGGER trg_update_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_update_students BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_update_faculty BEFORE UPDATE ON public.faculty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_update_complaints BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auth Registration -> Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role public.user_role_enum;
  raw_role text;
BEGIN
  raw_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'student'));
  IF raw_role = 'faculty' THEN
    assigned_role := 'faculty'::public.user_role_enum;
  ELSIF raw_role = 'admin' THEN
    assigned_role := 'admin'::public.user_role_enum;
  ELSIF raw_role = 'hostel_warden' THEN
    assigned_role := 'hostel_warden'::public.user_role_enum;
  ELSIF raw_role = 'placement_officer' THEN
    assigned_role := 'placement_officer'::public.user_role_enum;
  ELSIF raw_role = 'super_admin' THEN
    assigned_role := 'super_admin'::public.user_role_enum;
  ELSE
    assigned_role := 'student'::public.user_role_enum;
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role, avatar_url, institution_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    assigned_role,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'institution_id'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. ROW LEVEL SECURITY (RLS) & POLICIES

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role_enum AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(public.current_user_role() IN ('admin', 'super_admin'), FALSE);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_wardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issued_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vector_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- Allow read/write policies for authenticated campus application users
CREATE POLICY "Authenticated profiles access" ON public.profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated departments access" ON public.departments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated students access" ON public.students FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated faculty access" ON public.faculty FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated administrators access" ON public.administrators FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated wardens access" ON public.hostel_wardens FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated placement officers access" ON public.placement_officers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated courses access" ON public.courses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated course_enrollments access" ON public.course_enrollments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated attendance access" ON public.attendance FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated assignments access" ON public.assignments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated assignment_submissions access" ON public.assignment_submissions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated student_marks access" ON public.student_marks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated examinations access" ON public.examinations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated announcements access" ON public.announcements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated hostels access" ON public.hostels FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated rooms access" ON public.rooms FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated hostel_allocations access" ON public.hostel_allocations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated hostel_leave_requests access" ON public.hostel_leave_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated complaints access" ON public.complaints FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated companies access" ON public.companies FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated placements access" ON public.placements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated placement_applications access" ON public.placement_applications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated resumes access" ON public.resumes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated library_books access" ON public.library_books FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated issued_books access" ON public.issued_books FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated notifications access" ON public.notifications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated events access" ON public.events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated event_registrations access" ON public.event_registrations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated clubs access" ON public.clubs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated club_memberships access" ON public.club_memberships FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated transport_routes access" ON public.transport_routes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated buses access" ON public.buses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated fee_payments access" ON public.fee_payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated audit_logs access" ON public.audit_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated knowledge_documents access" ON public.knowledge_documents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated vector_embeddings access" ON public.vector_embeddings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated ai_chat_history access" ON public.ai_chat_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated ml_predictions access" ON public.ml_predictions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated ai_agent_logs access" ON public.ai_agent_logs FOR ALL USING (auth.role() = 'authenticated');

-- 9. INITIAL SAMPLE SEED DATA

INSERT INTO public.departments (code, name, head_of_department) VALUES
('CSE', 'Computer Science & Engineering', 'Dr. Sarah Jenkins'),
('ECE', 'Electronics & Communication', 'Dr. Alan Vance'),
('MECH', 'Mechanical Engineering', 'Dr. James Wilson')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.hostels (name, block_code, total_capacity) VALUES
('Cauvery Hall of Residence', 'BLOCK-A', 150),
('Ganga Hostel', 'BLOCK-B', 120),
('Narmada Hostel', 'BLOCK-C', 100)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.library_books (isbn, title, author, category, copies_available) VALUES
('978-0131103627', 'The C Programming Language', 'Brian W. Kernighan, Dennis M. Ritchie', 'Computer Science', 5),
('978-0262033848', 'Introduction to Algorithms', 'Thomas H. Cormen', 'Computer Science', 8),
('978-0134685991', 'Effective Java', 'Joshua Bloch', 'Software Engineering', 3),
('978-0132350884', 'Clean Code', 'Robert C. Martin', 'Software Engineering', 4)
ON CONFLICT (isbn) DO NOTHING;

INSERT INTO public.companies (name, website, industry, location) VALUES
('Tata Consultancy Services', 'https://tcs.com', 'IT Services', 'Bengaluru'),
('Google', 'https://careers.google.com', 'Technology', 'Hyderabad'),
('Amazon', 'https://amazon.jobs', 'E-Commerce / Cloud', 'Bengaluru')
ON CONFLICT DO NOTHING;

INSERT INTO public.clubs (name, description, category) VALUES
('Coding Club', 'Competitive programming, open source, and hackathons.', 'Technical'),
('Robotics Society', 'Hardware engineering, microcontrollers, and IoT.', 'Technical'),
('Cultural Forum', 'Music, dance, dramatics, and campus festivals.', 'Cultural')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.transport_routes (route_name, start_point, end_point, stops) VALUES
('Route 10A', 'Central Railway Station', 'Main Campus Gate', ARRAY['City Center', 'Tech Park', 'North Gate']),
('Route 04B', 'South City Mall', 'Hostel Block A', ARRAY['South Avenue', 'Subway Square', 'West Gate'])
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 10. AI EXAM PREPARATION PLATFORM TABLES (MULTI-PDF RAG & EXAM NOTES)
-- ==============================================================================

-- Study Collections Table
CREATE TABLE IF NOT EXISTS public.study_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    course_code TEXT NOT NULL,
    semester INT DEFAULT 1,
    branch TEXT DEFAULT 'CSE',
    academic_year TEXT DEFAULT '2025-2026',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Study Documents Table
CREATE TABLE IF NOT EXISTS public.study_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES public.study_collections(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size_bytes INT DEFAULT 0,
    storage_path TEXT,
    page_count INT DEFAULT 1,
    unit_detected TEXT,
    processing_status TEXT DEFAULT 'processed',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Study Chunks Table (with 1536-dim vector embedding & page citations)
CREATE TABLE IF NOT EXISTS public.study_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.study_documents(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES public.study_collections(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    page_number INT NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'General',
    topic TEXT NOT NULL DEFAULT 'General Concepts',
    chunk_index INT DEFAULT 1,
    has_diagram BOOLEAN DEFAULT FALSE,
    diagram_caption TEXT,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generated Exam Material Table
CREATE TABLE IF NOT EXISTS public.generated_exam_material (
    id BIGSERIAL PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES public.study_collections(id) ON DELETE CASCADE,
    material_type TEXT NOT NULL, -- summary, 2_mark, 4_mark, 10_mark, important_q, definition, formula, diagram, revision_one_day, revision_last_minute
    question TEXT,
    answer TEXT NOT NULL,
    marks INT DEFAULT 0,
    unit TEXT DEFAULT 'General',
    topic TEXT DEFAULT 'General',
    keywords TEXT,
    diagram_info JSONB DEFAULT '{}'::jsonb,
    sources JSONB DEFAULT '[]'::jsonb,
    priority_rank INT DEFAULT 1,
    grounded_confidence NUMERIC(4,3) DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Fast Retrieval
CREATE INDEX IF NOT EXISTS idx_study_collections_user ON public.study_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_study_docs_collection ON public.study_documents(collection_id);
CREATE INDEX IF NOT EXISTS idx_study_chunks_collection ON public.study_chunks(collection_id);
CREATE INDEX IF NOT EXISTS idx_study_chunks_unit ON public.study_chunks(unit);
CREATE INDEX IF NOT EXISTS idx_generated_exam_mat_col ON public.generated_exam_material(collection_id, material_type);

-- RLS for Exam Prep Tables (Strict Student Isolation)
ALTER TABLE public.study_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_exam_material ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own study collections" ON public.study_collections
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users access own study documents" ON public.study_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.study_collections c
            WHERE c.id = study_documents.collection_id
            AND (c.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Users access own study chunks" ON public.study_chunks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.study_collections c
            WHERE c.id = study_chunks.collection_id
            AND (c.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Users access own generated exam material" ON public.generated_exam_material
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.study_collections c
            WHERE c.id = generated_exam_material.collection_id
            AND (c.user_id = auth.uid() OR public.is_admin())
        )
    );

-- ==============================================================================
-- 11. REPODNA — AI-POWERED GITHUB REPOSITORY INTELLIGENCE
-- ==============================================================================

-- Repositories Table
CREATE TABLE IF NOT EXISTS public.study_repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    github_url TEXT NOT NULL,
    owner TEXT NOT NULL,
    repo_name TEXT NOT NULL,
    default_branch TEXT DEFAULT 'main',
    description TEXT,
    stars_count INT DEFAULT 0,
    forks_count INT DEFAULT 0,
    primary_language TEXT DEFAULT 'Unknown',
    commit_sha TEXT,
    file_count INT DEFAULT 0,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Repository Files Table
CREATE TABLE IF NOT EXISTS public.repository_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES public.study_repositories(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_type TEXT DEFAULT 'source',
    language TEXT DEFAULT 'text',
    file_size_bytes INT DEFAULT 0,
    purpose_summary TEXT,
    content_excerpt TEXT,
    content_hash TEXT,
    imports_json JSONB DEFAULT '[]'::jsonb,
    exports_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Repository Chunks Table
CREATE TABLE IF NOT EXISTS public.repository_chunks (
    id BIGSERIAL PRIMARY KEY,
    repository_id UUID NOT NULL REFERENCES public.study_repositories(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES public.repository_files(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    chunk_index INT DEFAULT 1,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Repository Analysis Report Table
CREATE TABLE IF NOT EXISTS public.repository_analysis (
    id BIGSERIAL PRIMARY KEY,
    repository_id UUID NOT NULL UNIQUE REFERENCES public.study_repositories(id) ON DELETE CASCADE,
    one_line_desc TEXT,
    short_summary TEXT,
    detailed_overview TEXT,
    beginner_explanation TEXT,
    interview_pitch TEXT,
    architecture_json JSONB DEFAULT '{}'::jsonb,
    tech_stack_json JSONB DEFAULT '{}'::jsonb,
    project_structure_json JSONB DEFAULT '{}'::jsonb,
    application_flows_json JSONB DEFAULT '[]'::jsonb,
    database_analysis_json JSONB DEFAULT '{}'::jsonb,
    api_analysis_json JSONB DEFAULT '[]'::jsonb,
    authentication_analysis_json JSONB DEFAULT '{}'::jsonb,
    project_health_json JSONB DEFAULT '{}'::jsonb,
    improvements_json JSONB DEFAULT '[]'::jsonb,
    interview_questions_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Fast Scoped Retrieval
CREATE INDEX IF NOT EXISTS idx_study_repos_user ON public.study_repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repo_files_repo ON public.repository_files(repository_id);
CREATE INDEX IF NOT EXISTS idx_repo_chunks_repo ON public.repository_chunks(repository_id);
CREATE INDEX IF NOT EXISTS idx_repo_chunks_file ON public.repository_chunks(file_id);

-- RLS for RepoDNA Tables (Strict Student Isolation)
ALTER TABLE public.study_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own study repositories" ON public.study_repositories
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users access own repository files" ON public.repository_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.study_repositories r
            WHERE r.id = repository_files.repository_id
            AND (r.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Users access own repository chunks" ON public.repository_chunks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.study_repositories r
            WHERE r.id = repository_chunks.repository_id
            AND (r.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Users access own repository analysis" ON public.repository_analysis
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.study_repositories r
            WHERE r.id = repository_analysis.repository_id
            AND (r.user_id = auth.uid() OR public.is_admin())
        )
    );

-- ==============================================================================
-- END OF MIGRATION SCRIPT
-- ==============================================================================

