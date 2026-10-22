import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Sparkles,
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Calendar,
  BookOpen,
  MessageSquare,
  Shield,
  Activity,
  Play
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getFriendlyErrorMessage } from '../utils/errorHelper';
import CampusOSLogo from '../../components/common/CampusOSLogo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated, role, loading, loginAsDemoStudent } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg] = useState((location.state as any)?.infoMessage || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && role) {
      const dashboardRoutes: Record<string, string> = {
        student: '/student/dashboard',
        faculty: '/faculty/dashboard',
        admin: '/admin/dashboard',
        hostel_warden: '/hostel/dashboard',
        placement_officer: '/placement/dashboard',
        super_admin: '/super-admin/dashboard',
        librarian: '/library/dashboard',
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

    if (!validateEmail(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      console.error('Sign In Error:', err);
      setErrorMsg(getFriendlyErrorMessage(err, 'Invalid credentials. Please verify your email and password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsDemoLoading(true);
    setErrorMsg('');
    try {
      await loginAsDemoStudent();
      navigate('/student/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Demo Student login failed:', err);
      setErrorMsg('Failed to initialize demo session. Please try standard sign in.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FFFCF7] text-[#142B43] flex flex-col lg:flex-row font-sans selection:bg-[#E85D24] selection:text-white">
      
      {/* ─── LEFT PANEL: BRANDING & PRODUCT INTRODUCTION ──────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 bg-[#FFFCF7] border-b lg:border-b-0 lg:border-r border-[#EAE5DE] relative overflow-hidden">
        
        {/* Top: Brand Logo */}
        <div className="flex items-center justify-between mb-8">
          <CampusOSLogo size="default" />
          <Link
            to="/"
            className="text-xs font-semibold text-[#63768A] hover:text-[#E85D24] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Content Section: Eyebrow, Heading, Description, Benefit Chips */}
        <div className="space-y-5 max-w-xl z-10 my-auto py-4">
          
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF4EF] border border-[#FAD8C7] text-[#E85D24] text-xs font-semibold tracking-wide shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E85D24] animate-pulse"></span>
            <span>AI-Powered Campus Management System</span>
          </div>

          {/* Heading with Terracotta Highlight on "Platform." */}
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#142B43] leading-[1.15]">
            The AI-driven University{' '}
            <span className="text-[#E85D24]">Platform.</span>
          </h1>

          {/* Description Paragraph */}
          <p className="text-[#63768A] text-sm sm:text-base leading-relaxed max-w-lg">
            Access personalized schedules, predictive AI insights, automated workflows, and simplified campus administration in one central workspace.
          </p>

          {/* Three Compact Benefit Chips */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#EAE5DE] text-xs font-semibold text-[#142B43] shadow-sm">
              <GraduationCap className="w-3.5 h-3.5 text-[#E85D24]" />
              <span>Smarter Academics</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#EAE5DE] text-xs font-semibold text-[#142B43] shadow-sm">
              <Activity className="w-3.5 h-3.5 text-[#2E9B65]" />
              <span>Real-time Insights</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#EAE5DE] text-xs font-semibold text-[#142B43] shadow-sm">
              <Shield className="w-3.5 h-3.5 text-[#142B43]" />
              <span>Secure & Reliable</span>
            </div>
          </div>
        </div>

        {/* Campus Illustration & Three Floating Feature Cards (hidden on mobile below 640px for single-column usability) */}
        <div className="relative mt-6 pt-2 pb-4 hidden sm:block">
          
          {/* Illustration Container */}
          <div className="relative rounded-2xl overflow-hidden border border-[#EAE5DE] shadow-md bg-white">
            <img
              src="/images/campus-hero.jpg"
              alt="CampusOS AI Campus View"
              className="w-full h-48 sm:h-56 md:h-64 object-cover object-center"
            />
            {/* Subtle bottom fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#FFFCF7]/60 via-transparent to-transparent pointer-events-none" />

            {/* Three Floating Feature Cards Overlaid */}
            
            {/* Card 1: Upcoming Events */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md border border-[#EAE5DE] rounded-xl px-3 py-2 shadow-md shadow-[#142B43]/5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#FFF4EF] text-[#E85D24] flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#142B43]">Upcoming Events</p>
                <p className="text-[9px] text-[#63768A]">AI Workshop @ 2:30 PM</p>
              </div>
            </div>

            {/* Card 2: My Courses */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md border border-[#EAE5DE] rounded-xl px-3 py-2 shadow-md shadow-[#142B43]/5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#EAF7F0] text-[#2E9B65] flex items-center justify-center shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#142B43]">My Courses</p>
                <p className="text-[9px] text-[#2E9B65] font-semibold">94% Attendance</p>
              </div>
            </div>

            {/* Card 3: Ask AI Assistant */}
            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md border border-[#FAD8C7] rounded-xl px-3 py-2 shadow-md shadow-[#E85D24]/10 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#FFF4EF] text-[#E85D24] flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#E85D24]">Ask AI Assistant</p>
                <p className="text-[9px] text-[#142B43]">24/7 Smart RAG</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Text */}
        <div className="pt-4 border-t border-[#EAE5DE]/60 text-xs text-[#8898AA]">
          <p>© 2026 CampusOS AI. All rights reserved.</p>
        </div>
      </div>

      {/* ─── RIGHT PANEL: AUTHENTICATION CARD ──────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-[#FAF5EE]/70">
        <div className="bg-white border border-[#EAE5DE] max-w-md w-full rounded-3xl p-8 sm:p-10 shadow-xl shadow-[#142B43]/5 relative">
          
          {/* Header Title */}
          <div className="mb-7">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142B43] tracking-tight mb-2">
              Sign In
            </h2>
            <p className="text-[#63768A] text-sm">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          {/* Info Banner */}
          {infoMsg && !errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-[#EAF7F0] border border-[#C6E7D6] text-[#2E9B65] text-xs sm:text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#2E9B65]" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs sm:text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-xs sm:text-sm font-semibold text-[#142B43] mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8898AA]" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  disabled={isSubmitting}
                  required
                  className="w-full bg-[#FAF5EE]/60 hover:bg-[#FAF5EE] focus:bg-white border border-[#EAE5DE] focus:border-[#E85D24] focus:ring-1 focus:ring-[#E85D24] text-[#142B43] text-sm pl-10 pr-4 py-3 rounded-xl outline-none transition-all placeholder-[#8898AA]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label 
                  htmlFor="password" 
                  className="block text-xs sm:text-sm font-semibold text-[#142B43]"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#E85D24] hover:text-[#D44E18] font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
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
                  className="absolute right-3 top-3.5 text-[#8898AA] hover:text-[#142B43] focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full flex items-center justify-center gap-2 bg-[#E85D24] hover:bg-[#D44E18] text-white font-semibold py-3.5 rounded-full shadow-md shadow-[#E85D24]/20 hover:shadow-lg hover:shadow-[#E85D24]/30 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-3 cursor-pointer"
            >
              <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo Option for Evaluators */}
          <div className="mt-5 pt-4 border-t border-[#EAE5DE]/80 text-center">
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={isDemoLoading || isSubmitting}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E85D24] hover:text-[#D44E18] bg-[#FFF4EF] hover:bg-[#FFEADA] px-3.5 py-1.5 rounded-full border border-[#FAD8C7] transition-colors"
            >
              <Play className="w-3 h-3 fill-[#E85D24]" />
              <span>{isDemoLoading ? 'Launching demo...' : 'Try Live Student Demo (No Credentials)'}</span>
            </button>
          </div>

          {/* Footer Navigation */}
          <p className="mt-6 text-center text-xs sm:text-sm font-medium text-[#63768A]">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="text-[#E85D24] hover:text-[#D44E18] font-semibold hover:underline"
            >
              Create an account
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
};

export default LoginPage;
