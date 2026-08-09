import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { authService } from '../services/authService';
import { UserRole, UserProfile, AccountStatus } from '../types';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  role: UserRole | null;
  status: AccountStatus | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string, role: UserRole, institutionId?: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Authentication verifies identity; trusted role and account status are retrieved from DB profile.
  const fetchProfileAndSetState = async (currUser: any) => {
    if (!currUser) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const userProfile = await authService.getProfile(currUser.id);
      setUser(currUser);
      setProfile(userProfile);
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
      setProfile(userProfile);
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  useEffect(() => {
    // Initial session retrieval
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchProfileAndSetState(session.user);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to retrieve initial auth session:', err);
        setLoading(false);
      }
    };

    initializeAuth();

    // Auth State Change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setLoading(true);
            await fetchProfileAndSetState(session.user);
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
      }
      return data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    institutionId?: string
  ) => {
    setLoading(true);
    try {
      const data = await authService.signUp(email, password, fullName, role, institutionId);
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

