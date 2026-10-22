import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Calendar,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getFriendlyErrorMessage } from '../utils/errorHelper';
import { UserRole } from '../../types';
import CampusOSLogo from '../../components/common/CampusOSLogo';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isAuthenticated, role, loading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [institutionId, setInstitutionId] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const roleEmailTags: Record<string, string> = {
      student: '.student',
      faculty: '.faculty',
      placement_officer: '.pofficer',
      hostel_warden: '.warden',
      librarian: '.librarian'
    };

    if (!selectedRole) {
      setErrorMsg('Please select your university role.');
      return;
    }

    const reqTag = roleEmailTags[selectedRole] || `.${selectedRole}`;
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !validateEmail(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!cleanEmail.endsWith('@campus.edu') && !cleanEmail.endsWith('@campusos.edu')) {
      setErrorMsg(`Email must end with @campus.edu (e.g. username${reqTag}@campus.edu).`);
      return;
    }

    if (!cleanEmail.includes(reqTag)) {
      setErrorMsg(`Email for role '${selectedRole}' must contain '${reqTag}' before @campus.edu (e.g. 'name${reqTag}@campus.edu').`);
      return;
    }

    if (!institutionId.trim()) {
      setErrorMsg('Please enter your Institution ID / Role-specific ID.');
      return;
    }

    if (selectedRole === 'admin' || selectedRole === 'super_admin') {
      setErrorMsg('Administrator accounts cannot be created through public registration. Only an authorized Super Admin can grant administrative access.');
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
      await signUp(cleanEmail, password, fullName.trim(), selectedRole as UserRole, institutionId.trim().toUpperCase());
      const pendingMsg = 'Registration submitted successfully! Your account registration is pending Superadmin approval. Once approved, you will be able to access CampusOS.';
      setSuccessMsg(pendingMsg);
      
      setTimeout(() => {
        navigate('/login', { state: { infoMessage: pendingMsg } });
      }, 2500);
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(getFriendlyErrorMessage(err, 'An error occurred during registration.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { value: 'student', label: 'Student (.student@campus.edu)', desc: 'Access class portals, academics, & placements', sampleId: 'e.g. STU001', tag: '.student' },
    { value: 'faculty', label: 'Faculty Member (.faculty@campus.edu)', desc: 'Manage courses, grades, & schedules', sampleId: 'e.g. FAC001', tag: '.faculty' },
    { value: 'placement_officer', label: 'Placement Officer (.pofficer@campus.edu)', desc: 'Coordinate corporate recruitment drives', sampleId: 'e.g. PO001', tag: '.pofficer' },
    { value: 'hostel_warden', label: 'Hostel Warden (.warden@campus.edu)', desc: 'Manage room allotments & student welfare', sampleId: 'e.g. WAR001', tag: '.warden' },
    { value: 'librarian', label: 'Librarian (.librarian@campus.edu)', desc: 'Manage digital & physical library access', sampleId: 'e.g. LIB001', tag: '.librarian' },
  ];

  return (
    <div className="min-h-screen w-full bg-[#FFFCF7] text-[#142B43] flex flex-col lg:flex-row font-sans selection:bg-[#E85D24] selection:text-white">
      
      {/* ─── LEFT PANEL: BRANDING & ROLE OVERVIEW ─────────────────────────── */}
      <div className="w-full lg:w-2/5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 bg-[#FFFCF7] border-b lg:border-b-0 lg:border-r border-[#EAE5DE] relative overflow-hidden">
        
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

        {/* Content */}
        <div className="space-y-5 max-w-md z-10 my-auto py-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF4EF] border border-[#FAD8C7] text-[#E85D24] text-xs font-semibold tracking-wide shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E85D24]"></span>
            <span>Identity & Access Verification</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#142B43] leading-tight">
            Create Your Campus{' '}
            <span className="text-[#E85D24]">Account.</span>
          </h1>

          <p className="text-[#63768A] text-sm leading-relaxed">
            Register with your institution email. Role-based privileges are governed by CampusOS database security.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2.5 text-xs font-medium text-[#142B43] bg-white p-2.5 rounded-xl border border-[#EAE5DE]">
              <ShieldCheck className="w-4 h-4 text-[#2E9B65] shrink-0" />
              <span>Verified Institutional Email Authentication</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-medium text-[#142B43] bg-white p-2.5 rounded-xl border border-[#EAE5DE]">
              <GraduationCap className="w-4 h-4 text-[#E85D24] shrink-0" />
              <span>Role-Tailored Academic & Administrative Dashboards</span>
            </div>
          </div>
        </div>

        {/* Campus Graphic Preview (hidden on mobile below 640px) */}
        <div className="relative mt-6 pt-2 pb-2 hidden sm:block">
          <div className="relative rounded-2xl overflow-hidden border border-[#EAE5DE] shadow-sm bg-white">
            <img
              src="/images/campus-hero.jpg"
              alt="Campus View"
              className="w-full h-40 object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FFFCF7]/60 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-4 border-t border-[#EAE5DE]/60 text-xs text-[#8898AA]">
          <p>© 2026 CampusOS AI. All rights reserved.</p>
        </div>
      </div>

      {/* ─── RIGHT PANEL: REGISTRATION CARD ───────────────────────────────── */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-14 bg-[#FAF5EE]/70 overflow-y-auto">
        <div className="bg-white border border-[#EAE5DE] max-w-xl w-full rounded-3xl p-8 sm:p-10 shadow-xl shadow-[#142B43]/5 relative my-4">
          
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142B43] tracking-tight mb-1.5">
              Create Account
            </h2>
            <p className="text-[#63768A] text-sm">
              Join CampusOS and initialize your university identity.
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs sm:text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-[#EAF7F0] border border-[#C6E7D6] text-[#2E9B65] text-xs sm:text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#2E9B65]" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-xs font-semibold text-[#142B43] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8898AA]" />
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ananya Sharma"
                    disabled={isSubmitting}
                    required
                    className="w-full bg-[#FAF5EE]/60 hover:bg-[#FAF5EE] focus:bg-white border border-[#EAE5DE] focus:border-[#E85D24] text-[#142B43] text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-[#8898AA]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-[#142B43] mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8898AA]" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user.student@campus.edu"
                    disabled={isSubmitting}
                    required
                    className="w-full bg-[#FAF5EE]/60 hover:bg-[#FAF5EE] focus:bg-white border border-[#EAE5DE] focus:border-[#E85D24] text-[#142B43] text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-[#8898AA]"
                  />
                </div>
              </div>
            </div>

            {/* Role & Institution ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="block text-xs font-semibold text-[#142B43] mb-1.5">
                  Campus Role
                </label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  disabled={isSubmitting}
                  required
                  className="w-full bg-[#FAF5EE]/60 hover:bg-[#FAF5EE] focus:bg-white border border-[#EAE5DE] focus:border-[#E85D24] text-[#142B43] text-sm px-3.5 py-2.5 rounded-xl outline-none transition-all cursor-pointer"
                >
                  <option value="" disabled>-- Select campus role --</option>
                  {roleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="institutionId" className="block text-xs font-semibold text-[#142B43] mb-1.5">
                  Institution ID / Hall Ticket
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8898AA]" />
                  <input
                    type="text"
                    id="institutionId"
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value.toUpperCase())}
                    placeholder={
                      selectedRole === 'student' ? 'STU001' :
                      selectedRole === 'faculty' ? 'FAC001' :
                      selectedRole === 'hostel_warden' ? 'WAR001' :
                      selectedRole === 'placement_officer' ? 'PO001' : 'e.g. STU001'
                    }
                    disabled={isSubmitting}
                    required
                    className="w-full bg-[#FAF5EE]/60 hover:bg-[#FAF5EE] focus:bg-white border border-[#EAE5DE] focus:border-[#E85D24] text-[#142B43] text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-[#8898AA] uppercase font-mono tracking-wider"
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-[#142B43] mb-1.5">
                  Password
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
                    className="w-full bg-[#FAF5EE]/60 hover:bg-[#FAF5EE] focus:bg-white border border-[#EAE5DE] focus:border-[#E85D24] text-[#142B43] text-sm pl-10 pr-10 py-2.5 rounded-xl outline-none transition-all placeholder-[#8898AA]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#8898AA] hover:text-[#142B43]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-[#142B43] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8898AA]" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    required
                    className="w-full bg-[#FAF5EE]/60 hover:bg-[#FAF5EE] focus:bg-white border border-[#EAE5DE] focus:border-[#E85D24] text-[#142B43] text-sm pl-10 pr-10 py-2.5 rounded-xl outline-none transition-all placeholder-[#8898AA]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-[#8898AA] hover:text-[#142B43]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full flex items-center justify-center gap-2 bg-[#E85D24] hover:bg-[#D44E18] text-white font-semibold py-3.5 rounded-full shadow-md shadow-[#E85D24]/20 hover:shadow-lg hover:shadow-[#E85D24]/30 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-3 cursor-pointer"
            >
              <span>{isSubmitting ? 'Registering Account...' : 'Sign Up'}</span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Footer Navigation */}
          <p className="mt-6 text-center text-xs sm:text-sm font-medium text-[#63768A]">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-[#E85D24] hover:text-[#D44E18] font-semibold hover:underline"
            >
              Sign in instead
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
};

export default RegisterPage;
