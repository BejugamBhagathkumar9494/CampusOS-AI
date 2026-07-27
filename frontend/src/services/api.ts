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
 * Performs authenticated requests to the backend API.
 */
async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAuthToken();
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired, clear and retry once
    localStorage.removeItem('campusos_token');
    const newToken = await getAuthToken();
    const retryHeaders = {
      ...options.headers,
      'Authorization': `Bearer ${newToken}`,
      'Content-Type': 'application/json',
    };
    const retryResponse = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: retryHeaders,
    });
    if (!retryResponse.ok) {
      throw new Error(`API Error: ${retryResponse.statusText}`);
    }
    return retryResponse.json();
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// API Functions
export async function getStudentProfile(): Promise<any> {
  return fetchWithAuth('/students/me');
}

export async function getStudentAttendance(studentId: number): Promise<any> {
  return fetchWithAuth(`/students/${studentId}/attendance`);
}

export async function getStudentMarks(studentId: number): Promise<any> {
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
