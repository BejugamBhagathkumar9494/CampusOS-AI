import { 
  Sparkles, Calendar, BookOpen, Clock, AlertTriangle, ArrowUpRight, 
  Users, CheckSquare, Building2, ShieldCheck, 
  MapPin, FileCheck, ClipboardList, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';

export default function Dashboard() {
  const { profile } = useAuth();
  const role = profile?.role || 'student';
  const name = profile?.full_name || 'User';

  // Render role-specific dashboards
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

// ----------------------------------------------------
// 1. STUDENT DASHBOARD
// ----------------------------------------------------
interface DashboardProps {
  name: string;
}

function StudentDashboard({ name }: DashboardProps) {
  const recommendations = [
    "Your attendance in 'Automata Theory' is at 74%. Attend tomorrow's session to cross the 75% threshold.",
    "Academic risk model predicts upcoming mid-terms for 'Discrete Math' may be difficult. Generate a practice quiz.",
    "TCS Placement drive has opened. Your placement readiness is 78.5%. Apply soon.",
  ];

  const classes = [
    { name: 'Automata Theory', time: '09:00 AM - 10:00 AM', room: 'LHC-201', professor: 'Dr. Sarah Jenkins' },
    { name: 'Computer Networks', time: '10:15 AM - 11:15 AM', room: 'LHC-104', professor: 'Prof. Alan Vance' },
    { name: 'Database Management Systems', time: '11:30 AM - 12:30 PM', room: 'Lab-3', professor: 'Dr. Emily Stone' },
  ];

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 p-7 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Welcome back, <span className="gradient-text">{name}</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
              CampusOS AI has analyzed your academics, hostel status, and placement goals. Here are your personalized recommendations.
            </p>
          </div>
          <div className="flex gap-2.5">
            <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              GPA: 8.42
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Semester V
            </span>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Attendance</span>
            <Calendar className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">87.5%</p>
          <span className="text-xs font-semibold text-emerald-400">Above minimum requirement</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Placement Readiness</span>
            <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">78.5%</p>
          <span className="text-xs font-semibold text-indigo-400">Top 15% of your class</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Library Dues</span>
            <BookOpen className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">0 Books</p>
          <span className="text-xs font-semibold text-slate-400">No active fines</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Hostel Complaints</span>
            <AlertTriangle className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">1 Open</p>
          <span className="text-xs font-semibold text-yellow-400">AI Priority: Medium</span>
        </div>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        <div className="lg:col-span-2 space-y-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> AI Insights & Actions
          </h2>
          <div className="space-y-3.5">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-5 flex gap-3.5 items-start border-l-4 border-l-indigo-500">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-sm font-bold">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" /> Today's Schedule
          </h2>
          <div className="space-y-3.5">
            {classes.map((cls, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-white">{cls.name}</h3>
                  <span className="text-[11px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    {cls.room}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">{cls.professor}</p>
                <div className="flex justify-between items-center text-xs text-slate-400 pt-1.5 border-t border-slate-800/60">
                  <span className="font-mono">{cls.time}</span>
                  <span className="text-indigo-400 font-semibold flex items-center gap-1 cursor-pointer hover:underline">
                    View Notes <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
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
    <div className="space-y-7 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-slate-900 via-violet-950/20 to-slate-900 p-7 shadow-xl">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Welcome back, <span className="text-violet-400 font-extrabold">Prof. {name}</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
            Manage course materials, update attendance rosters, grade student assignments, and track syllabus status.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl -z-10"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Courses Handled</span>
            <BookOpen className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">3 Active</p>
          <span className="text-xs font-semibold text-slate-400">Computer Science Dept</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Total Students</span>
            <Users className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">120 Active</p>
          <span className="text-xs font-semibold text-emerald-400">94.2% overall attendance</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Grading Backlog</span>
            <CheckSquare className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">14 Submissions</p>
          <span className="text-xs font-semibold text-red-400">OS Lab Lab-3 Report</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Office Hours</span>
            <Clock className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">14:00 - 16:00</p>
          <span className="text-xs font-semibold text-violet-400">Monday & Thursday</span>
        </div>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        <div className="lg:col-span-2 space-y-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-violet-400" /> Coordinator Board & AI Alerts
          </h2>
          <div className="space-y-3.5">
            {alerts.map((alert, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-5 flex gap-3.5 items-start border-l-4 border-l-violet-500">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 text-sm font-bold">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">{alert}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-400" /> Teaching Schedule
          </h2>
          <div className="space-y-3.5">
            {lectures.map((lec, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm sm:text-base font-bold text-white">{lec.course}</h3>
                  <span className="text-[11px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    {lec.room}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">{lec.studentsCount} Students Registered</p>
                <div className="flex justify-between items-center text-xs text-slate-400 pt-1.5 border-t border-slate-800/60">
                  <span className="font-mono">{lec.time}</span>
                  <span className="text-violet-400 font-semibold flex items-center gap-1 cursor-pointer hover:underline">
                    Mark Attendance <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
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
    { name: 'Core Server cluster', status: 'Operational', ping: '12ms', color: 'emerald' },
    { name: 'Supabase Sync Gateway', status: 'Operational', ping: '18ms', color: 'emerald' },
    { name: 'AI Prediction Service', status: 'Operational', ping: '45ms', color: 'emerald' },
  ];

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-r from-slate-900 via-sky-950/20 to-slate-900 p-7 shadow-xl">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Welcome back, <span className="text-sky-400 font-extrabold">Administrator {name}</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
            Monitor server telemetry, manage roles, adjust course allocations, review campus audit records, and configure modules.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -z-10"></div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Registered Users</span>
            <Users className="w-4.5 h-4.5 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">1,450 Users</p>
          <span className="text-xs font-semibold text-emerald-400">+12 added this week</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Active Modules</span>
            <Building2 className="w-4.5 h-4.5 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">12 Modules</p>
          <span className="text-xs font-semibold text-sky-400">All services healthy</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Pending Complaints</span>
            <AlertTriangle className="w-4.5 h-4.5 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">8 Open</p>
          <span className="text-xs font-semibold text-red-400">3 High Priority</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">System Integrity</span>
            <ShieldCheck className="w-4.5 h-4.5 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">100% SECURE</p>
          <span className="text-xs font-semibold text-slate-400">No security incidents</span>
        </div>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        <div className="lg:col-span-2 space-y-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-sky-400" /> Admin Logs & Warnings
          </h2>
          <div className="space-y-3.5">
            {operations.map((op, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-5 flex gap-3.5 items-start border-l-4 border-l-sky-500">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 text-sm font-bold">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">{op}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" /> Module Telemetry
          </h2>
          <div className="space-y-3.5">
            {services.map((srv, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white">{srv.name}</h3>
                  <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                    {srv.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 pt-1.5 border-t border-slate-800/60">
                  <span>Latency</span>
                  <span className="font-mono text-sky-400 font-semibold">{srv.ping}</span>
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
// 4. HOSTEL WARDEN DASHBOARD
// ----------------------------------------------------
function HostelWardenDashboard({ name }: DashboardProps) {
  const issues = [
    "Room 104 in Block A reports water leakage. Plumber requested.",
    "Mess menu feedback indicates high satisfaction with Breakfast today. Waste index: Low.",
    "Hostel fee overdue alerts sent to 14 students in C-Block.",
  ];

  const tasks = [
    { title: 'Room Allocation Audit', time: '14:00 PM', desc: 'Verify vacancies in A-Block' },
    { title: 'Electrical Safety Inspection', time: '16:30 PM', desc: 'Inspect central supply grids' },
  ];

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 p-7 shadow-xl">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Welcome back, <span className="text-emerald-400 font-extrabold">Warden {name}</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
            Manage rooms, track incoming maintenance requests, verify students accommodations, and review mess food analytics.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Occupancy Rate</span>
            <MapPin className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">92% Allocated</p>
          <span className="text-xs font-semibold text-slate-400">Total capacity: 450</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Active Complaints</span>
            <AlertTriangle className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">4 Issues Open</p>
          <span className="text-xs font-semibold text-red-400">1 Urgent electrical leak</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Mess Waste Pred.</span>
            <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">Low (12.4kg)</p>
          <span className="text-xs font-semibold text-emerald-400">AI optimized portions</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Allocated Rooms</span>
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">214 Rooms</p>
          <span className="text-xs font-semibold text-slate-400">Block A, B & C</span>
        </div>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        <div className="lg:col-span-2 space-y-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-400" /> Warden Action List
          </h2>
          <div className="space-y-3.5">
            {issues.map((issue, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-5 flex gap-3.5 items-start border-l-4 border-l-emerald-500">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-sm font-bold">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">{issue}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" /> Maintenance Schedule
          </h2>
          <div className="space-y-3.5">
            {tasks.map((task, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-white">{task.title}</h3>
                  <span className="text-[11px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    {task.time}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">{task.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 5. PLACEMENT OFFICER DASHBOARD
// ----------------------------------------------------
function PlacementOfficerDashboard({ name }: DashboardProps) {
  const alerts = [
    "Google India placement drive scheduling confirmed for August 14th.",
    "18 student resumes waiting for review in placement queue. SLA status: Warning.",
    "AI model warns matching scores for 'TCS Drive' is low in Section B. Recommend refresher lab.",
  ];

  const drives = [
    { company: 'Google India', package: '34.5 LPA', date: 'Aug 14, 2026', eligible: '124 Students' },
    { company: 'Microsoft Development', package: '42.0 LPA', date: 'Aug 21, 2026', eligible: '88 Students' },
    { company: 'Deloitte Consulting', package: '12.0 LPA', date: 'Sep 02, 2026', eligible: '320 Students' },
  ];

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 p-7 shadow-xl">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Welcome back, <span className="text-indigo-400 font-extrabold">Placement Officer {name}</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
            Manage corporate recruitment drives, audit student resumes, check matching eligibility, and forecast hiring trends.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Corporate Partners</span>
            <Users className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">24 Active</p>
          <span className="text-xs font-semibold text-indigo-400">12 Tier-1 recruiters</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Average Package</span>
            <TrendingUp className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">12.5 LPA</p>
          <span className="text-xs font-semibold text-emerald-400">+1.2 LPA over last year</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Placed Percentage</span>
            <FileCheck className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">84% Placed</p>
          <span className="text-xs font-semibold text-slate-400">Batch 2026 CS & EC</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Resume Review Queue</span>
            <ClipboardList className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">18 Pending</p>
          <span className="text-xs font-semibold text-red-400">Requires SLA verification</span>
        </div>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        <div className="lg:col-span-2 space-y-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-400" /> Recruitment Board Alerts
          </h2>
          <div className="space-y-3.5">
            {alerts.map((alert, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-5 flex gap-3.5 items-start border-l-4 border-l-indigo-500">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-sm font-bold">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">{alert}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" /> Recruitment Schedule
          </h2>
          <div className="space-y-3.5">
            {drives.map((drv, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-white">{drv.company}</h3>
                  <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                    {drv.package}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">{drv.eligible} Eligible</p>
                <div className="flex justify-between items-center text-xs text-slate-400 pt-1.5 border-t border-slate-800/60">
                  <span className="font-mono">{drv.date}</span>
                  <span className="text-indigo-400 font-semibold flex items-center gap-1 cursor-pointer hover:underline">
                    View Shortlist <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
