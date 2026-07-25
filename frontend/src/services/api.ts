const API_URL = 'http://localhost:8000/api/v1';

/**
 * Automatically authenticates the default seeded student user and saves the JWT token.
 */
export async function getAuthToken(): Promise<string> {
  const cachedToken = localStorage.getItem('campusos_token');
  if (cachedToken) {
    return cachedToken;
  }

  try {
    const params = new URLSearchParams();
    params.append('username', 'john.doe@university.edu');
    params.append('password', 'student_password_2026');

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error('Failed to login default user');
    }

    const data = await response.json();
    localStorage.setItem('campusos_token', data.access_token);
    return data.access_token;
  } catch (error) {
    console.error('Auth Login Error:', error);
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
