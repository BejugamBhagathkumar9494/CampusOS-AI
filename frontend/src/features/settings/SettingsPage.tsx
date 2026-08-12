import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { supabase } from '../../services/supabaseClient';
import { Lock, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const { profile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleUpdatePassword = async () => {
    setMsg('');
    setErr('');
    if (newPassword.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMsg('Security password updated successfully!');
      setNewPassword('');
    } catch (e: any) {
      setErr(e.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <Lock className="w-5 h-5" />
          </span>
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Manage security settings, notifications, active sessions, and password preferences.</p>
      </div>

      {msg && <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold max-w-2xl">{msg}</div>}
      {err && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold max-w-2xl">{err}</div>}

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-5 max-w-2xl">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" /> Security & Authentication
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Registered Email Address</label>
            <input type="email" value={profile?.email || ''} disabled className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-500 font-medium" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">New Security Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500"
            />
          </div>
          <button onClick={handleUpdatePassword} disabled={submitting} className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-bold shadow-xs hover:from-indigo-500 hover:to-violet-500 transition-all">
            {submitting ? 'Updating...' : 'Update Security Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
