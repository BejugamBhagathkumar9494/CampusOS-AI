import { supabase } from '../../services/supabaseClient';
import { UserRole, UserProfile } from '../types';

export const authService = {
  /**
   * Fetches the user profile from the database based on auth user ID.
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error.message);
      return null;
    }

    return data as UserProfile;
  },

  /**
   * Retrieves the current authenticated user from Supabase.
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    return user;
  },

  /**
   * Reusable function to detect current user's role.
   * Reads current authenticated user, fetches profile, and returns role.
   */
  async getCurrentUserRole(): Promise<UserRole | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const profile = await this.getProfile(user.id);
    return profile ? profile.role : null;
  },

  /**
   * Signs in a user using Supabase Email & Password Auth.
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
   * Signs up a user using Supabase Email & Password.
   * Leverages auth options metadata to sync with profiles table via SQL trigger.
   */
  async signUp(email: string, password: string, fullName: string, role: UserRole) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Signs out the current user.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};
