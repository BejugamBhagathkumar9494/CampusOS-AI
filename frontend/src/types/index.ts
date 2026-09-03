export type UserRole =
  | 'student'
  | 'faculty'
  | 'admin'
  | 'super_admin'
  | 'hostel_warden'
  | 'placement_officer'
  | 'registrar'
  | 'librarian';

export type UserStatus = 'active' | 'pending' | 'rejected' | 'suspended';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  institution_id?: string;
  status: UserStatus;
  department?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  is_active?: boolean;
}

export interface AuthContextType {
  user: UserProfile | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  register: (email: string, pass: string, fullName: string, role: UserRole, institutionId?: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserStatus: (userId: string, newStatus: UserStatus, rejectionReason?: string) => Promise<any>;
  deleteUser: (userId: string) => Promise<boolean>;
  refreshProfile: () => Promise<UserProfile | null>;
}

export interface Course {
  id: string | number;
  code: string;
  title: string;
  name?: string;
  credits: number;
  instructor?: string;
  department?: string;
  semester?: string;
  schedule?: string;
  room?: string;
  description?: string;
  enrolled_count?: number;
}

export interface AttendanceRecord {
  id: string | number;
  student_id: string;
  student_name?: string;
  course_id: string | number;
  course_name?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  percentage?: number;
  total_classes?: number;
  attended_classes?: number;
}

export interface Assignment {
  id: string | number;
  title: string;
  course_code?: string;
  course_title?: string;
  due_date: string;
  max_points?: number;
  status?: 'pending' | 'submitted' | 'graded';
  submission_url?: string;
  description?: string;
}

export interface ExamRecord {
  id: string | number;
  subject: string;
  code?: string;
  date: string;
  time?: string;
  room?: string;
  max_marks?: number;
  obtained_marks?: number;
  grade?: string;
}

export interface Notice {
  id: string | number;
  title: string;
  content: string;
  category: string;
  author?: string;
  date?: string;
  important?: boolean;
}

export interface EventItem {
  id: string | number;
  title: string;
  description: string;
  date: string;
  location: string;
  organizer?: string;
  category?: string;
}

export interface FinanceRecord {
  id: string | number;
  title: string;
  amount: number;
  type: 'fee' | 'fine' | 'scholarship' | 'payment';
  status: 'paid' | 'pending' | 'overdue';
  due_date?: string;
}

export interface PlacementItem {
  id: string | number;
  company_name: string;
  role: string;
  package_offered: string;
  eligibility: string;
  deadline: string;
  status?: 'open' | 'closed' | 'applied';
}

export interface TransportRoute {
  id: string | number;
  route_name: string;
  bus_number: string;
  driver_name?: string;
  driver_phone?: string;
  stops?: string[];
  timing?: string;
}

export interface ClubItem {
  id: string | number;
  name: string;
  description: string;
  lead?: string;
  members_count?: number;
  category?: string;
}

export interface Complaint {
  id: string | number;
  title: string;
  category: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_user_id: string;
  action: string;
  target_user_id?: string;
  timestamp: string;
  metadata_json?: any;
}
