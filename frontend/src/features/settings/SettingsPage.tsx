import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { supabase } from '../../services/supabaseClient';
import { Lock, ShieldCheck, Bell, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { profile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Notification preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [examReminders, setExamReminders] = useState(true);
  const [aiAnnouncements, setAiAnnouncements] = useState(true);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    if (newPassword.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMsg('Security credentials updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setErr(e.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C211F] tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[#FDF2ED] text-[#C85A32] border border-[#C85A32]/20">
            <Lock className="w-5 h-5" />
          </span>
          Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#5E6763] font-medium mt-1">
          Manage security credentials, authentication passwords, and campus notifications.
        </p>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-[#F0F6F2] border border-[#5E8C71]/30 text-[#5E8C71] text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#5E8C71] shrink-0" />
          {msg}
        </div>
      )}
      {err && (
        <div className="p-4 rounded-xl bg-[#FEF7ED] border border-[#D9822B]/30 text-[#D9822B] text-xs font-bold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-[#D9822B] shrink-0" />
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security & Password Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAE3D8] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#1C211F] flex items-center gap-2 border-b border-[#F3ECE2] pb-3">
            <ShieldCheck className="w-4 h-4 text-[#C85A32]" /> Password & Security
          </h2>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#5E6763] mb-1">Registered Account Email</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-[#FAF7F2] text-xs text-[#8E9893] font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C211F] mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-white text-xs text-[#1C211F] outline-none focus:border-[#C85A32] focus:ring-1 focus:ring-[#C85A32]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C211F] mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE3D8] bg-white text-xs text-[#1C211F] outline-none focus:border-[#C85A32] focus:ring-1 focus:ring-[#C85A32]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !newPassword}
              className="w-full py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-bold text-xs shadow-xs disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Notifications & System Preferences */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAE3D8] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#1C211F] flex items-center gap-2 border-b border-[#F3ECE2] pb-3">
            <Bell className="w-4 h-4 text-[#C85A32]" /> Notification Preferences
          </h2>

          <div className="space-y-4 pt-1">
            <label className="flex items-start justify-between gap-3 cursor-pointer p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] hover:bg-[#F4EFEA] transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#1C211F] block">Examination Schedules</span>
                <span className="text-[11px] text-[#5E6763]">Receive alerts when examination timetables are published or revised.</span>
              </div>
              <input
                type="checkbox"
                checked={examReminders}
                onChange={(e) => setExamReminders(e.target.checked)}
                className="accent-[#C85A32] w-4 h-4 mt-1"
              />
            </label>

            <label className="flex items-start justify-between gap-3 cursor-pointer p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] hover:bg-[#F4EFEA] transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#1C211F] block">Faculty Announcements</span>
                <span className="text-[11px] text-[#5E6763]">Instant notifications for course notices and assignment updates.</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="accent-[#C85A32] w-4 h-4 mt-1"
              />
            </label>

            <label className="flex items-start justify-between gap-3 cursor-pointer p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] hover:bg-[#F4EFEA] transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#1C211F] block">AI Workspace Updates</span>
                <span className="text-[11px] text-[#5E6763]">Notifications when multi-unit exam note generation completes.</span>
              </div>
              <input
                type="checkbox"
                checked={aiAnnouncements}
                onChange={(e) => setAiAnnouncements(e.target.checked)}
                className="accent-[#C85A32] w-4 h-4 mt-1"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
