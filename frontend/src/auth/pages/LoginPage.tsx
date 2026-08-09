import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getFriendlyErrorMessage } from '../utils/errorHelper';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isAuthenticated, role, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication verifies the user's identity.
  // Role selection during login is forbidden to prevent client-side tampering.
  // The trusted role is loaded directly from the database profile upon session verification.
  useEffect(() => {
    if (isAuthenticated && role) {
      const dashboardRoutes = {
        student: '/student/dashboard',
        faculty: '/faculty/dashboard',
        admin: '/admin/dashboard',
        hostel_warden: '/hostel/dashboard',
        placement_officer: '/placement/dashboard',
        super_admin: '/super-admin/dashboard',
      };
      navigate(dashboardRoutes[role] || '/', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);


  const validateEmail = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      console.error('Sign In Error:', err);
      setErrorMsg(getFriendlyErrorMessage(err, 'An error occurred during sign in.'));
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="flex min-h-screen w-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Decorative Blob backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>

      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-slate-900/40 border-r border-slate-900 relative z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </span>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            CampusOS <span className="text-indigo-500 font-extrabold">AI</span>
          </span>
        </Link>

        {/* Feature Highlights */}
        <div className="space-y-6 max-w-md">
          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            The AI-driven University Platform.
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            Access personalized schedules, predictive AI insights, automated workflows, and simplified campus administration in one central workspace.
          </p>
          <div className="flex gap-2">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Session Persistence
            </span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              RBAC Authorized
            </span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Safe & Secure
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-slate-400 text-xs font-medium">
          © 2026 CampusOS AI. All rights reserved.
        </p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 max-w-md w-full rounded-2xl p-8 shadow-2xl shadow-indigo-950/40 relative">
          
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600 text-white">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="font-bold text-lg text-white">CampusOS AI</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              Sign In
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 flex items-start gap-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-slate-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 text-sm pl-10 pr-4 py-3 rounded-xl outline-none transition-all placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-slate-200">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 text-sm pl-10 pr-10 py-3 rounded-xl outline-none transition-all placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo Accounts Helper */}
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Demo Quick Access Accounts:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Bhagath (Student)', email: 'bhagath.student@campus.edu', pass: 'bhagath123' },
                { label: 'Rahul (Student)', email: 'rahul.student@campus.edu', pass: 'rahul123' },
                { label: 'Faculty', email: 'arun.faculty@campus.edu', pass: 'arun123' },
                { label: 'Warden', email: 'ramesh.warden@campus.edu', pass: 'ramesh123' },
                { label: 'Super Admin', email: 'superadmin@campus.edu', pass: 'superadmin123' }
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.pass);
                    setErrorMsg('');
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800/80 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 border border-slate-700/60 transition-all"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>


          <p className="mt-8 text-center text-xs sm:text-sm font-medium text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
