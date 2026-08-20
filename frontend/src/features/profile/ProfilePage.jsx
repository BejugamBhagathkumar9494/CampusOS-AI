import { useAuth } from '../../auth/hooks/useAuth.js';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const { profile } = useAuth();
  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <User className="w-5 h-5" />
          </span>
          User Profile
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">View enrollment details, academic records, and security badge credentials.</p>
      </div>

      <div className="bg-white rounded-[24px] p-7 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-md shadow-indigo-500/20 uppercase">
          {profile?.full_name?.charAt(0) || 'U'}
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-xl font-extrabold text-slate-900">{profile?.full_name || 'Campus User'}</h2>
          <p className="text-xs text-slate-500 font-medium">Institution ID: <span className="font-mono font-bold text-indigo-600">{profile?.institution_id || 'N/A'}</span> • {profile?.email}</p>
          <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase">Role: {profile?.role || 'User'}</span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 capitalize">Status: {profile?.status || 'active'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
