import { useAuth } from '../../auth/hooks/useAuth';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const { profile } = useAuth();
  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C211F] tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[#FDF2ED] text-[#C85A32] border border-[#EAE3D8]">
            <User className="w-5 h-5" />
          </span>
          User Profile
        </h1>
        <p className="text-sm text-[#5E6763] font-medium mt-1">View enrollment details, academic records, and security badge credentials.</p>
      </div>

      <div className="bg-white rounded-[24px] p-7 border border-[#EAE3D8] shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-[#C85A32] flex items-center justify-center text-white text-2xl font-extrabold shadow-md shadow-[#C85A32]/20 uppercase">
          {profile?.full_name?.charAt(0) || 'U'}
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-xl font-extrabold text-[#1C211F]">{profile?.full_name || 'Campus User'}</h2>
          <p className="text-xs text-[#5E6763] font-medium">Institution ID: <span className="font-mono font-bold text-[#C85A32]">{profile?.institution_id || 'N/A'}</span> • {profile?.email}</p>
          <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#F0F6F2] text-[#5E8C71] border border-[#5E8C71]/30 uppercase">Role: {profile?.role || 'User'}</span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#FDF2ED] text-[#C85A32] border border-[#EAE3D8] capitalize">Status: {profile?.status || 'active'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
