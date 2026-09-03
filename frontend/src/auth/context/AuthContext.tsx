import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../services/supabaseClient';
import { authService } from '../services/authService';
import { UserProfile, UserRole } from '../../types';

export interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  role: UserRole | null;
  status: string;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, fullName: string, role: UserRole, institutionId?: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfileAndSetState = async (currUser: any) => {
    if (!currUser) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const userProfile = await authService.getProfile(currUser.id);
      if (userProfile) {
        setUser(currUser);
        setProfile(userProfile);
      } else {
        const metadata = currUser.user_metadata || {};
        const fallbackProfile: UserProfile = {
          id: currUser.id,
          full_name: metadata.full_name || currUser.email?.split('@')[0] || 'Campus User',
          email: currUser.email || '',
          role: (metadata.role as UserRole) || 'student',
          institution_id: metadata.institution_id || 'STU001',
          status: 'active',
          created_at: currUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUser(currUser);
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.error('Failed to load user profile during auth state transition:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const userProfile = await authService.getProfile(user.id);
      if (userProfile) setProfile(userProfile);
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchProfileAndSetState(session.user);
        } else {
          const fallbackUser = await authService.getCurrentUser();
          if (fallbackUser) {
            await fetchProfileAndSetState(fallbackUser);
          } else {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Failed to retrieve initial auth session:', err);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          if (session?.user) {
            await fetchProfileAndSetState(session.user);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            // Refresh in background without setting full-page loading spinner
            setUser(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authService.signIn(email, password);
      const currUser = await authService.getCurrentUser();
      if (currUser) {
        await fetchProfileAndSetState(currUser);
      } else {
        setLoading(false);
        throw new Error('Authentication succeeded but current user session could not be established.');
      }
      return data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole, institutionId?: string) => {
    setLoading(true);
    try {
      const data = await authService.signUp(email, password, fullName, role, institutionId);
      const currUser = await authService.getCurrentUser();
      if (currUser) {
        await fetchProfileAndSetState(currUser);
      } else {
        setLoading(false);
      }
      return data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('campusos_token');
      await authService.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const role = profile ? profile.role : null;
  const status = profile ? profile.status : 'active';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        status,
        loading,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
