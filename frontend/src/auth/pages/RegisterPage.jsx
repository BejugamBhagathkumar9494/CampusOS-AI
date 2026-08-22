import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, User, Mail, Lock, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { getFriendlyErrorMessage } from '../utils/errorHelper.js';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { signUp, isAuthenticated, role, loading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const validateEmail = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const roleEmailTags = {
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
      await signUp(email, password, fullName, selectedRole, institutionId);
      const pendingMsg = 'Request has been successfully sent. Your account registration is pending Superadmin approval. Once approved by Superadmin, you will be able to access CampusOS.';
      setSuccessMsg(pendingMsg);
      
      setTimeout(() => {
        navigate('/login', { state: { infoMessage: pendingMsg } });
      }, 3000);
    } catch (err) {
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
  ];

  return (
    <div className="flex min-h-screen w-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>

      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12 bg-slate-900/40 border-r border-slate-900 relative z-10">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </span>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            CampusOS <span className="text-indigo-500 font-extrabold">AI</span>
          </span>
        </Link>

        <div className="space-y-6 max-w-sm">
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Create Your Campus Account.
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Register with your institution credentials. Identity and role access are strictly authorized by CampusOS database security.
          </p>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Institution Identity</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Zero-Trust Database RLS Enforcement</span>
            </div>
          </div>
        </div>

        <p className="text-slate-400 text-xs font-medium">
          © 2026 CampusOS AI. All rights reserved.
        </p>
      </div>

      <div className="w-full lg:w-3/5 flex items-center justify-center p-6 sm:p-12 relative z-10 overflow-y-auto custom-scrollbar">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 max-w-lg w-full rounded-2xl p-8 shadow-2xl shadow-indigo-950/40 relative my-8">
          
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
              Join CampusOS and set up your authenticated workspace.
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
                <label htmlFor="fullName" className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Rahul Kumar"
                    disabled={isSubmitting}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 text-sm pl-10 pr-4 py-3 rounded-xl outline-none transition-all placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul.student@campus.edu"
                    disabled={isSubmitting}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 text-sm pl-10 pr-4 py-3 rounded-xl outline-none transition-all placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1.5">
                  Requested Role
                </label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 text-sm px-4 py-3 rounded-xl outline-none transition-all cursor-pointer"
                >
                  <option value="" disabled>-- Select campus role --</option>
                  {roleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-200">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="institutionId" className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1.5">
                  Institution / Role ID
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    id="institutionId"
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value.toUpperCase())}
                    placeholder={
                      selectedRole === 'student' ? 'STU001' :
                      selectedRole === 'faculty' ? 'FAC001' :
                      selectedRole === 'hostel_warden' ? 'WAR001' :
                      selectedRole === 'placement_officer' ? 'PO001' : 'STU001 / FAC001'
                    }
                    disabled={isSubmitting}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 text-sm pl-10 pr-4 py-3 rounded-xl outline-none transition-all placeholder-slate-500 uppercase tracking-wide font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1.5">
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

              <div>
                <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1.5">
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
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 text-sm pl-10 pr-10 py-3 rounded-xl outline-none transition-all placeholder-slate-500"
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
