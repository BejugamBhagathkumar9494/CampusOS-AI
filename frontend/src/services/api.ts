import { supabase } from './supabaseClient';

const API_URL = 'http://localhost:8000/api/v1';

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
async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
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