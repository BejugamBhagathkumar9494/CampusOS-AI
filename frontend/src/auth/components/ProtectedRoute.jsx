import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, status, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
          <p className="text-sm font-semibold tracking-wide text-indigo-400 animate-pulse">
            Verifying Identity & Role Permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (status && status !== 'active') {
    return <Navigate to="/unauthorized" replace />;
  }

  if (role === 'super_admin') {
    return <>{children}</>;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
