export type UserRole = 'student' | 'faculty' | 'admin' | 'hostel_warden' | 'placement_officer' | 'super_admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department?: string;
  institution_id?: string;
  avatar_url?: string;
  phone?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  head_of_department?: string;
  created_at: string;
}

export interface Student {
  id: string;
  profile_id: string;
  roll_number: string;
  department_id?: string;
  batch_year: number;
  cgpa: number;
  semester: number;
  profile?: Profile;
  department?: Department;
}

export interface Faculty {
  id: string;
  profile_id: string;
  employee_id: string;
  department_id?: string;
  designation?: string;
  specialization?: string;
  profile?: Profile;
  department?: Department;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  department_id?: string;
  faculty_id?: string;
  instructor_name?: string;
  created_at: string;
  faculty?: Faculty;
  department?: Department;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  student_id: string;
  enrolled_at: string;
  status: string;
  course?: Course;
  student?: Student;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  course_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  created_at: string;
  course?: Course;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  due_date: string;
  total_points: number;
  created_at: string;
  course?: Course;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string;
  submitted_at: string;
  status: 'submitted' | 'graded' | 'late';
  marks?: number;
  feedback?: string;
  assignment?: Assignment;
  student?: Student;
}

export interface StudentMark {
  id: string;
  student_id: string;
  course_id: string;
  eval_type: 'internal' | 'assignment' | 'exam' | 'quiz';
  marks_obtained: number;
  max_marks: number;
  remarks?: string;
  created_at: string;
  course?: Course;
}

export interface Examination {
  id: string;
  course_id: string;
  exam_name: string;
  exam_date: string;
  location?: string;
  total_marks: number;
  semester: number;
  course?: Course;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_by?: string;
  target_role: string;
  department_id?: string;
  course_id?: string;
  created_at: string;
  author_profile?: Profile;
}

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Hostel {
  id: string;
  name: string;
  block_code: string;
  total_capacity: number;
  created_at: string;
}

export interface Room {
  id: string;
  hostel_id: string;
  room_number: string;
  capacity: number;
  occupied: number;
  created_at: string;
  hostel?: Hostel;
}

export interface HostelAllocation {
  id: string;
  room_id: string;
  student_id: string;
  bed_number: string;
  allocated_at: string;
  room?: Room;
  student?: Student;
}

export interface HostelLeaveRequest {
  id: string;
  student_id: string;
  hostel_id?: string;
  room_number?: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  created_at: string;
  student?: Student;
}

export interface Complaint {
  id: string;
  complainant_id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  complainant?: Profile;
}

export interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  location?: string;
  created_at: string;
}

export interface PlacementDrive {
  id: string;
  company_id: string;
  job_title: string;
  package_ctc?: number;
  min_cgpa: number;
  drive_date?: string;
  status: string;
  created_at: string;
  company?: Company;
}

export interface PlacementApplication {
  id: string;
  placement_id: string;
  student_id: string;
  status: 'applied' | 'shortlisted' | 'interviewing' | 'offered' | 'rejected';
  applied_at: string;
  drive?: PlacementDrive;
  student?: Student;
}

export interface LibraryBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category?: string;
  copies_available: number;
  created_at: string;
}

export interface IssuedBook {
  id: string;
  book_id: string;
  student_id: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  fine_amount: number;
  book?: LibraryBook;
}

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  organizer_id?: string;
  event_date: string;
  location?: string;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  student_id: string;
  registered_at: string;
}

export interface Club {
  id: string;
  name: string;
  description?: string;
  category?: string;
  head_id?: string;
  created_at: string;
}

export interface ClubMembership {
  id: string;
  club_id: string;
  student_id: string;
  role: string;
  joined_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id?: string;
  action: string;
  entity: string;
  entity_id?: string;
  metadata?: any;
  created_at: string;
}
