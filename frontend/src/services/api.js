import { supabase } from './supabaseClient.js';

export function getApiBaseUrl() {
  let url = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').trim();
  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
}

export async function getAuthToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
  } catch (error) {
    console.error('Error fetching Supabase auth session token:', error);
  }
  return localStorage.getItem('campusos_token') || '';
}

export async function fetchWithAuth(endpoint, options = {}) {
  const token = await getAuthToken();
  const headers = {
    ...(options.headers || {}),
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

export async function getStudentAttendance(studentId = 1) {
  return fetchWithAuth(`/students/${studentId}/attendance`);
}

export async function getStudentMarks(studentId = 1) {
  return fetchWithAuth(`/students/${studentId}/marks`);
}

export async function chatWithAgent(message, chatId, category, role, agenticMode = true) {
  return fetchWithAuth('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, chat_id: chatId, category, role, agentic_mode: agenticMode }),
  });
}

export async function searchKnowledgeBase(query, category) {
  return fetchWithAuth('/ai/knowledge/search', {
    method: 'POST',
    body: JSON.stringify({ query, category }),
  });
}

export async function uploadKnowledgeDocument(file, category = 'General', allowedRoles = 'student,faculty,admin') {
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

export async function predictPlacementReadiness(input) {
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

export async function reviewResume(resumeText) {
  return fetchWithAuth('/placements/resume-review', {
    method: 'POST',
    body: JSON.stringify({ resume_text: resumeText }),
  });
}

export async function searchLibraryBooks(query = '') {
  return fetchWithAuth(`/library/search?query=${encodeURIComponent(query)}`);
}

export async function getHostelComplaints() {
  return fetchWithAuth('/hostel/complaints');
}

export async function fileHostelComplaint(title, description, room_number = '302-B') {
  return fetchWithAuth('/hostel/complaints', {
    method: 'POST',
    body: JSON.stringify({ title, description, room_number }),
  });
}

export async function getTransportRoutes() {
  return fetchWithAuth('/transport/routes');
}

export async function getFeeDetails(studentId = '1') {
  return fetchWithAuth(`/finance/fees?student_id=${studentId}`);
}

export async function getScholarships(studentId = '1') {
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

export async function createAssignment(title, description, subject_id, deadline) {
  return fetchWithAuth('/academic-ext/assignments', {
    method: 'POST',
    body: JSON.stringify({ title, description, subject_id, deadline }),
  });
}

export async function submitAssignment(assignment_id, file_path) {
  return fetchWithAuth(`/academic-ext/assignments/${assignment_id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ assignment_id, file_path }),
  });
}

export async function getPlacementDrives() {
  return fetchWithAuth('/placements/drives');
}

export async function createPlacementDrive(payload) {
  return fetchWithAuth('/placements/drives', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPlacementApplications() {
  return fetchWithAuth('/placements/applications');
}

export async function applyPlacementDrive(drive_id) {
  return fetchWithAuth(`/placements/apply/${drive_id}`, {
    method: 'POST',
  });
}

export async function updatePlacementApplicationStatus(application_id, status) {
  return fetchWithAuth(`/placements/applications/${application_id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function getHostelLeaveRequests() {
  return fetchWithAuth('/hostel/leave-requests');
}

export async function applyHostelLeave(reason, start_date, end_date) {
  return fetchWithAuth('/hostel/leave-requests', {
    method: 'POST',
    body: JSON.stringify({ reason, start_date, end_date }),
  });
}

export async function reviewHostelLeave(request_id, status) {
  return fetchWithAuth(`/hostel/leave-requests/${request_id}/review`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function getNotifications() {
  return fetchWithAuth('/notifications');
}

export async function markNotificationRead(id) {
  return fetchWithAuth(`/notifications/${id}/read`, {
    method: 'PUT',
  });
}

export async function getAnnouncements() {
  return fetchWithAuth('/academic-ext/announcements');
}

export async function createAnnouncement(title, content, target_role = 'all') {
  return fetchWithAuth('/academic-ext/announcements', {
    method: 'POST',
    body: JSON.stringify({ title, content, target_role }),
  });
}

export async function getClubs() {
  return fetchWithAuth('/academic-ext/clubs');
}

export async function joinClub(club_id) {
  return fetchWithAuth(`/academic-ext/clubs/${club_id}/join`, {
    method: 'POST',
  });
}
