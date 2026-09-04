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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C211F] tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[#FDF2ED] text-[#C85A32] border border-[#EAE3D8]">
            <Lock className="w-5 h-5" />
          </span>
          Account Settings
        </h1>
        <p className="text-sm text-[#5E6763] font-medium mt-1">Manage security settings, notifications, active sessions, and password preferences.</p>
      </div>

      {msg && <div className="p-4 rounded-xl bg-[#F0F6F2] border border-[#5E8C71]/30 text-[#5E8C71] text-xs font-bold max-w-2xl">{msg}</div>}
      {err && <div className="p-4 rounded-xl bg-[#FDF2ED] border border-[#C85A32]/30 text-[#C85A32] text-xs font-bold max-w-2xl">{err}</div>}

      <div className="bg-white rounded-[24px] p-6 border border-[#EAE3D8] shadow-sm space-y-5 max-w-2xl">
        <h2 className="text-lg font-bold text-[#1C211F] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#C85A32]" /> Security & Authentication
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#5E6763] mb-1">Registered Email Address</label>
            <input type="email" value={profile?.email || ''} disabled className="w-full p-3 rounded-xl border border-[#EAE3D8] bg-[#FAF7F2] text-xs sm:text-sm text-[#8E9893] font-medium" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#5E6763] mb-1">New Security Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 chars)"
              className="w-full p-3 rounded-xl border border-[#EAE3D8] bg-[#FAF7F2] text-xs sm:text-sm text-[#1C211F] outline-none focus:border-[#C85A32]"
            />
          </div>
          <button
            onClick={handleUpdatePassword}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-bold text-xs shadow-md shadow-[#C85A32]/20 transition-colors"
          >
            {submitting ? 'Updating Password...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
