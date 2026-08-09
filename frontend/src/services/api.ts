import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Retrieves the current authenticated user's access token from Supabase.
 */
export async function getAuthToken(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  } catch (error) {
    console.error('Error fetching Supabase auth session token:', error);
    return '';
  }
}

/**
 * Performs authenticated requests to the backend API with fallback for missing session.
 */
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {

  const token = await getAuthToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// API Functions
export async function getStudentProfile(): Promise<any> {
  return fetchWithAuth('/students/me');
}

export async function getStudentAttendance(studentId: number = 1): Promise<any> {
  return fetchWithAuth(`/students/${studentId}/attendance`);
}

export async function getStudentMarks(studentId: number = 1): Promise<any> {
  return fetchWithAuth(`/students/${studentId}/marks`);
}

export async function chatWithAgent(message: string, chatId?: string): Promise<any> {
  return fetchWithAuth('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, chat_id: chatId }),
  });
}

export async function searchKnowledgeBase(query: string): Promise<any> {
  return fetchWithAuth('/ai/knowledge/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export interface PlacementReadinessInput {
  cgpa: number;
  branch?: string;
  college_tier?: string;
  skills?: string[];
  certifications_count?: number;
  coding_platform_score?: number;
  internships_count?: number;
  projects_count?: number;
  aptitude_score?: number;
  communication_skill_score?: number;
  mock_interview_score?: number;
  attendance_percentage?: number;
  backlogs?: number;
  study_hours_per_day?: number;
}

export async function predictPlacementReadiness(input: PlacementReadinessInput): Promise<any> {
  return fetchWithAuth('/placements/readiness/predict', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getPlacementAnalytics(): Promise<any> {
  return fetchWithAuth('/placements/analytics');
}

export async function getRecruitingCompanies(): Promise<any> {
  return fetchWithAuth('/placements/companies');
}

export async function reviewResume(resumeText: string): Promise<any> {
  return fetchWithAuth('/placements/resume-review', {
    method: 'POST',
    body: JSON.stringify({ resume_text: resumeText }),
  });
}

export async function searchLibraryBooks(query: string = ''): Promise<any> {
  return fetchWithAuth(`/library/search?query=${encodeURIComponent(query)}`);
}

export async function getHostelComplaints(): Promise<any> {
  return fetchWithAuth('/hostel/complaints');
}

export async function fileHostelComplaint(title: string, description: string, room_number: string = '302-B'): Promise<any> {
  return fetchWithAuth('/hostel/complaints', {
    method: 'POST',
    body: JSON.stringify({ title, description, room_number }),
  });
}

export async function getTransportRoutes(): Promise<any> {
  return fetchWithAuth('/transport/routes');
}

export async function getFeeDetails(studentId: string = '1'): Promise<any> {
  return fetchWithAuth(`/finance/fees?student_id=${studentId}`);
}

export async function getScholarships(studentId: string = '1'): Promise<any> {
  return fetchWithAuth(`/finance/scholarships?student_id=${studentId}`);
}

export async function getAdminAnalytics(): Promise<any> {
  return fetchWithAuth('/analytics/admin');
}

// Extended Platform API Functions
export async function getExams(): Promise<any> {
  return fetchWithAuth('/academic-ext/exams/me');
}

export async function getGradePredictions(): Promise<any> {
  return fetchWithAuth('/academic-ext/exams/predictions/me');
}

export async function getAssignments(): Promise<any> {
  return fetchWithAuth('/academic-ext/assignments');
}

export async function createAssignment(title: string, description: string, subject_id: number, deadline: string): Promise<any> {
  return fetchWithAuth('/academic-ext/assignments', {
    method: 'POST',
    body: JSON.stringify({ title, description, subject_id, deadline }),
  });
}

export async function submitAssignment(assignment_id: number, file_path: string): Promise<any> {
  return fetchWithAuth(`/academic-ext/assignments/${assignment_id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ assignment_id, file_path }),
  });
}

export async function getPlacementDrives(): Promise<any> {
  return fetchWithAuth('/placements/drives');
}

export async function createPlacementDrive(payload: any): Promise<any> {
  return fetchWithAuth('/placements/drives', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPlacementApplications(): Promise<any> {
  return fetchWithAuth('/placements/applications');
}

export async function applyPlacementDrive(drive_id: number): Promise<any> {
  return fetchWithAuth(`/placements/apply/${drive_id}`, {
    method: 'POST',
  });
}

export async function updatePlacementApplicationStatus(application_id: number, status: string): Promise<any> {
  return fetchWithAuth(`/placements/applications/${application_id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function getHostelLeaveRequests(): Promise<any> {
  return fetchWithAuth('/hostel/leave-requests');
}

export async function applyHostelLeave(reason: string, start_date: string, end_date: string): Promise<any> {
  return fetchWithAuth('/hostel/leave-requests', {
    method: 'POST',
    body: JSON.stringify({ reason, start_date, end_date }),
  });
}

export async function reviewHostelLeave(request_id: number, status: string): Promise<any> {
  return fetchWithAuth(`/hostel/leave-requests/${request_id}/review`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function getNotifications(): Promise<any> {
  return fetchWithAuth('/notifications');
}

export async function markNotificationRead(id: number): Promise<any> {
  return fetchWithAuth(`/notifications/${id}/read`, {
    method: 'PUT',
  });
}

export async function getAnnouncements(): Promise<any> {
  return fetchWithAuth('/academic-ext/announcements');
}

export async function createAnnouncement(title: string, content: string, target_role: string = 'all'): Promise<any> {
  return fetchWithAuth('/academic-ext/announcements', {
    method: 'POST',
    body: JSON.stringify({ title, content, target_role }),
  });
}

export async function getClubs(): Promise<any> {
  return fetchWithAuth('/academic-ext/clubs');
}

export async function joinClub(club_id: number): Promise<any> {
  return fetchWithAuth(`/academic-ext/clubs/${club_id}/join`, {
    method: 'POST',
  });
}