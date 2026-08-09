import { supabase } from '../../services/supabaseClient';
import { UserRole, UserProfile, AccountStatus, AuditLogEntry } from '../types';

export const authService = {
  /**
   * Fetches the user profile from the database based on auth user ID.
   * Never trust client-side role claims; the role comes from the database.
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
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

    // Fallback: Query backend API /auth/me or /students/me
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      const token = localStorage.getItem('campusos_token') || (await supabase.auth.getSession()).data.session?.access_token;
      if (token) {
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
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user;

    
    // Check backend token fallback
    const token = localStorage.getItem('campusos_token');
    if (token) {
      const profile = await this.getProfile('me');
      if (profile) {
        return { id: profile.id, email: profile.email };
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
   * Signs in a user using Supabase Email & Password Auth with FastAPI Backend fallback.
   * Role selection during login is prohibited.
   */
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.session) {
        localStorage.removeItem('campusos_token');
        return data;
      }
    } catch (supaErr) {
      console.warn('Supabase auth failed, falling back to backend API login:', supaErr);
    }

    // Backend FastAPI Auth Login Fallback
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || 'Incorrect email address or password.');
    }

    const tokenData = await res.json();
    if (tokenData?.access_token) {
      localStorage.setItem('campusos_token', tokenData.access_token);
    }
    return tokenData;
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

    if (error) throw error;

    // Call FastAPI backend register endpoint as sync fallback if needed
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      await fetch(`${API_URL}/auth/register`, {
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
    } catch (e) {
      console.warn('Backend sync registration optional call:', e);
    }

    return data;
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
   * Updates user status (active, suspended, rejected) for Admin management.
   */
  async updateUserStatus(userId: string, newStatus: AccountStatus) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId);

    if (error) throw error;
    return data;
  },

  /**
   * Fetches audit logs for Admin / Super Admin dashboard.
   */
  async fetchAuditLogs(): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) return [];
    return data as AuditLogEntry[];
  },

  /**
   * Fetches all registered users for Admin approval panel.
   */
  async fetchUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return data as UserProfile[];
  },

  /**
   * Signs out current user session.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};

