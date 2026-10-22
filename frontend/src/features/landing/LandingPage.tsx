import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import CampusOSLogo from '../../components/common/CampusOSLogo';
import {
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  Menu,
  X,
  Play,
  Calendar,
  BookOpen,
  Briefcase,
  Bell,
  MessageSquare,
  Shield,
  GraduationCap,
  Users,
  Compass,
  Check,
  ChevronRight,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface InstitutionalPartner {
  icon: string;
  title: string;
  tag: string;
}

const institutionsList: InstitutionalPartner[] = [
  { icon: '🏛️', title: 'Universities', tag: 'Multi-disciplinary Campuses' },
  { icon: '🎓', title: 'Engineering Colleges', tag: 'Lab & Accreditation Tracking' },
  { icon: '🏫', title: 'Technical Institutes', tag: 'Vocational Skill Automation' },
  { icon: '🔬', title: 'Research Centers', tag: 'R&D Grants & Publication RAG' },
  { icon: '🌍', title: 'Global Campuses', tag: 'Multi-Location AI Sync' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, role, loginAsDemoStudent } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [activeRoleModal, setActiveRoleModal] = useState<string | null>(null);
  const [aiPromptAnswered, setAiPromptAnswered] = useState(false);

  // Search shortcuts
  const searchResults = [
    { title: 'My Academic Courses', subtitle: 'View syllabus, attendance & marks', route: '/student/academics', role: 'Student' },
    { title: 'AI Assistant Copilot', subtitle: '24/7 Academic RAG question answering', route: '/student/ai-assistant', role: 'AI' },
    { title: 'Campus Placement Drives', subtitle: 'AI placement predictor & active jobs', route: '/placement/dashboard', role: 'Placement' },
    { title: 'Exam Prep & Mock Tests', subtitle: 'Generate custom AI exams & review', route: '/student/exam-prep', role: 'Academics' },
    { title: 'Announcements & Notices', subtitle: 'University notifications & events', route: '/student/dashboard', role: 'Notices' },
  ].filter(item => 
    searchQuery.trim() === '' || 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDashboardLink = () => {
    if (!isAuthenticated || !role) return '/login';
    const routes: Record<string, string> = {
      student: '/student/dashboard',
      faculty: '/faculty/dashboard',
      admin: '/admin/dashboard',
      hostel_warden: '/hostel/dashboard',
      placement_officer: '/placement/dashboard',
      super_admin: '/super-admin/dashboard',
      librarian: '/library/dashboard',
    };
    return routes[role] || '/login';
  };

  const handleDemoClick = async () => {
    setIsDemoLoading(true);
    try {
      await loginAsDemoStudent();
      navigate('/student/dashboard');
    } catch (err) {
      console.error('Failed to login as demo student:', err);
      navigate('/login');
    } finally {
      setIsDemoLoading(false);
    }
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDemoModalOpen(false);
        setActiveRoleModal(null);
        setSearchFocused(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen lg:h-screen bg-[#FFFCF7] text-[#142B43] font-sans antialiased selection:bg-[#E85D24] selection:text-white flex flex-col justify-between overflow-x-hidden">
      
      {/* ─── SLIM HORIZONTAL HEADER ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#FFFCF7]/95 backdrop-blur-md border-b border-[#EAE5DE] transition-all duration-200 shrink-0">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 h-16 flex items-center justify-between gap-4">
          
          {/* Logo on Left */}
          <div className="shrink-0 flex items-center">
            <CampusOSLogo size="default" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-[14px] font-medium text-[#142B43]">
            <Link 
              to="/" 
              className="text-[#E85D24] font-semibold transition-colors hover:text-[#D44E18]"
            >
              Home
            </Link>
            <button 
              onClick={() => setActiveRoleModal('features')}
              className="text-[#142B43] hover:text-[#E85D24] transition-colors focus:outline-none cursor-pointer"
            >
              Features
            </button>
            <button 
              onClick={() => setActiveRoleModal('students')}
              className="text-[#142B43] hover:text-[#E85D24] transition-colors focus:outline-none cursor-pointer"
            >
              For Students
            </button>
            <button 
              onClick={() => setActiveRoleModal('faculty')}
              className="text-[#142B43] hover:text-[#E85D24] transition-colors focus:outline-none cursor-pointer"
            >
              For Faculty
            </button>
            <button 
              onClick={() => setActiveRoleModal('admins')}
              className="text-[#142B43] hover:text-[#E85D24] transition-colors focus:outline-none cursor-pointer"
            >
              For Admins
            </button>
            <button 
              onClick={() => setActiveRoleModal('about')}
              className="text-[#142B43] hover:text-[#E85D24] transition-colors focus:outline-none cursor-pointer"
            >
              About
            </button>
          </nav>

          {/* Right Header Actions: Search, Login, Get Started */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* Search Field */}
            <div className="relative">
              <div className={`relative flex items-center transition-all duration-200 ${searchFocused ? 'w-56' : 'w-40 xl:w-44'}`}>
                <Search className="w-3.5 h-3.5 text-[#63768A] absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search campus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
                  className="w-full bg-[#FAF5EE] hover:bg-[#F4ECE0] focus:bg-white text-[#142B43] text-xs pl-8 pr-3 py-2 rounded-full border border-[#EAE5DE] focus:border-[#E85D24] focus:ring-1 focus:ring-[#E85D24] outline-none transition-all placeholder-[#8898AA]"
                />
              </div>

              {/* Interactive Search Dropdown */}
              {searchFocused && (
                <div className="absolute top-11 right-0 w-80 bg-white border border-[#EAE5DE] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-[#63768A] uppercase">
                    Quick Navigation
                  </div>
                  <div className="space-y-1">
                    {searchResults.map((item, idx) => (
                      <Link
                        key={idx}
                        to={item.route}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FFF4EF] group transition-colors"
                      >
                        <div>
                          <p className="text-xs font-semibold text-[#142B43] group-hover:text-[#E85D24] transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-[#63768A]">{item.subtitle}</p>
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FAF5EE] text-[#63768A] group-hover:bg-[#E85D24]/10 group-hover:text-[#E85D24]">
                          {item.role}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <Link
                to={getDashboardLink()}
                className="text-xs sm:text-sm font-semibold tracking-wide bg-[#E85D24] hover:bg-[#D44E18] text-white px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:shadow-[#E85D24]/20 transition-all inline-flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-medium text-[#142B43] hover:text-[#E85D24] px-3 py-2 transition-colors rounded-lg"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="text-xs sm:text-sm font-semibold tracking-wide bg-[#E85D24] hover:bg-[#D44E18] text-white px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:shadow-[#E85D24]/20 transition-all inline-flex items-center gap-1.5 active:scale-95 shrink-0"
                >
                  <span>Get Started</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden items-center gap-2">
            {!isAuthenticated && (
              <Link
                to="/login"
                className="text-xs font-semibold text-[#142B43] hover:text-[#E85D24] px-3 py-1.5 border border-[#EAE5DE] rounded-full bg-white shadow-sm"
              >
                Login
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#142B43] hover:text-[#E85D24] rounded-lg focus:outline-none cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FFFCF7] border-b border-[#EAE5DE] px-6 py-6 space-y-4 shadow-xl">
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-[#63768A] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search campus features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-[#142B43] text-sm pl-9 pr-4 py-2.5 rounded-xl border border-[#EAE5DE] focus:border-[#E85D24] outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm font-medium">
              <button
                onClick={() => { setMobileMenuOpen(false); setActiveRoleModal('features'); }}
                className="text-left px-3 py-2 rounded-lg hover:bg-[#FAF5EE] text-[#142B43]"
              >
                Features
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); setActiveRoleModal('students'); }}
                className="text-left px-3 py-2 rounded-lg hover:bg-[#FAF5EE] text-[#142B43]"
              >
                For Students
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); setActiveRoleModal('faculty'); }}
                className="text-left px-3 py-2 rounded-lg hover:bg-[#FAF5EE] text-[#142B43]"
              >
                For Faculty
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); setActiveRoleModal('admins'); }}
                className="text-left px-3 py-2 rounded-lg hover:bg-[#FAF5EE] text-[#142B43]"
              >
                For Admins
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); setActiveRoleModal('about'); }}
                className="text-left px-3 py-2 rounded-lg hover:bg-[#FAF5EE] text-[#142B43]"
              >
                About CampusOS
              </button>
            </div>

            <hr className="border-[#EAE5DE]" />

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleDemoClick();
                }}
                disabled={isDemoLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#FFF4EF] hover:bg-[#FFE8DC] text-[#E85D24] font-semibold py-2.5 rounded-full border border-[#FAD8C7] transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-[#E85D24]" />
                <span>{isDemoLoading ? 'Opening...' : 'Quick Student Live Demo'}</span>
              </button>

              {isAuthenticated ? (
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 bg-[#E85D24] text-white font-semibold py-3 rounded-full shadow-md hover:bg-[#D44E18]"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center text-sm font-semibold text-[#142B43] py-2.5 border border-[#EAE5DE] rounded-full bg-white hover:bg-[#FAF5EE]"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 bg-[#E85D24] text-white text-sm font-semibold py-2.5 rounded-full shadow-sm hover:bg-[#D44E18]"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO SECTION: TWO-COLUMN LAYOUT ───────────────────────────────── */}
      <main className="flex-1 flex flex-col justify-center w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 lg:py-8 xl:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center w-full">
          
          {/* Left Column: Heading, Paragraph, Highlights, CTAs */}
          <div className="lg:col-span-6 space-y-5 xl:space-y-6 lg:pr-4 xl:pr-8">
            
            {/* Small Eyebrow Label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF4EF] border border-[#FAD8C7] text-[#E85D24] text-xs font-semibold tracking-wide shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E85D24] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E85D24]"></span>
              </span>
              <span>AI-Powered Campus Management System</span>
            </div>

            {/* Main Heading (exact wording required) */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[48px] xl:text-[54px] font-extrabold tracking-tight leading-[1.12]">
              <span className="text-[#142B43] block">Your University Life,</span>
              <span className="text-[#E85D24] block mt-1">Simplified with AI</span>
            </h1>

            {/* Supporting Paragraph (exact wording required) */}
            <p className="text-[#63768A] text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl">
              CampusOS AI is an all-in-one platform that connects students, faculty, and administrators with AI-powered tools, real-time insights, and everything you need for a seamless university experience.
            </p>

            {/* Three Compact Feature Highlights */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-2.5 text-sm sm:text-[15px]">
                <div className="mt-0.5 rounded-full p-0.5 bg-[#EAF7F0] text-[#2E9B65] shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="font-semibold text-[#142B43]">Academic Management</span>
                  <span className="text-[#63768A]"> — Courses, results, attendance.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-sm sm:text-[15px]">
                <div className="mt-0.5 rounded-full p-0.5 bg-[#EAF7F0] text-[#2E9B65] shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="font-semibold text-[#142B43]">AI Assistant</span>
                  <span className="text-[#63768A]"> — Instant help, 24/7.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-sm sm:text-[15px]">
                <div className="mt-0.5 rounded-full p-0.5 bg-[#EAF7F0] text-[#2E9B65] shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="font-semibold text-[#142B43]">Campus Community</span>
                  <span className="text-[#63768A]"> — Events, clubs, connections.</span>
                </div>
              </div>
            </div>

            {/* Two Prominent Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5 sm:gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-[#E85D24] hover:bg-[#D44E18] text-white font-semibold px-6 py-3.5 rounded-full shadow-md shadow-[#E85D24]/20 hover:shadow-lg hover:shadow-[#E85D24]/30 hover:-translate-y-0.5 active:scale-95 transition-all text-sm sm:text-base cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => setDemoModalOpen(true)}
                className="inline-flex items-center gap-2.5 bg-white hover:bg-[#FAF5EE] text-[#142B43] hover:text-[#E85D24] font-semibold px-5 py-3.5 rounded-full border border-[#EAE5DE] hover:border-[#E85D24]/30 shadow-sm transition-all text-sm sm:text-base cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#FFF4EF] flex items-center justify-center text-[#E85D24]">
                  <Play className="w-3 h-3 fill-[#E85D24] ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Composition and Floating Cards */}
          <div className="lg:col-span-6 flex items-center justify-center lg:justify-end">
            
            {/* Composition Container (proportional, contained inside hero layout boundaries) */}
            <div className="relative w-full max-w-[560px] lg:max-w-[620px] xl:max-w-[700px] rounded-2xl sm:rounded-3xl overflow-hidden border border-[#EAE5DE] shadow-xl shadow-[#142B43]/8 bg-[#FAF5EE]">
              
              {/* Proportional Campus Illustration */}
              <img
                src="/images/campus-hero.jpg"
                alt="CampusOS AI University Campus with Student using laptop"
                className="w-full h-auto object-contain object-center block select-none transform hover:scale-[1.01] transition-transform duration-500"
                loading="eager"
              />

              {/* Gentle ambient vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#FFFCF7]/30 via-transparent to-transparent pointer-events-none" />

              {/* Floating Card 1: White Translucent CampusOS AI Dashboard Card (Left) */}
              <div 
                className="absolute top-3 left-3 sm:top-4 sm:left-4 max-w-[240px] sm:max-w-[275px] w-full bg-white/90 backdrop-blur-xl rounded-2xl p-2.5 sm:p-3.5 border border-white/90 shadow-[0_12px_28px_-4px_rgba(20,43,67,0.12)] transition-transform duration-300 hover:-translate-y-0.5 z-20"
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#EAE5DE]/70">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-[#E85D24] to-[#F1733E] text-white flex items-center justify-center text-xs shadow-sm shadow-[#E85D24]/20">
                      <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-[#142B43] tracking-tight">CampusOS AI</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-[#2E9B65] bg-[#EAF7F0] px-1.5 sm:px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E9B65] animate-pulse"></span>
                    <span>Live Portal</span>
                  </div>
                </div>

                {/* Dashboard Items */}
                <div className="space-y-1 sm:space-y-1.5 text-xs">
                  {/* Item 1: My Courses */}
                  <Link 
                    to="/login"
                    className="flex items-center justify-between p-1 sm:p-1.5 rounded-lg hover:bg-[#FAF5EE] transition-colors group"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[#FFF4EF] text-[#E85D24] flex items-center justify-center">
                        <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </div>
                      <span className="font-semibold text-[#142B43] group-hover:text-[#E85D24] text-[10px] sm:text-[11px]">My Courses</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-[#63768A]">4 Active</span>
                  </Link>

                  {/* Item 2: Placement Drives */}
                  <Link 
                    to="/login"
                    className="flex items-center justify-between p-1 sm:p-1.5 rounded-lg hover:bg-[#FAF5EE] transition-colors group"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[#EAF7F0] text-[#2E9B65] flex items-center justify-center">
                        <Briefcase className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </div>
                      <span className="font-semibold text-[#142B43] group-hover:text-[#E85D24] text-[10px] sm:text-[11px]">Placement Drives</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold bg-[#FFF4EF] text-[#E85D24] px-1.5 py-0.5 rounded">12 New</span>
                  </Link>

                  {/* Item 3: Events & Notices */}
                  <Link 
                    to="/login"
                    className="flex items-center justify-between p-1 sm:p-1.5 rounded-lg hover:bg-[#FAF5EE] transition-colors group"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[#F0F5FA] text-[#142B43] flex items-center justify-center">
                        <Bell className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </div>
                      <span className="font-semibold text-[#142B43] group-hover:text-[#E85D24] text-[10px] sm:text-[11px]">Events & Notices</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-[#63768A]">Campus Fest</span>
                  </Link>

                  {/* Item 4: Ask AI Assistant */}
                  <div 
                    onClick={() => setAiPromptAnswered(!aiPromptAnswered)}
                    className="cursor-pointer p-1.5 sm:p-2 rounded-xl bg-[#FFF4EF] border border-[#FAD8C7] hover:bg-[#FFEADA] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#E85D24]" />
                        <span className="font-bold text-[#E85D24] text-[9px] sm:text-[10px]">Ask AI Assistant</span>
                      </div>
                      <span className="text-[8px] sm:text-[9px] text-[#E85D24] underline">
                        {aiPromptAnswered ? 'Reset' : 'Try prompt'}
                      </span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-[#142B43] mt-0.5 sm:mt-1 line-clamp-1">
                      {aiPromptAnswered ? '“Here is your CS301 exam revision summary!”' : '“Summarize my midterm preparation notes...”'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Card 2: Upcoming Events Card (Bottom-Right) */}
              <div 
                className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 max-w-[190px] sm:max-w-[220px] w-full bg-white/95 backdrop-blur-xl rounded-2xl p-2.5 sm:p-3 border border-white/90 shadow-[0_12px_28px_-4px_rgba(20,43,67,0.14)] transition-transform duration-300 hover:-translate-y-0.5 z-20"
              >
                <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-[#EAE5DE]/70">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[#FFF4EF] text-[#E85D24] flex items-center justify-center">
                    <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-[#142B43]">Upcoming Events</span>
                </div>
                
                <div className="space-y-1 sm:space-y-1.5">
                  <div className="p-1 sm:p-1.5 rounded-lg bg-[#FAF5EE] border border-[#EAE5DE]/40">
                    <p className="text-[10px] sm:text-[11px] font-bold text-[#142B43] leading-tight">AI Workshop @ Hall A</p>
                    <p className="text-[9px] text-[#63768A]">Today • 2:30 PM</p>
                  </div>
                  <div className="p-1 sm:p-1.5 rounded-lg bg-[#FAF5EE] border border-[#EAE5DE]/40">
                    <p className="text-[10px] sm:text-[11px] font-bold text-[#142B43] leading-tight">Campus Hackathon 2026</p>
                    <p className="text-[9px] text-[#2E9B65] font-semibold">Tomorrow • RSVP Open</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* ─── TRUST STRIP (COMPACT DIRECTLY BELOW HERO) ───────────────────────── */}
      <section className="border-t border-[#EAE5DE] bg-white py-3.5 sm:py-4 shrink-0">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <p className="text-center text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-[#63768A] mb-3">
            Trusted by Modern Higher Education Campuses & Accredited Institutions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 lg:gap-8 xl:gap-10">
            {institutionsList.map((inst, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF5EE] border border-[#EAE5DE] hover:border-[#E85D24]/30 hover:bg-[#FFF4EF] transition-colors"
              >
                <span className="text-sm sm:text-base">{inst.icon}</span>
                <span className="text-xs font-semibold text-[#142B43]">{inst.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SLIM SUB-FOOTER (NO OVERSIZED BLOCKS) ─────────────────────────── */}
      <footer className="border-t border-[#EAE5DE] bg-[#FAF5EE] py-3 sm:py-3.5 text-xs text-[#63768A] shrink-0">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 CampusOS AI. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium">
            <button onClick={() => setActiveRoleModal('about')} className="hover:text-[#E85D24]">About Platform</button>
            <button onClick={() => setActiveRoleModal('features')} className="hover:text-[#E85D24]">AI Modules</button>
            <Link to="/login" className="hover:text-[#E85D24]">Faculty Portal</Link>
            <Link to="/login" className="hover:text-[#E85D24]">Admin Access</Link>
            <div className="flex items-center gap-1.5 text-[#2E9B65]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E9B65]"></span>
              <span>All Systems Online</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── MODAL: WATCH DEMO VIDEO & INTERACTIVE TOUR ─────────────────────── */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#142B43]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAE5DE] max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-[#63768A] hover:text-[#142B43] hover:bg-[#FAF5EE]"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FFF4EF] text-[#E85D24] flex items-center justify-center">
                <Play className="w-5 h-5 fill-[#E85D24]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#142B43]">CampusOS AI in Action</h3>
                <p className="text-xs text-[#63768A]">Platform demonstration and AI features tour</p>
              </div>
            </div>

            {/* Video Player */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video mb-5 shadow-inner">
              <video
                src="/hero-bg.mp4"
                controls
                autoPlay
                className="w-full h-full object-cover"
              >
                Your browser does not support video playback.
              </video>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#EAE5DE]">
              <p className="text-xs text-[#63768A]">
                Want to test real data directly? Jump in without credentials.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDemoModalOpen(false);
                  handleDemoClick();
                }}
                disabled={isDemoLoading}
                className="inline-flex items-center gap-2 bg-[#E85D24] hover:bg-[#D44E18] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-sm"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Launch Live Student Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ROLE DESTINATIONS (STUDENTS, FACULTY, ADMINS, ABOUT) ────── */}
      {activeRoleModal && (
        <div className="fixed inset-0 z-50 bg-[#142B43]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAE5DE] max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveRoleModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-[#63768A] hover:text-[#142B43] hover:bg-[#FAF5EE]"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {activeRoleModal === 'features' && (
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FFF4EF] text-[#E85D24] flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#142B43] mb-2">Platform Features</h3>
                <p className="text-sm text-[#63768A] mb-4">
                  CampusOS AI combines academic intelligence, career prediction, and campus logistics.
                </p>
                <div className="space-y-2.5 mb-6 text-sm">
                  <div className="p-3 rounded-xl bg-[#FAF5EE]">
                    <p className="font-semibold text-[#142B43]">RAG Academic Copilot</p>
                    <p className="text-xs text-[#63768A]">Instant questions answered from course handbooks & syllabus.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF5EE]">
                    <p className="font-semibold text-[#142B43]">Placement Readiness Model</p>
                    <p className="text-xs text-[#63768A]">Predictive placement probability scores and mock interviews.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF5EE]">
                    <p className="font-semibold text-[#142B43]">Automated Attendance & Exams</p>
                    <p className="text-xs text-[#63768A]">Real-time tracking, exam schedules, and hall tickets.</p>
                  </div>
                </div>
                <Link
                  to="/register"
                  onClick={() => setActiveRoleModal(null)}
                  className="w-full flex items-center justify-center gap-2 bg-[#E85D24] text-white font-semibold py-2.5 rounded-full text-sm"
                >
                  <span>Explore with Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {activeRoleModal === 'students' && (
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FFF4EF] text-[#E85D24] flex items-center justify-center mb-3">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#142B43] mb-2">For Students</h3>
                <p className="text-sm text-[#63768A] mb-4">
                  Everything you need to excel academically, prepare for placements, and engage with campus life.
                </p>
                <div className="space-y-2 mb-6 text-xs text-[#63768A]">
                  <p>✓ Track daily lectures, timetable, and attendance thresholds.</p>
                  <p>✓ Generate custom AI quizzes and midterm prep materials.</p>
                  <p>✓ Apply to campus placement drives with AI resume insights.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setActiveRoleModal(null);
                      handleDemoClick();
                    }}
                    className="w-full bg-[#FAF5EE] text-[#142B43] font-semibold py-2.5 rounded-full text-sm hover:bg-[#F2ECE1]"
                  >
                    Try Live Student Demo
                  </button>
                  <Link
                    to="/login"
                    onClick={() => setActiveRoleModal(null)}
                    className="w-full flex items-center justify-center bg-[#E85D24] text-white font-semibold py-2.5 rounded-full text-sm"
                  >
                    Student Login
                  </Link>
                </div>
              </div>
            )}

            {activeRoleModal === 'faculty' && (
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#F0F5FA] text-[#142B43] flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#142B43] mb-2">For Faculty</h3>
                <p className="text-sm text-[#63768A] mb-4">
                  Streamlined course management, AI grading aids, and student performance analytics.
                </p>
                <div className="space-y-2 mb-6 text-xs text-[#63768A]">
                  <p>✓ Record student attendance in seconds.</p>
                  <p>✓ Upload course documents for AI-indexed student search.</p>
                  <p>✓ Publish announcements and grade assignments with feedback.</p>
                </div>
                <Link
                  to="/login"
                  onClick={() => setActiveRoleModal(null)}
                  className="w-full flex items-center justify-center gap-2 bg-[#142B43] text-white font-semibold py-2.5 rounded-full text-sm hover:bg-[#1f3c5b]"
                >
                  <span>Faculty Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {activeRoleModal === 'admins' && (
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#EAF7F0] text-[#2E9B65] flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#142B43] mb-2">For Administrators</h3>
                <p className="text-sm text-[#63768A] mb-4">
                  Comprehensive campus governance, user management, audit logs, and fee workflows.
                </p>
                <div className="space-y-2 mb-6 text-xs text-[#63768A]">
                  <p>✓ Role-based access control (RBAC) across 7 specialized campus roles.</p>
                  <p>✓ Real-time campus KPI analytics and academic audit compliance.</p>
                  <p>✓ Integrated Supabase and PostgreSQL backend infrastructure.</p>
                </div>
                <Link
                  to="/login"
                  onClick={() => setActiveRoleModal(null)}
                  className="w-full flex items-center justify-center gap-2 bg-[#142B43] text-white font-semibold py-2.5 rounded-full text-sm hover:bg-[#1f3c5b]"
                >
                  <span>Admin Portal Access</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {activeRoleModal === 'about' && (
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FFF4EF] text-[#E85D24] flex items-center justify-center mb-3">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#142B43] mb-2">About CampusOS AI</h3>
                <p className="text-sm text-[#63768A] mb-4">
                  CampusOS AI is an intelligent university operating system engineered to unite students, educators, and administrators into an integrated, AI-first ecosystem.
                </p>
                <div className="p-3 rounded-xl bg-[#FAF5EE] text-xs space-y-1 mb-6 text-[#142B43]">
                  <p><span className="font-semibold">Version:</span> 2.6.0 Production</p>
                  <p><span className="font-semibold">AI Architecture:</span> LangChain RAG + PgVector Embeddings</p>
                  <p><span className="font-semibold">Security:</span> Enterprise RBAC, Session Persistence & Encryption</p>
                </div>
                <button
                  onClick={() => setActiveRoleModal(null)}
                  className="w-full bg-[#E85D24] text-white font-semibold py-2.5 rounded-full text-sm"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
