import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import CampusOSLogo from '../../components/common/CampusOSLogo';

export const UnauthorizedPage: React.FC = () => {
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
    const dashboardRoutes: Record<string, string> = {
      student: '/student/dashboard',
      faculty: '/faculty/dashboard',
      admin: '/admin/dashboard',
      placement_officer: '/placement/dashboard',
      super_admin: '/super-admin/dashboard',
      hostel_warden: '/hostel/dashboard',
      librarian: '/library/dashboard',
    };

    navigate(dashboardRoutes[role] || '/');
  };

  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center bg-[#FFFCF7] p-6 text-[#142B43] relative overflow-hidden font-sans selection:bg-[#E85D24] selection:text-white">
      
      <div className="bg-white border border-[#EAE5DE] max-w-md w-full rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center relative z-10 shadow-xl shadow-[#142B43]/5">
        
        <div className="mb-6">
          <CampusOSLogo size="default" />
        </div>

        <div className="mb-5 p-4 rounded-2xl bg-[#FFF4EF] text-[#E85D24] border border-[#FAD8C7]">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1.5 text-[#142B43]">
          Access Restricted
        </h1>
        <p className="text-[#8898AA] font-mono text-xs mb-4">STATUS 403 • UNAUTHORIZED ROLE</p>

        <p className="text-[#63768A] text-sm leading-relaxed mb-6">
          Your current authenticated account role does not grant permission to view this campus section.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center gap-2 bg-[#E85D24] hover:bg-[#D44E18] text-white font-semibold py-3 px-4 rounded-full transition-all shadow-md shadow-[#E85D24]/20 hover:shadow-lg active:scale-95 cursor-pointer text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to My Dashboard</span>
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-[#FAF5EE] border border-[#EAE5DE] hover:bg-[#F4ECE0] text-[#142B43] font-semibold py-3 px-4 rounded-full transition-all active:scale-95 cursor-pointer text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out & Switch Role</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
