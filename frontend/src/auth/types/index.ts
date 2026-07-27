export type UserRole = 'student' | 'faculty' | 'admin' | 'hostel_warden' | 'placement_officer';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
}
