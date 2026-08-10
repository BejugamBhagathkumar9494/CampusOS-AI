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
    avatar_url TEXT,
    phone TEXT,
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
    batch_year INT NOT NULL,
    cgpa NUMERIC(3,2) DEFAULT 0.00,
    semester INT DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Faculty Table
CREATE TABLE IF NOT EXISTS public.faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    designation TEXT,
    specialization TEXT,
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
    designation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    credits INT NOT NULL DEFAULT 3,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
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

-- Examinations Table
CREATE TABLE IF NOT EXISTS public.examinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    exam_name TEXT NOT NULL,
    exam_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    total_marks INT DEFAULT 100,
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
    category TEXT NOT NULL,
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

-- Placements Table
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

-- 5. AI & ML EXTENSION TABLES (Future Proofing for RAG, Vector Search & Predictors)

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
CREATE INDEX IF NOT EXISTS idx_vector_embedding_cosine ON public.vector_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

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

  INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    assigned_role,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Prevent trigger failure from returning 500 on Supabase auth signup
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. ROW LEVEL SECURITY (RLS) & POLICIES

-- RLS Role Helpers
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role_enum AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(public.current_user_role() = 'admin', FALSE);
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
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issued_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vector_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile or admins can view all"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Students Policies
CREATE POLICY "Students can view own profile record or admin/faculty"
  ON public.students FOR SELECT
  USING (
    profile_id = auth.uid() 
    OR public.is_admin() 
    OR public.current_user_role() = 'faculty'
  );

-- Attendance Policies
CREATE POLICY "Students can view own attendance"
  ON public.attendance FOR SELECT
  USING (
    student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
    OR public.is_admin()
    OR public.current_user_role() = 'faculty'
  );

CREATE POLICY "Faculty and admin can manage attendance"
  ON public.attendance FOR ALL
  USING (public.current_user_role() IN ('faculty', 'admin'));

-- Complaints Policies
CREATE POLICY "Users can view their own complaints or wardens/admins"
  ON public.complaints FOR SELECT
  USING (
    complainant_id = auth.uid() 
    OR public.current_user_role() IN ('hostel_warden', 'admin')
  );

CREATE POLICY "Users can insert complaints"
  ON public.complaints FOR INSERT
  WITH CHECK (complainant_id = auth.uid());

-- Placements & Resumes Policies
CREATE POLICY "Placement Officers and admins full access to placements"
  ON public.placements FOR ALL
  USING (public.current_user_role() IN ('placement_officer', 'admin'));

CREATE POLICY "Students can view active placements"
  ON public.placements FOR SELECT
  USING (status = 'active' OR public.current_user_role() IN ('placement_officer', 'admin'));

CREATE POLICY "Students can manage own resumes"
  ON public.resumes FOR ALL
  USING (
    student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
    OR public.current_user_role() IN ('placement_officer', 'admin')
  );

-- AI Chat History Policies
CREATE POLICY "Users can access own AI chat history"
  ON public.ai_chat_history FOR ALL
  USING (user_id = auth.uid() OR public.is_admin());

-- Default Read-Only Policies for Catalog Tables (Courses, Library, Events, Routes)
CREATE POLICY "Authenticated users can read courses" ON public.courses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read library_books" ON public.library_books FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read events" ON public.events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read transport_routes" ON public.transport_routes FOR SELECT USING (auth.role() = 'authenticated');

-- Admin Catch-All Full Management Policies
CREATE POLICY "Admins full access to all data" ON public.departments FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full access to hostels" ON public.hostels FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full access to fee payments" ON public.fee_payments FOR ALL USING (public.is_admin());

-- ==============================================================================
-- END OF MIGRATION SCRIPT
-- ==============================================================================
