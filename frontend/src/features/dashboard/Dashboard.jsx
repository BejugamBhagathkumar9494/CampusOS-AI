import { useState, useEffect } from 'react';
import { 
  Sparkles, Calendar, BookOpen, Clock, AlertTriangle, 
  Users, CheckSquare, Building2, ShieldCheck, 
  ClipboardList, Target, ArrowRight, ArrowUpRight as ArrowUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { analyticsService } from '../../services/analyticsService.js';
import { courseService } from '../../services/courseService.js';
import { announcementService } from '../../services/announcementService.js';

export default function Dashboard() {
  const { profile } = useAuth();
  const role = profile?.role || 'student';
  const name = profile?.full_name || 'User';

  switch (role) {
    case 'faculty':
      return <FacultyDashboard name={name} profileId={profile?.id} />;
    case 'admin':
      return <AdminDashboard name={name} />;
    case 'hostel_warden':
      return <HostelWardenDashboard name={name} />;
    case 'placement_officer':
      return <PlacementOfficerDashboard name={name} />;
    case 'student':
    default:
      return <StudentDashboard name={name} profileId={profile?.id} />;
  }
}

function StudentDashboard({ name, profileId }) {
  const [stats, setStats] = useState({
    attendance_percentage: 87.5,
    cgpa: 8.4,
    issued_books: 0,
    open_complaints: 1
  });
  const [classes, setClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStudentData() {
      try {
        if (profileId) {
          const sData = await analyticsService.getStudentAnalytics(profileId);
          if (isMounted) setStats(sData);

          const studentCourses = await courseService.getStudentCourses(profileId);
          if (isMounted) setClasses(studentCourses);
        }

        const anns = await announcementService.getAnnouncements('student');
        if (isMounted) setAnnouncements(anns);
      } catch (err) {
        console.error('Error loading student dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStudentData();
    return () => { isMounted = false; };
  }, [profileId]);

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 rounded-[28px] shadow-xl relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Student Intelligence Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-white">{name}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Your classes, real-time database attendance metrics, and AI assistant insights are ready for today.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link
            to="/student/ai-assistant"
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Ask AI Agent
          </Link>
          <Link
            to="/student/attendance"
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md transition-all border border-white/10"
          >
            View Attendance
          </Link>
        </div>

        <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
            <span className={`text-2xl font-extrabold ${stats.attendance_percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {stats.attendance_percentage}%
            </span>
            <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">Target: 75.0% Min</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Current CGPA</span>
            <span className="text-2xl font-extrabold text-indigo-600">{stats.cgpa}</span>
            <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">Academic Record</span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Issued Library Books</span>
            <span className="text-2xl font-extrabold text-slate-900">{stats.issued_books}</span>
            <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">Active Holds</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Open Concerns</span>
            <span className="text-2xl font-extrabold text-slate-900">{stats.open_complaints}</span>
            <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">Hostel & Campus</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" /> Enrolled Courses
            </h2>
            <Link to="/student/academics" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classes.length > 0 ? (
              classes.slice(0, 4).map((c, idx) => (
                <div key={c.id || idx} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-indigo-200 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold font-mono">
                      {c.code}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">{c.credits || 3} Credits</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{c.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Department: {c.department || 'Computer Science'}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 col-span-2 text-center font-medium">Loading enrolled courses...</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" /> Campus Notices
          </h2>

          <div className="space-y-3">
            {announcements.length > 0 ? (
              announcements.slice(0, 3).map((ann, idx) => (
                <div key={ann.id || idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-900 truncate">{ann.title}</span>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">{ann.target_role || 'All'}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{ann.content}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center font-medium">No campus notices posted yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FacultyDashboard({ name, profileId }) {
  const [stats, setStats] = useState({
    courses_handled: 3,
    total_students: 0,
    pending_grading: 0,
    overall_attendance: 94.2
  });

  useEffect(() => {
    let isMounted = true;
    async function loadFacultyStats() {
      if (profileId) {
        try {
          const res = await analyticsService.getFacultyAnalytics(profileId);
          if (isMounted) setStats(res);
        } catch (e) {
          console.warn('Faculty stats load error:', e);
        }
      }
    }
    loadFacultyStats();
    return () => { isMounted = false; };
  }, [profileId]);

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 rounded-[28px] shadow-xl relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Faculty Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-white">{name}</span> 🎓
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Manage course student rosters, record daily classroom attendance, and oversee assignment grading.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link
            to="/faculty/attendance"
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Open Faculty Attendance Portal
          </Link>
        </div>

        <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Courses</span>
            <span className="text-2xl font-extrabold text-indigo-600">{stats.courses_handled}</span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Enrolled Students</span>
            <span className="text-2xl font-extrabold text-slate-900">{stats.total_students}</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Grading</span>
            <span className="text-2xl font-extrabold text-amber-600">{stats.pending_grading}</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Class Attendance Rate</span>
            <span className="text-2xl font-extrabold text-indigo-600">{stats.overall_attendance}%</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ name }) {
  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white p-7 rounded-[28px] shadow-xl relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Admin Control Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-white">{name}</span> 🛡️
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Manage university users, monitor campus complaints, and broadcast university notices.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link
            to="/admin/users"
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Manage User Accounts
          </Link>
        </div>
      </div>
    </div>
  );
}

function HostelWardenDashboard({ name }) {
  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white p-7 rounded-[28px] shadow-xl relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Hostel Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Hostel Warden Portal, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-white">{name}</span> 🏠
          </h1>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link
            to="/hostel/hostel"
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" /> Manage Hostel Rooms
          </Link>
        </div>
      </div>
    </div>
  );
}

function PlacementOfficerDashboard({ name }) {
  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white p-7 rounded-[28px] shadow-xl relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <Target className="w-3.5 h-3.5 text-indigo-400" /> Corporate Placement Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Placement Officer Portal, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-white">{name}</span> 💼
          </h1>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link
            to="/placement/placements"
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
          >
            <ClipboardList className="w-4 h-4" /> View Corporate Drives
          </Link>
        </div>
      </div>
    </div>
  );
}
