-- ============================================================================
-- CAMPUSOS AI SECURITY MIGRATION & RLS POLICIES
-- ============================================================================
-- Security Rule: Every user can only access features and data they are authorized to access.
-- Level 1: Role-Based Access Control (RBAC)
-- Level 2: User-Specific Data Access Control (Owner Isolation)
-- ============================================================================

-- 1. Create Profiles Table (Synced with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'faculty', 'admin', 'hostel_warden', 'placement_officer', 'super_admin')),
    institution_id VARCHAR(50) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Authorized Users Table (Pre-Approved Campus Registry)
-- Security: Prevents self-registration as unauthorized roles or invalid institution IDs.
CREATE TABLE IF NOT EXISTS public.authorized_users (
    id SERIAL PRIMARY KEY,
    institution_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'faculty', 'admin', 'hostel_warden', 'placement_officer', 'super_admin')),
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Audit Logs Table
-- Security: Tracks critical security, auth, and administrative state changes.
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables to prevent direct database bypass
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------------------------------
-- RLS ensures users can only read their own profile unless they possess Admin/Super Admin privileges
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));

CREATE POLICY "Users can update own profile name/email"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
    ON public.profiles FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));

-- ----------------------------------------------------------------------------
-- AUTHORIZED USERS POLICIES
-- ----------------------------------------------------------------------------
-- Only Super Admin and Admin can access the pre-approved registration whitelist
CREATE POLICY "Admins can view authorized users"
    ON public.authorized_users FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));

CREATE POLICY "Super Admins can manage authorized users"
    ON public.authorized_users FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
    ));

-- ----------------------------------------------------------------------------
-- AUDIT LOGS POLICIES
-- ----------------------------------------------------------------------------
-- Authenticated users can insert audit logs; Admins can read audit logs
CREATE POLICY "Authenticated users can create audit log entries"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ));

-- ============================================================================
-- SEED INITIAL AUTHORIZED USER REGISTRY
-- ============================================================================
INSERT INTO public.authorized_users (institution_id, email, full_name, role, is_used) VALUES
('STU001', 'rahul.student@campus.edu', 'Rahul Kumar', 'student', FALSE),
('STU002', 'priya.student@campus.edu', 'Priya Kumar', 'student', FALSE),
('FAC001', 'arun.faculty@campus.edu', 'Dr. Arun Kumar', 'faculty', FALSE),
('FAC002', 'meena.faculty@campus.edu', 'Dr. Meena Kumar', 'faculty', FALSE),
('WAR001', 'ramesh.warden@campus.edu', 'Ramesh Kumar', 'hostel_warden', FALSE),
('PO001', 'suresh.placement@campus.edu', 'Suresh Kumar', 'placement_officer', FALSE),
('ADM001', 'admin1@campus.edu', 'Admin One', 'admin', FALSE),
('ADM002', 'admin2@campus.edu', 'Admin Two', 'admin', FALSE),
('SA001', 'superadmin@campus.edu', 'Super Admin', 'super_admin', FALSE)
ON CONFLICT (institution_id) DO NOTHING;
