import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient.js';
import { authService } from '../services/authService.js';

export const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndSetState = async (currUser) => {
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
        const fallbackProfile = {
          id: currUser.id,
          full_name: metadata.full_name || currUser.email?.split('@')[0] || 'Campus User',
          email: currUser.email || '',
          role: metadata.role || 'student',
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

  const signIn = async (email, password) => {
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

  const signUp = async (email, password, fullName, role, institutionId) => {
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
