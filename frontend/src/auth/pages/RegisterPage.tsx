import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, User, Mail, Lock, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { getFriendlyErrorMessage } from '../utils/errorHelper';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isAuthenticated, role, loading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && role) {
      const dashboardRoutes = {
        student: '/student/dashboard',
        faculty: '/faculty/dashboard',
        admin: '/admin/dashboard',
        hostel_warden: '/hostel/dashboard',
        placement_officer: '/placement/dashboard',
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
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!email.trim() || !validateEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!selectedRole) {
      setErrorMsg('Please select your university role.');
      return;
    }

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
      await signUp(email, password, fullName, selectedRole as UserRole);
      setSuccessMsg('Account created successfully! Redirecting you...');
      
      // Give a tiny delay for state synchronizing, then redirect
      setTimeout(() => {
        const dashboardRoutes = {
          student: '/student/dashboard',
          faculty: '/faculty/dashboard',
          admin: '/admin/dashboard',
          hostel_warden: '/hostel/dashboard',
          placement_officer: '/placement/dashboard',
        };
        navigate(dashboardRoutes[selectedRole as UserRole] || '/');
      }, 1500);
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(getFriendlyErrorMessage(err, 'An error occurred during registration.'));
      setIsSubmitting(false);
    }
  };

  const roleOptions: { value: UserRole; label: string; desc: string }[] = [
    { value: 'student', label: 'Student', desc: 'Access class portals, academics, & placements' },
    { value: 'faculty', label: 'Faculty Member', desc: 'Manage courses, grades, & schedules' },
    { value: 'admin', label: 'Administrator', desc: 'Enterprise controls & campus analytics' },
    { value: 'hostel_warden', label: 'Hostel Warden', desc: 'Manage rooms & student accommodations' },
    { value: 'placement_officer', label: 'Placement Officer', desc: 'Coordinate corporate recruitment drives' },
  ];

  return (
    <div className="flex min-h-screen w-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Decorative Blob backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>

      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12 bg-slate-900/40 border-r border-slate-900 relative z-10">
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
        <div className="space-y-6 max-w-sm">
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Create Your Campus Account.
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Fill out the registration details. Once created, your profile will be safely synchronized automatically using our RBAC framework.
          </p>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Instant Database Profile Sync</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Role-Specific Secured Routing</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-slate-400 text-xs font-medium">
          © 2026 CampusOS AI. All rights reserved.
        </p>
      </div>

      <div className="w-full lg:w-3/5 flex items-center justify-center p-6 sm:p-12 relative z-10 overflow-y-auto custom-scrollbar">
        <div className="glass-card max-w-lg w-full rounded-2xl p-8 border border-white/10 shadow-2xl relative my-8">
          
          <div className="lg:hidden flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600 text-white">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="font-bold text-lg text-white">CampusOS AI</span>
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              Create Account
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              Join CampusOS and setup your academic workspace.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start gap-2.5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium animate-fade-in">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 border border-white/10 focus:border-indigo-500 text-slate-100 text-sm pl-10 pr-4 py-3 rounded-xl outline-none transition-all placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
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
                    className="w-full bg-slate-900 border border-white/10 focus:border-indigo-500 text-slate-100 text-sm pl-10 pr-4 py-3 rounded-xl outline-none transition-all placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
                Select Your Role
              </label>
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                disabled={isSubmitting}
                className="w-full bg-slate-900 border border-white/10 focus:border-indigo-500 text-slate-100 text-sm px-4 py-3 rounded-xl outline-none transition-all cursor-pointer"
              >
                <option value="" disabled>-- Choose your campus role --</option>
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-200">
                    {opt.label} ({opt.value})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 border border-white/10 focus:border-indigo-500 text-slate-100 text-sm pl-10 pr-10 py-3 rounded-xl outline-none transition-all placeholder-slate-500"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 border border-white/10 focus:border-indigo-500 text-slate-100 text-sm pl-10 pr-10 py-3 rounded-xl outline-none transition-all placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              <span>{isSubmitting ? 'Registering User...' : 'Sign Up'}</span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-xs sm:text-sm font-medium text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
