import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { signOut, role } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleGoHome = () => {
    if (!role) {
      navigate('/');
      return;
    }
    const dashboardRoutes = {
      student: '/student/dashboard',
      faculty: '/faculty/dashboard',
      admin: '/admin/dashboard',
      placement_officer: '/placement/dashboard',
      super_admin: '/super-admin/dashboard',
    };

    navigate(dashboardRoutes[role] || '/');
  };

  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none"></div>

      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 max-w-md w-full rounded-2xl p-8 flex flex-col items-center text-center relative z-10 shadow-2xl shadow-indigo-950/40">
        <div className="mb-6 p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 animate-bounce">
          <ShieldAlert className="w-12 h-12" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">
          Access Denied
        </h1>
        <p className="text-slate-400 font-mono text-sm mb-4">ERROR CODE: 403 Forbidden</p>

        <p className="text-slate-300 text-sm leading-relaxed mb-8">
          Your current account roles do not grant permission to view this resource. 
          Please contact your administrator if you believe this is an error.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to My Dashboard</span>
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold py-2.5 px-4 rounded-xl transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out & Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
