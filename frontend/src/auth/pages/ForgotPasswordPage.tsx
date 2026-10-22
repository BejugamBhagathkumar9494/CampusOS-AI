import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';
import { getFriendlyErrorMessage } from '../utils/errorHelper';
import CampusOSLogo from '../../components/common/CampusOSLogo';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword(email.trim());
      setSuccessMsg(`Password reset instructions have been sent to ${email.trim()}. Please check your inbox.`);
    } catch (err: any) {
      console.error('Password reset request error:', err);
      setErrorMsg(getFriendlyErrorMessage(err, 'Failed to send password reset email. Please verify your address.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-[#FFFCF7] text-[#142B43] items-center justify-center p-6 font-sans relative overflow-hidden selection:bg-[#E85D24] selection:text-white">
      
      <div className="bg-white border border-[#EAE5DE] max-w-md w-full rounded-3xl p-8 sm:p-10 shadow-xl shadow-[#142B43]/5 relative z-10">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#63768A] hover:text-[#E85D24] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        <div className="mb-6">
          <CampusOSLogo size="default" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142B43] tracking-tight mb-2">
          Forgot Password?
        </h1>
        <p className="text-[#63768A] text-sm font-medium mb-6">
          Enter your registered university email address to receive password reset instructions.
        </p>

        {errorMsg && (
          <div className="mb-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs sm:text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg ? (
          <div className="p-4 rounded-2xl bg-[#EAF7F0] border border-[#C6E7D6] text-[#2E9B65] text-xs sm:text-sm font-medium flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#142B43] mb-1.5">
                Registered University Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8898AA] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@campus.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#EAE5DE] bg-[#FAF5EE]/60 hover:bg-[#FAF5EE] focus:bg-white text-[#142B43] text-sm focus:border-[#E85D24] focus:ring-1 focus:ring-[#E85D24] outline-none transition-all placeholder-[#8898AA]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#E85D24] hover:bg-[#D44E18] text-white rounded-full font-semibold text-sm shadow-md shadow-[#E85D24]/20 hover:shadow-lg hover:shadow-[#E85D24]/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Sending Instructions...' : 'Send Reset Link'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
