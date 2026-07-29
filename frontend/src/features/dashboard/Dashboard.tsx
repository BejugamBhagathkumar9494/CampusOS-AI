import { 
  Sparkles, Calendar, BookOpen, Clock, AlertTriangle, 
  Users, CheckSquare, Building2, ShieldCheck, 
  ClipboardList, Target, ArrowRight, ArrowUpRight as ArrowUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';

export default function Dashboard() {
  const { profile } = useAuth();
  const role = profile?.role || 'student';
  const name = profile?.full_name || 'User';

  switch (role) {
    case 'faculty':
      return <FacultyDashboard name={name} />;
    case 'admin':
      return <AdminDashboard name={name} />;
    case 'hostel_warden':
      return <HostelWardenDashboard name={name} />;
    case 'placement_officer':
      return <PlacementOfficerDashboard name={name} />;
    case 'student':
    default:
      return <StudentDashboard name={name} />;
  }
}

interface DashboardProps {
  name: string;
}

// ----------------------------------------------------
// 1. STUDENT DASHBOARD
// ----------------------------------------------------
function StudentDashboard({ name }: DashboardProps) {
  const recommendations = [
    {
      id: 1,
      text: "Your attendance in 'Automata Theory' is at 74%. Attend tomorrow's session to cross the 75% threshold.",
      color: "purple",
      iconType: "clipboard"
    },
    {
      id: 2,
      text: "Academic risk model predicts upcoming mid-terms for 'Discrete Math' may be difficult. Generate a practice quiz.",
      color: "blue",
      iconType: "cap"
    },
    {
      id: 3,
      text: "TCS Placement drive has opened. Run your dataset-backed readiness prediction before applying.",
      color: "emerald",
      iconType: "briefcase"
    },
  ];

  const classes = [
    { name: 'Automata Theory', time: '09:00 AM', room: 'Room 301 • Main Block', professor: 'Dr. Sarah Jenkins', color: 'purple' },
    { name: 'Computer Networks', time: '10:15 AM', room: 'Room 204 • Main Block', professor: 'Prof. Alan Vance', color: 'blue' },
    { name: 'Data Structures Lab', time: '02:30 PM', room: 'Lab 1 • CS Block', professor: 'Dr. James Wilson', color: 'emerald' },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Hero Banner with Campus Illustration */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#EEF2FF] via-[#F3E8FF] to-[#E0E7FF] border border-indigo-100/80 p-7 sm:p-8 shadow-sm shadow-indigo-100/50">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
          <div className="lg:col-span-7 space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600">{name}!</span> 👋
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-lg leading-relaxed font-medium">
              CampusOS AI has analyzed your academics, hostel status, and placement goals. Here are your personalized recommendations.
            </p>
          </div>

          <div className="lg:col-span-5 relative flex justify-center lg:justify-end items-center">
            {/* Top floating glass badges */}
            <div className="absolute -top-3 left-4 lg:left-0 z-20 flex gap-2">
              <div className="px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-xs font-extrabold text-slate-700 border border-white/80 shadow-xs">
                GPA: <span className="text-emerald-600">8.42</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-xs font-extrabold text-slate-700 border border-white/80 shadow-xs">
                Streak: <span className="text-indigo-600">12 days</span>
              </div>
            </div>

            {/* University Campus Vector SVG Illustration */}
            <div className="w-full max-w-[340px] h-[160px] relative flex items-center justify-center">
              <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
                {/* Soft sky background */}
                <ellipse cx="200" cy="180" rx="190" ry="40" fill="#E0E7FF" fillOpacity="0.6" />
                
                {/* Clouds */}
                <path d="M50 40 Q65 30 80 40 Q95 30 110 40 Q115 55 50 55 Z" fill="#FFFFFF" fillOpacity="0.8" />
                <path d="M280 35 Q295 25 310 35 Q325 25 340 35 Q345 50 280 50 Z" fill="#FFFFFF" fillOpacity="0.8" />

                {/* Flying Birds */}
                <path d="M120 25 Q125 20 130 25 Q135 20 140 25" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <path d="M145 30 Q150 26 155 30 Q160 26 165 30" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" fill="none" />

                {/* Side Wings Building Left */}
                <rect x="110" y="80" width="60" height="70" rx="4" fill="#FFFFFF" />
                <rect x="110" y="80" width="60" height="10" fill="#818CF8" fillOpacity="0.3" />
                <rect x="120" y="95" width="12" height="15" rx="2" fill="#93C5FD" fillOpacity="0.6" />
                <rect x="145" y="95" width="12" height="15" rx="2" fill="#93C5FD" fillOpacity="0.6" />
                <rect x="120" y="120" width="12" height="15" rx="2" fill="#93C5FD" fillOpacity="0.6" />
                <rect x="145" y="120" width="12" height="15" rx="2" fill="#93C5FD" fillOpacity="0.6" />

                {/* Side Wings Building Right */}
                <rect x="230" y="80" width="60" height="70" rx="4" fill="#FFFFFF" />
                <rect x="230" y="80" width="60" height="10" fill="#818CF8" fillOpacity="0.3" />
                <rect x="240" y="95" width="12" height="15" rx="2" fill="#93C5FD" fillOpacity="0.6" />
                <rect x="265" y="95" width="12" height="15" rx="2" fill="#93C5FD" fillOpacity="0.6" />
                <rect x="240" y="120" width="12" height="15" rx="2" fill="#93C5FD" fillOpacity="0.6" />
                <rect x="265" y="120" width="12" height="15" rx="2" fill="#93C5FD" fillOpacity="0.6" />

                {/* Main Central Building */}
                <rect x="160" y="60" width="80" height="90" rx="6" fill="#FFFFFF" stroke="#E0E7FF" strokeWidth="2" />
                <polygon points="150,60 200,20 250,60" fill="#4F46E5" />
                <polygon points="165,60 200,28 235,60" fill="#6366F1" />

                {/* Clock Tower */}
                <rect x="185" y="10" width="30" height="40" rx="3" fill="#4338CA" />
                <polygon points="180,10 200,-5 220,10" fill="#3730A3" />
                <circle cx="200" cy="25" r="7" fill="#FFFFFF" />
                <line x1="200" y1="25" x2="200" y2="21" stroke="#4338CA" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="200" y1="25" x2="203" y2="25" stroke="#4338CA" strokeWidth="1.5" strokeLinecap="round" />

                {/* Columns & Portico */}
                <rect x="175" y="105" width="50" height="45" fill="#EEF2FF" />
                <rect x="180" y="110" width="6" height="40" fill="#6366F1" fillOpacity="0.4" />
                <rect x="192" y="110" width="6" height="40" fill="#6366F1" fillOpacity="0.4" />
                <rect x="204" y="110" width="6" height="40" fill="#6366F1" fillOpacity="0.4" />
                <rect x="216" y="110" width="6" height="40" fill="#6366F1" fillOpacity="0.4" />

                {/* Grand Arched Entrance */}
                <path d="M190 150 V130 A10 10 0 0 1 210 130 V150 Z" fill="#312E81" />

                {/* Lush Trees */}
                <circle cx="95" cy="135" r="18" fill="#10B981" />
                <circle cx="85" cy="145" r="14" fill="#059669" />
                <rect x="92" y="150" width="6" height="20" fill="#78350F" />

                <circle cx="305" cy="135" r="18" fill="#10B981" />
                <circle cx="315" cy="145" r="14" fill="#059669" />
                <rect x="302" y="150" width="6" height="20" fill="#78350F" />

                {/* Floating AI Glow Nodes */}
                <circle cx="70" cy="70" r="6" fill="#818CF8" fillOpacity="0.5" />
                <circle cx="330" cy="80" r="8" fill="#C084FC" fillOpacity="0.5" />
                <circle cx="140" cy="15" r="4" fill="#34D399" fillOpacity="0.6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Ambient background glow circles */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Attendance Card */}
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">87.5%</div>
            <p className="text-xs font-semibold text-emerald-600">Above minimum requirement</p>
          </div>

          <div className="pt-4 flex items-end justify-between">
            <svg className="w-24 h-8" viewBox="0 0 100 30" fill="none">
              <path d="M0 25 C20 20, 40 28, 60 10 C80 2, 90 12, 100 5" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <Link to="/student/attendance" className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors">
              <ArrowUp className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Placement Readiness Card */}
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Placement Readiness</span>
            </div>
            <div className="text-2xl font-extrabold text-indigo-600 tracking-tight mb-1">AI Evaluated</div>
            <Link to="/placement/placements" className="text-xs font-bold text-purple-600 hover:underline">
              Calculate in Placements
            </Link>
          </div>

          <div className="pt-4 flex items-end justify-between">
            <svg className="w-24 h-8" viewBox="0 0 100 30" fill="none">
              <path d="M0 20 C25 28, 45 5, 65 18 C85 25, 95 10, 100 8" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <Link to="/placement/placements" className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center hover:bg-purple-100 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Library Dues Card */}
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Library Dues</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">0 Books</div>
            <p className="text-xs font-medium text-slate-500">No active fines</p>
          </div>

          <div className="pt-4 flex items-end justify-end">
            <Link to="/student/library" className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Hostel Complaints Card */}
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hostel Complaints</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">1 Open</div>
            <p className="text-xs font-semibold text-rose-500">AI Priority: Medium</p>
          </div>

          <div className="pt-4 flex items-end justify-end">
            <Link to="/hostel/hostel" className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main split: AI Insights & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Insights & Actions */}
        <div className="lg:col-span-2 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" /> AI Insights & Actions
            </h2>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 flex items-center justify-between gap-4 transition-all hover:bg-slate-50">
                <div className="flex items-center gap-3.5">
                  <span className={`w-8 h-8 rounded-2xl flex items-center justify-center text-sm font-extrabold shrink-0 ${
                    rec.color === 'purple' ? 'bg-purple-50 text-purple-600' : rec.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {rec.id}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">{rec.text}</p>
                </div>

                {/* Vector SVG Illustration Icons */}
                <div className="shrink-0 hidden sm:block">
                  {rec.iconType === 'clipboard' && (
                    <svg className="w-12 h-12 drop-shadow-xs" viewBox="0 0 60 60" fill="none">
                      <rect x="10" y="10" width="36" height="44" rx="6" fill="#C7D2FE" />
                      <rect x="14" y="14" width="28" height="36" rx="4" fill="#FFFFFF" />
                      <rect x="22" y="6" width="12" height="8" rx="2" fill="#6366F1" />
                      <line x1="20" y1="24" x2="34" y2="24" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="20" y1="30" x2="30" y2="30" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="36" cy="38" r="6" fill="#10B981" />
                      <path d="M33 38 L35 40 L39 36" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {rec.iconType === 'cap' && (
                    <svg className="w-12 h-12 drop-shadow-xs" viewBox="0 0 60 60" fill="none">
                      <rect x="14" y="30" width="32" height="6" rx="2" fill="#3B82F6" />
                      <rect x="18" y="38" width="24" height="6" rx="2" fill="#F59E0B" />
                      <polygon points="30,12 8,22 30,32 52,22" fill="#1E40AF" />
                      <rect x="20" y="24" width="20" height="8" fill="#1D4ED8" />
                      <circle cx="44" cy="24" r="2.5" fill="#F59E0B" />
                      <line x1="44" y1="24" x2="44" y2="34" stroke="#F59E0B" strokeWidth="1.5" />
                    </svg>
                  )}
                  {rec.iconType === 'briefcase' && (
                    <svg className="w-12 h-12 drop-shadow-xs" viewBox="0 0 60 60" fill="none">
                      <rect x="10" y="20" width="40" height="28" rx="6" fill="#10B981" />
                      <path d="M22 20 V14 A4 4 0 0 1 26 10 H34 A4 4 0 0 1 38 14 V20" fill="none" stroke="#059669" strokeWidth="3" />
                      <rect x="10" y="28" width="40" height="4" fill="#059669" />
                      <rect x="26" y="27" width="8" height="6" rx="1.5" fill="#F59E0B" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <Link to="/student/ai-insights" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
              View All Insights <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Today's Schedule */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50 space-y-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" /> Today's Schedule
              </h2>
              <Link to="/student/academics" className="text-xs font-bold text-indigo-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {classes.map((cls, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50/60 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-extrabold px-2.5 py-1.5 rounded-xl shrink-0 ${
                      cls.color === 'purple' ? 'bg-purple-50 text-purple-600' : cls.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {cls.time}
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">{cls.name}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{cls.professor}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{cls.room}</p>
                    </div>
                  </div>

                  <div className={`p-2 rounded-xl shrink-0 ${
                    cls.color === 'purple' ? 'bg-purple-50 text-purple-600' : cls.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decorative Campus Hills Landscape footer */}
          <div className="pt-6 relative -mx-6 -mb-6 h-16 overflow-hidden pointer-events-none">
            <svg viewBox="0 0 300 60" fill="none" className="w-full h-full">
              <path d="M0 40 Q75 20 150 35 Q225 50 300 30 V60 H0 Z" fill="#E0E7FF" fillOpacity="0.5" />
              <path d="M0 48 Q90 30 180 42 Q250 55 300 38 V60 H0 Z" fill="#C7D2FE" fillOpacity="0.4" />
              <circle cx="240" cy="32" r="5" fill="#818CF8" fillOpacity="0.6" />
              <circle cx="260" cy="38" r="7" fill="#6366F1" fillOpacity="0.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. FACULTY DASHBOARD
// ----------------------------------------------------
function FacultyDashboard({ name }: DashboardProps) {
  const alerts = [
    "12 assignments for 'Computer Networks (CS302)' remain ungraded. Due date has passed.",
    "Student attendance rate in 'Discrete Math (CS204)' has dropped by 4.2% this week.",
    "Academic coordinator has requested syllabus revision for next semester AI electives.",
  ];

  const lectures = [
    { course: 'Computer Networks', time: '10:00 AM - 11:00 AM', room: 'LHC-104', studentsCount: 42 },
    { course: 'Advanced Cryptography', time: '01:00 PM - 02:00 PM', room: 'Lab-4', studentsCount: 28 },
    { course: 'Syllabus Board Meeting', time: '03:30 PM - 04:30 PM', room: 'Conf Room B', studentsCount: 10 },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#EEF2FF] via-[#F3E8FF] to-[#E0E7FF] border border-indigo-100/80 p-7 sm:p-8 shadow-sm shadow-indigo-100/50">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Prof. {name}</span> 👋
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl font-medium leading-relaxed">
          Manage course materials, update attendance rosters, grade student assignments, and track syllabus status.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Courses Handled</span>
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mb-1">3 Active</p>
          <span className="text-xs font-medium text-slate-500">Computer Science Dept</span>
        </div>

        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mb-1">120 Active</p>
          <span className="text-xs font-semibold text-emerald-600">94.2% overall attendance</span>
        </div>

        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grading Backlog</span>
            <CheckSquare className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mb-1">14 Submissions</p>
          <span className="text-xs font-semibold text-rose-500">OS Lab Report</span>
        </div>

        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Office Hours</span>
            <Clock className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mb-1">14:00 - 16:00</p>
          <span className="text-xs font-semibold text-indigo-600">Mon & Thu</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" /> Coordinator Board & AI Alerts
          </h2>
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 flex gap-3.5 items-start">
                <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 font-extrabold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">{alert}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" /> Teaching Schedule
          </h2>
          <div className="space-y-3">
            {lectures.map((lec, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-slate-900">{lec.course}</h3>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">
                    {lec.room}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">{lec.studentsCount} Students Registered</p>
                <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                  <span className="font-mono text-indigo-600 font-bold">{lec.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. ADMIN DASHBOARD
// ----------------------------------------------------
function AdminDashboard({ name }: DashboardProps) {
  const operations = [
    "Database backup completed. Next incremental sync scheduled at 23:00.",
    "Unresolved high-priority complaint logged in Hostel D (electrical surge). Warden notified.",
    "Bus Route 10A requires routine mechanical validation. Certification is due in 3 days.",
  ];

  const services = [
    { name: 'Core Server cluster', status: 'Operational', ping: '12ms' },
    { name: 'Supabase Sync Gateway', status: 'Operational', ping: '18ms' },
    { name: 'AI Prediction Service', status: 'Operational', ping: '45ms' },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#EEF2FF] via-[#F3E8FF] to-[#E0E7FF] border border-indigo-100/80 p-7 sm:p-8 shadow-sm shadow-indigo-100/50">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Administrator {name}</span> 👋
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl font-medium leading-relaxed">
          Monitor campus operations, active AI microservices, security protocols, and infrastructure analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Students</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">1,420</p>
        </div>
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Faculty Count</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">84</p>
        </div>
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Service Health</span>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">99.9%</p>
        </div>
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Alerts</span>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2">3 Pending</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> Infrastructure Logs & Operations
          </h2>
          <div className="space-y-3">
            {operations.map((op, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 text-xs sm:text-sm text-slate-700 font-medium">
                {op}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Microservice Status
          </h2>
          <div className="space-y-3">
            {services.map((srv, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50/60 border border-slate-100 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">{srv.name}</span>
                <span className="font-bold text-emerald-600">{srv.status} ({srv.ping})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. HOSTEL WARDEN DASHBOARD
// ----------------------------------------------------
function HostelWardenDashboard({ name }: DashboardProps) {
  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#EEF2FF] via-[#F3E8FF] to-[#E0E7FF] border border-indigo-100/80 p-7 sm:p-8 shadow-sm shadow-indigo-100/50">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Warden {name}</span> 👋
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl font-medium leading-relaxed">
          Manage hostel room allocations, inspect AI-prioritized maintenance complaints, and enforce curfew protocols.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Occupancy</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">88.4%</p>
        </div>
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Tickets</span>
          <p className="text-3xl font-extrabold text-rose-500 mt-2">4 Pending</p>
        </div>
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Late Curfew Passes</span>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2">6 Issued</p>
        </div>
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mess Food Waste</span>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">-14% vs avg</p>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 5. PLACEMENT OFFICER DASHBOARD
// ----------------------------------------------------
function PlacementOfficerDashboard({ name }: DashboardProps) {
  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#EEF2FF] via-[#F3E8FF] to-[#E0E7FF] border border-indigo-100/80 p-7 sm:p-8 shadow-sm shadow-indigo-100/50">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Placement Officer {name}</span> 👋
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl font-medium leading-relaxed">
          Oversee company recruiter drives, monitor 100,000+ student dataset placement predictions, and analyze salary LPA ranges.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campus Placement Rate</span>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">54.5%</p>
        </div>
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Recruiters</span>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2">18 Drives</p>
        </div>
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Package (LPA)</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">13.3 LPA</p>
        </div>
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm shadow-slate-200/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Package (LPA)</span>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2">24.5 LPA</p>
        </div>
      </div>
    </div>
  );
}
