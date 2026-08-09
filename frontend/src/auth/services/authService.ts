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

      if (error || !data) {
        // Fallback: Query backend API /students/me or user endpoint
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const res = await fetch(`${API_URL}/students/me`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          if (res.ok) {
            const studentData = await res.json();
            return {
              id: userId,
              full_name: studentData.user?.full_name || 'Campus User',
              email: studentData.user?.email || session.user.email || '',
              role: (studentData.user?.role || 'student') as UserRole,
              institution_id: studentData.roll_number,
              status: (studentData.user?.status || 'active') as AccountStatus,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
        }
        return null;
      }

      return data as UserProfile;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  },

  /**
   * Retrieves current authenticated session user.
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
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
   * Signs in a user using Supabase Email & Password Auth.
   * Role selection during login is prohibited.
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
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

