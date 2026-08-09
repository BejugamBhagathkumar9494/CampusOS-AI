export type UserRole = 'student' | 'faculty' | 'admin' | 'hostel_warden' | 'placement_officer' | 'super_admin';

export type AccountStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  institution_id?: string;
  status: AccountStatus;
  department?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: number;
  actor_user_id?: string;
  action: string;
  target_user_id?: string;
  timestamp: string;
  metadata_json?: string;
}

export interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  role: UserRole | null;
  status: AccountStatus | null;
  loading: boolean;
  isAuthenticated: boolean;
}

