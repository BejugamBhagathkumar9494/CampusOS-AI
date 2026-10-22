import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import CampusOSLogo from '../../components/common/CampusOSLogo';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccessMsg('Password updated successfully! Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      console.error('Update password error:', err);
      setErrorMsg(err.message || 'Failed to update password.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-[#FFFCF7] text-[#142B43] items-center justify-center p-6 font-sans relative overflow-hidden selection:bg-[#E85D24] selection:text-white">
      
      <div className="bg-white border border-[#EAE5DE] max-w-md w-full rounded-3xl p-8 sm:p-10 shadow-xl shadow-[#142B43]/5 relative z-10">
        <div className="mb-6">
          <CampusOSLogo size="default" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142B43] tracking-tight mb-2">
          Set New Password
        </h1>
        <p className="text-[#63768A] text-sm font-medium mb-6">
          Enter a secure password for your CampusOS account.
        </p>

        {errorMsg && (
          <div className="mb-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs sm:text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-[#EAF7F0] border border-[#C6E7D6] text-[#2E9B65] text-xs sm:text-sm font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-[#142B43] mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8898AA]" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                required
                className="w-full bg-[#FAF5EE]/60 hover:bg-[#FAF5EE] focus:bg-white border border-[#EAE5DE] focus:border-[#E85D24] focus:ring-1 focus:ring-[#E85D24] text-[#142B43] text-sm pl-10 pr-10 py-3 rounded-xl outline-none transition-all placeholder-[#8898AA]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-[#8898AA] hover:text-[#142B43]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-[#142B43] mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8898AA]" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                required
                className="w-full bg-[#FAF5EE]/60 hover:bg-[#FAF5EE] focus:bg-white border border-[#EAE5DE] focus:border-[#E85D24] focus:ring-1 focus:ring-[#E85D24] text-[#142B43] text-sm pl-10 pr-10 py-3 rounded-xl outline-none transition-all placeholder-[#8898AA]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-[#E85D24] hover:bg-[#D44E18] text-white font-semibold py-3.5 rounded-full shadow-md shadow-[#E85D24]/20 hover:shadow-lg hover:shadow-[#E85D24]/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-3 cursor-pointer"
          >
            <span>{isSubmitting ? 'Updating Password...' : 'Update Password'}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
