import { supabase } from './supabaseClient';

export function getApiBaseUrl(): string {
  let url = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').trim();
  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
}

export async function getAuthToken(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
  } catch (error) {
    console.error('Error fetching Supabase auth session token:', error);
  }
  return localStorage.getItem('campusos_token') || '';
}

export async function fetchWithAuth<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const API_URL = getApiBaseUrl();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getStudentProfile() {
  return fetchWithAuth('/students/me');
}

export async function getStudentAttendance(studentId: string | number = 1) {
  return fetchWithAuth(`/students/${studentId}/attendance`);
}

export async function getStudentMarks(studentId: string | number = 1) {
  return fetchWithAuth(`/students/${studentId}/marks`);
}

export async function chatWithAgent(message: string, chatId?: string, category?: string, role?: string, agenticMode: boolean = true) {
  return fetchWithAuth('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, chat_id: chatId, category, role, agentic_mode: agenticMode }),
  });
}

export async function chatWithLLM(message: string, history: any[] = [], userId: string | null = null) {
  try {
    return await fetchWithAuth('/ai/chat/llm', {
      method: 'POST',
      body: JSON.stringify({ message, history, user_id: userId }),
    });
  } catch (err) {
    const token = await getAuthToken();
    const rawBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '').replace(/\/api\/v1$/, '');
    const res = await fetch(`${rawBaseUrl}/api/chat/llm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ message, history, user_id: userId }),
    });
    if (!res.ok) throw err;
    return res.json();
  }
}

export async function chatWithRAG(message: string, role: string = 'student', userId: string | null = null) {
  try {
    return await fetchWithAuth('/ai/chat/rag', {
      method: 'POST',
      body: JSON.stringify({ message, role, user_id: userId }),
    });
  } catch (err) {
    const token = await getAuthToken();
    const rawBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '').replace(/\/api\/v1$/, '');
    const res = await fetch(`${rawBaseUrl}/api/chat/rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ message, role, user_id: userId }),
    });
    if (!res.ok) throw err;
    return res.json();
  }
}

export async function searchKnowledgeBase(query: string, category?: string) {
  return fetchWithAuth('/ai/knowledge/search', {
    method: 'POST',
    body: JSON.stringify({ query, category }),
  });
}

export async function uploadKnowledgeDocument(file: File, category: string = 'General', allowedRoles: string = 'student,faculty,admin') {
  const token = await getAuthToken();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('allowed_roles', allowedRoles);

  const API_URL = getApiBaseUrl();
  const response = await fetch(`${API_URL}/ai/knowledge/upload`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function predictPlacementReadiness(input: any) {
  return fetchWithAuth('/placements/readiness/predict', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getPlacementAnalytics() {
  return fetchWithAuth('/placements/analytics');
}

export async function getRecruitingCompanies() {
  return fetchWithAuth('/placements/companies');
}

export async function reviewResume(resumeText: string) {
  return fetchWithAuth('/placements/resume-review', {
    method: 'POST',
    body: JSON.stringify({ resume_text: resumeText }),
  });
}

export async function searchLibraryBooks(query: string = '') {
  return fetchWithAuth(`/library/search?query=${encodeURIComponent(query)}`);
}

export async function getTransportRoutes() {
  return fetchWithAuth('/transport/routes');
}

export async function getFeeDetails(studentId: string | number = '1') {
  return fetchWithAuth(`/finance/fees?student_id=${studentId}`);
}

export async function getScholarships(studentId: string | number = '1') {
  return fetchWithAuth(`/finance/scholarships?student_id=${studentId}`);
}

export async function getAdminAnalytics() {
  return fetchWithAuth('/analytics/admin');
}

export async function getExams() {
  return fetchWithAuth('/academic-ext/exams/me');
}

export async function getGradePredictions() {
  return fetchWithAuth('/academic-ext/exams/predictions/me');
}

export async function getAssignments() {
  return fetchWithAuth('/academic-ext/assignments');
}

export async function createAssignment(title: string, description: string, subject_id: string | number, deadline: string) {
  return fetchWithAuth('/academic-ext/assignments', {
    method: 'POST',
    body: JSON.stringify({ title, description, subject_id, deadline }),
  });
}

export async function submitAssignment(assignment_id: string | number, file_path: string) {
  return fetchWithAuth(`/academic-ext/assignments/${assignment_id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ assignment_id, file_path }),
  });
}

export async function getPlacementDrives() {
  return fetchWithAuth('/placements/drives');
}

export async function createPlacementDrive(payload: any) {
  return fetchWithAuth('/placements/drives', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPlacementApplications() {
  return fetchWithAuth('/placements/applications');
}

export async function applyPlacementDrive(drive_id: string | number) {
  return fetchWithAuth(`/placements/apply/${drive_id}`, {
    method: 'POST',
  });
}

export async function updatePlacementApplicationStatus(application_id: string | number, status: string) {
  return fetchWithAuth(`/placements/applications/${application_id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function getNotifications() {
  return fetchWithAuth('/notifications');
}

export async function markNotificationRead(id: string | number) {
  return fetchWithAuth(`/notifications/${id}/read`, {
    method: 'PUT',
  });
}

export async function getAnnouncements() {
  return fetchWithAuth('/academic-ext/announcements');
}

export async function createAnnouncement(title: string, content: string, target_role: string = 'all') {
  return fetchWithAuth('/academic-ext/announcements', {
    method: 'POST',
    body: JSON.stringify({ title, content, target_role }),
  });
}

export async function getClubs() {
  return fetchWithAuth('/academic-ext/clubs');
}

export async function joinClub(club_id: string | number) {
  return fetchWithAuth(`/academic-ext/clubs/${club_id}/join`, {
    method: 'POST',
  });
}
