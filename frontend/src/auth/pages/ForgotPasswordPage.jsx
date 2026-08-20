import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, AlertCircle, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService.js';
import { getFriendlyErrorMessage } from '../utils/errorHelper.js';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword(email);
      setSuccessMsg(`Password reset link sent to ${email}. Check your inbox.`);
    } catch (err) {
      console.error('Password reset request error:', err);
      setErrorMsg(getFriendlyErrorMessage(err, 'Failed to send password reset email.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-slate-950 text-slate-100 items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 max-w-md w-full rounded-2xl p-8 shadow-2xl relative z-10">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        <div className="flex items-center gap-2 mb-6">
          <span className="p-1.5 rounded-lg bg-indigo-600 text-white">
            <Sparkles className="w-5 h-5" />
          </span>
          <span className="font-bold text-xl text-white">CampusOS AI</span>
        </div>

        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
          Forgot Password?
        </h1>
        <p className="text-slate-400 text-sm font-medium mb-6">
          Enter your registered university email address to receive password reset instructions.
        </p>

        {errorMsg && (
          <div className="mb-6 flex items-start gap-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Registered Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@campus.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs sm:text-sm focus:border-indigo-500 outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Sending Instructions...' : 'Send Reset Link'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
