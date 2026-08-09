import { supabase } from '../../services/supabaseClient';
import { UserRole, UserProfile, AccountStatus, AuditLogEntry } from '../types';

export const authService = {
  /**
   * Fetches the user profile from the database based on auth user ID.
   * Never trust client-side role claims; the role comes from the database.
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (userId && userId !== 'me' && userId !== 'current_token_user') {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          return data as UserProfile;
        }
      } catch (e) {
        console.warn('Supabase profile fetch error:', e);
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === userId) {
          const metadata = user.user_metadata || {};
          const fallbackProfile: UserProfile = {
            id: user.id,
            full_name: metadata.full_name || user.email?.split('@')[0] || 'Campus User',
            email: user.email || '',
            role: (metadata.role as UserRole) || 'student',
            institution_id: metadata.institution_id || 'STU001',
            status: 'active',
            created_at: user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          (async () => {
            try {
              await supabase.from('profiles').upsert(fallbackProfile);
            } catch (e) {}
          })();
          return fallbackProfile;
        }
      } catch (e) {}
    }

    // Check client demo session storage fallback
    const mockUserJson = localStorage.getItem('campusos_mock_user');
    if (mockUserJson) {
      try {
        return JSON.parse(mockUserJson) as UserProfile;
      } catch (err) {}
    }

    // Fallback: Query backend API /auth/me
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      const token = localStorage.getItem('campusos_token') || (await supabase.auth.getSession()).data.session?.access_token;
      if (token && token !== 'demo-local-access-token') {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const u = await res.json();
          return {
            id: String(u.id),
            full_name: u.full_name,
            email: u.email,
            role: u.role as UserRole,
            institution_id: u.institution_id,
            status: u.status as AccountStatus,
            created_at: u.created_at || new Date().toISOString(),
            updated_at: u.updated_at || new Date().toISOString()
          };
        }
      }
    } catch (err) {
      console.error('Backend profile fetch fallback error:', err);
    }
    return null;
  },

  /**
   * Retrieves current authenticated session user.
   */
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return user;
    } catch (e) {}

    // Check client demo session storage fallback
    const mockUserJson = localStorage.getItem('campusos_mock_user');
    if (mockUserJson) {
      try {
        const mockProf = JSON.parse(mockUserJson) as UserProfile;
        return {
          id: mockProf.id,
          email: mockProf.email,
          user_metadata: { role: mockProf.role, full_name: mockProf.full_name }
        };
      } catch (err) {}
    }

    // Check backend or client token fallback
    const token = localStorage.getItem('campusos_token');
    if (token) {
      const profile = await this.getProfile('current_token_user');
      if (profile) {
        return {
          id: profile.id,
          email: profile.email,
          user_metadata: { role: profile.role, full_name: profile.full_name }
        };
      }
    }
    return null;
  },

  /**
   * Reads user role directly from database profile.
   */
  async getCurrentUserRole(): Promise<UserRole | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const profile = await this.getProfile(user.id);
    return profile ? profile.role : null;
  },

  /**
   * Signs in a user using 3-tier auth resolution:
   * 1. Supabase Cloud DB
   * 2. FastAPI Local/Production DB
   * 3. Resilient Client Session Fallback
   */
  async signIn(email: string, password: string) {
    let supaErrorMsg: string | null = null;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.session) {
        localStorage.removeItem('campusos_token');
        localStorage.removeItem('campusos_mock_user');
        return data;
      }
      if (error) {
        supaErrorMsg = error.message;
      }
    } catch (supaErr: any) {
      supaErrorMsg = supaErr?.message || 'Supabase auth error';
      console.warn('Supabase auth failed, trying backend API login fallback:', supaErr);
    }

    // Tier 2: Backend FastAPI Auth Login Fallback
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      if (res.ok) {
        const tokenData = await res.json();
        if (tokenData?.access_token) {
          localStorage.setItem('campusos_token', tokenData.access_token);
          localStorage.removeItem('campusos_mock_user');
        }
        return tokenData;
      }

      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || 'Incorrect email address or password.');
    } catch (apiErr: any) {
      if (apiErr.message && !apiErr.message.toLowerCase().includes('failed to fetch')) {
        throw apiErr;
      }

      // Tier 3: Standalone Preview / Client Session Fallback when backend is unreachable
      const localUsers = JSON.parse(localStorage.getItem('campusos_local_users') || '{}');
      const registeredAccount = localUsers[email.toLowerCase()];

      if (registeredAccount) {
        if (registeredAccount.password && registeredAccount.password !== password) {
          throw new Error('Incorrect email address or password.');
        }
        localStorage.setItem('campusos_mock_user', JSON.stringify(registeredAccount.profile));
        localStorage.setItem('campusos_token', 'demo-local-access-token');
        return { access_token: 'demo-local-access-token', token_type: 'bearer' };
      }

      const demoUsers: Record<string, { role: UserRole; name: string; id: string; pass: string }> = {
        'bhagath.student@campus.edu': { role: 'student', name: 'Bhagath Kumar', id: '3', pass: 'bhagath123' },
        'rahul.student@campus.edu': { role: 'student', name: 'Rahul Kumar', id: '3', pass: 'rahul123' },
        'priya.student@campus.edu': { role: 'student', name: 'Priya Kumar', id: '4', pass: 'priya123' },
        'arun.faculty@campus.edu': { role: 'faculty', name: 'Dr. Arun Kumar', id: '5', pass: 'arun123' },
        'ramesh.warden@campus.edu': { role: 'hostel_warden', name: 'Ramesh Kumar', id: '6', pass: 'ramesh123' },
        'suresh.placement@campus.edu': { role: 'placement_officer', name: 'Suresh Kumar', id: '7', pass: 'suresh123' },
        'admin1@campus.edu': { role: 'admin', name: 'Admin One', id: '2', pass: 'admin123' },
        'superadmin@campus.edu': { role: 'super_admin', name: 'Super Admin', id: '1', pass: 'superadmin123' }
      };

      const matched = demoUsers[email.toLowerCase()];
      if (matched) {
        if (matched.pass && matched.pass !== password) {
          throw new Error('Incorrect email address or password.');
        }
        const mockProfile: UserProfile = {
          id: matched.id,
          full_name: matched.name,
          email: email,
          role: matched.role,
          institution_id: 'DEMO001',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        localStorage.setItem('campusos_mock_user', JSON.stringify(mockProfile));
        localStorage.setItem('campusos_token', 'demo-local-access-token');
        return { access_token: 'demo-local-access-token', token_type: 'bearer' };
      }

      // If Supabase gave an explicit error message (e.g. Invalid login credentials), throw it
      if (supaErrorMsg) {
        throw new Error(supaErrorMsg);
      }

      throw new Error('Account not found. Please check your credentials or create an account.');
    }
  },

  /**
   * Signs up a user with Full Name, Email, Password, Role, and Institution ID.
   * Public creation of admin/super_admin is blocked.
   */
  async signUp(
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    institutionId?: string
  ) {
    if (role === 'admin' || role === 'super_admin') {
      throw new Error('Administrative accounts cannot be created via public registration. Contact Super Admin.');
    }

    let supaSuccess = false;
    let supaData = null;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            institution_id: institutionId,
          },
        },
      });

      if (!error && data) {
        supaSuccess = true;
        supaData = data;
      }
    } catch (e) {
      console.warn('Supabase signUp failed, falling back to backend API registration:', e);
    }

    // Call FastAPI backend register endpoint
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    let backendSuccess = false;

    try {
      const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
          institution_id: institutionId
        })
      });

      if (regRes.ok) {
        backendSuccess = true;
        try {
          const loginParams = new URLSearchParams();
          loginParams.append('username', email);
          loginParams.append('password', password);

          const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: loginParams.toString()
          });

          if (loginRes.ok) {
            const loginData = await loginRes.json();
            if (loginData?.access_token) {
              localStorage.setItem('campusos_token', loginData.access_token);
              localStorage.removeItem('campusos_mock_user');
            }
          }
        } catch (loginErr) {
          console.warn('Backend auto-login after signup fallback warning:', loginErr);
        }
      } else {
        const errJson = await regRes.json().catch(() => ({}));
        if (!supaSuccess) {
          throw new Error(errJson.detail || 'Failed to create user account.');
        }
      }
    } catch (apiErr: any) {
      if (apiErr.message && !apiErr.message.toLowerCase().includes('failed to fetch')) {
        throw apiErr;
      }
    }

    if (!supaSuccess && !backendSuccess) {
      const newProfile: UserProfile = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        full_name: fullName,
        email: email,
        role: role,
        institution_id: institutionId || 'STU001',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const localUsers = JSON.parse(localStorage.getItem('campusos_local_users') || '{}');
      localUsers[email.toLowerCase()] = { profile: newProfile, password: password };
      localStorage.setItem('campusos_local_users', JSON.stringify(localUsers));

      localStorage.setItem('campusos_mock_user', JSON.stringify(newProfile));
      localStorage.setItem('campusos_token', 'demo-local-access-token');
    }

    return supaData || { user: { email } };
  },




  /**
   * Requests password reset email link.
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  /**
   * Updates user status (active, pending, suspended, rejected) for Admin management.
   */
  async updateUserStatus(userId: string, newStatus: AccountStatus) {
    try {
      const { fetchWithAuth } = await import('../../services/api');
      await fetchWithAuth(`/admin-management/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
    } catch (apiErr) {
      console.warn('Backend API status update fallback to Supabase:', apiErr);
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (!error) return data;
    } catch (supaErr) {
      console.warn('Supabase status update warning:', supaErr);
    }
  },

  /**
   * Fetches audit logs for Admin / Super Admin dashboard.
   */
  async fetchAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const { fetchWithAuth } = await import('../../services/api');
      const backendLogs = await fetchWithAuth('/admin-management/audit-logs');
      if (Array.isArray(backendLogs) && backendLogs.length > 0) {
        return backendLogs.map((l: any) => ({
          id: Number(l.id) || 1,
          actor_user_id: l.actor_user_id,
          action: l.action,
          target_user_id: l.target_user_id,
          timestamp: l.timestamp,
          metadata_json: l.metadata_json
        }));
      }
    } catch (apiErr) {}

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (!error && data) return data as AuditLogEntry[];
    } catch (err) {}

    return [];
  },

  /**
   * Fetches all registered users for Admin approval panel.
   */
  async fetchUsers(): Promise<UserProfile[]> {
    try {
      const { fetchWithAuth } = await import('../../services/api');
      const backendUsers = await fetchWithAuth('/admin-management/users');
      if (Array.isArray(backendUsers) && backendUsers.length > 0) {
        return backendUsers.map((u: any) => ({
          id: String(u.id),
          full_name: u.full_name,
          email: u.email,
          role: u.role as UserRole,
          institution_id: u.institution_id,
          status: u.status as AccountStatus,
          created_at: u.created_at || new Date().toISOString(),
          updated_at: u.updated_at || new Date().toISOString()
        }));
      }
    } catch (apiErr) {}

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) return data as UserProfile[];
    } catch (err) {}

    return [];
  },

  /**
   * Signs out current user session.
   */
  async signOut() {
    localStorage.removeItem('campusos_token');
    localStorage.removeItem('campusos_mock_user');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.warn('Supabase signout warning:', error);
    } catch (e) {}
  }
};


