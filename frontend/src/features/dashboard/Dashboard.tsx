import { useState, useEffect } from 'react';
import {
  Sparkles, Calendar, BookOpen, Clock, AlertTriangle,
  Users, CheckSquare, Building2, ShieldCheck,
  ClipboardList, Target, ArrowRight,
  Plus, FileText, CheckCircle2, Award, Bell, Activity, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { analyticsService } from '../../services/analyticsService';
import { courseService } from '../../services/courseService';
import { announcementService } from '../../services/announcementService';
import { assignmentService } from '../../services/assignmentService';

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

function StudentDashboard({ name, profileId }: { name?: string; profileId?: string }) {
  const [stats, setStats] = useState<any>({
    attendance_percentage: 87.5,
    cgpa: 8.4,
    issued_books: 0,
    open_complaints: 1
  });
  const [classes, setClasses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStudentData() {
      try {
        if (profileId) {
          const sData = await analyticsService.getStudentAnalytics(profileId);
          if (isMounted) setStats(sData);

          const studentCourses = await courseService.getStudentCourses(profileId);
          if (isMounted) setClasses(studentCourses || []);
        }

        const anns = await announcementService.getAnnouncements('student');
        if (isMounted) setAnnouncements(anns || []);
      } catch (err) {
        console.error('Error loading student dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (loading) console.log('Initializing student dashboard...');
    loadStudentData();
    return () => { isMounted = false; };
  }, [profileId, loading]);

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

function FacultyDashboard({ name, profileId }: { name?: string; profileId?: string }) {
  const [stats, setStats] = useState({
    courses_handled: 3,
    total_students: 20,
    pending_grading: 3,
    overall_attendance: 94.2
  });

  const [courses, setCourses] = useState([
    { id: 'c1', code: 'CS-301', title: 'Data Structures & Algorithms', semester: 3, credits: 4, enrolled: 20, attendance: 94.2, schedule: 'Mon, Wed 09:00 AM', room: 'Room 302' },
    { id: 'c2', code: 'CS-402', title: 'Artificial Intelligence & Machine Learning', semester: 5, credits: 4, enrolled: 18, attendance: 91.5, schedule: 'Tue, Thu 11:30 AM', room: 'Lab 4' },
    { id: 'c3', code: 'CS-205', title: 'Database Management Systems', semester: 4, credits: 3, enrolled: 22, attendance: 96.0, schedule: 'Mon, Thu 02:00 PM', room: 'Hall B' }
  ]);

  const [submissions, setSubmissions] = useState([
    { id: 'sub-1', assignment_title: 'Assignment 3: Binary Search Trees', student_name: 'Rahul Sharma', student_roll: '2026-CS-042', course_code: 'CS-301', submitted_at: '10 mins ago', status: 'submitted' },
    { id: 'sub-2', assignment_title: 'Lab Report 2: Neural Networks', student_name: 'Ananya Verma', student_roll: '2026-CS-018', course_code: 'CS-402', submitted_at: '1 hour ago', status: 'submitted' },
    { id: 'sub-3', assignment_title: 'Database Normalization & ER Diagrams', student_name: 'Vikram Patel', student_roll: '2026-CS-089', course_code: 'CS-205', submitted_at: '3 hours ago', status: 'submitted' }
  ]);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [officeHoursActive, setOfficeHoursActive] = useState(true);
  const [gradingModal, setGradingModal] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [noticeModal, setNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadFacultyData() {
      if (profileId) {
        try {
          const res = await analyticsService.getFacultyAnalytics(profileId);
          if (isMounted && res) setStats(prev => ({ ...prev, ...res }));

          const facultyCourses = await courseService.getFacultyCourses(profileId);
          if (isMounted && facultyCourses && facultyCourses.length > 0) {
            const mapped = facultyCourses.map((c: any, i: number) => ({
              id: c.id || `c-${i}`,
              code: c.code || `CS-${300 + i}`,
              title: c.title || 'Computer Science Module',
              semester: c.semester || 4,
              credits: c.credits || 4,
              enrolled: 20,
              attendance: 94.2,
              schedule: i === 0 ? 'Mon, Wed 09:00 AM' : i === 1 ? 'Tue, Thu 11:30 AM' : 'Mon, Thu 02:00 PM',
              room: i === 0 ? 'Room 302' : i === 1 ? 'Lab 4' : 'Hall B'
            }));
            setCourses(mapped);
          }

          const subs = await assignmentService.getSubmissions();
          if (isMounted && subs && subs.length > 0) {
            const formatted = subs.map((s: any, idx: number) => ({
              id: s.id || `sub-${idx}`,
              assignment_title: s.assignments?.title || 'Course Assignment',
              student_name: s.students?.profiles?.full_name || 'Student Submission',
              student_roll: s.students?.roll_number || '2026-CS-010',
              course_code: s.assignments?.courses?.code || 'CS-301',
              submitted_at: s.submitted_at ? new Date(s.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
              status: s.status || 'submitted'
            }));
            setSubmissions(formatted);
          }
        } catch (e) {
          console.warn('Faculty stats load warning:', e);
        }
      }

      try {
        const anns = await announcementService.getAnnouncements('faculty');
        if (isMounted && anns) setAnnouncements(anns);
      } catch (e) {
        console.warn('Faculty announcements error:', e);
      }
    }
    loadFacultyData();
    return () => { isMounted = false; };
  }, [profileId]);

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingModal || !gradeInput) return;
    setSubmissions(prev => prev.filter(s => s.id !== gradingModal.id));
    setStats(prev => ({ ...prev, pending_grading: Math.max(0, prev.pending_grading - 1) }));
    setGradingModal(null);
    setGradeInput('');
    setFeedbackInput('');
  };

  const handleNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;
    setAnnouncements(prev => [
      { id: 'ann-' + Date.now(), title: noticeTitle, content: noticeContent, target_role: 'Student', created_at: 'Just now' },
      ...prev
    ]);
    setNoticeModal(false);
    setNoticeTitle('');
    setNoticeContent('');
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans pb-12">
      {/* Top Faculty Command Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 rounded-[28px] shadow-xl relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Faculty Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-white">{name}</span> 🎓
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Manage course student rosters, record daily classroom attendance, and oversee assignment grading in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <Link
            to="/faculty/attendance"
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Open Attendance Portal
          </Link>

          <button
            onClick={() => setNoticeModal(true)}
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/15 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Post Quick Notice
          </button>
        </div>

        <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Real-Time Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Courses</span>
            <span className="text-2xl font-extrabold text-indigo-600">{courses.length || stats.courses_handled}</span>
            <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">Active Teaching Modules</span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Enrolled Students</span>
            <span className="text-2xl font-extrabold text-slate-900">{stats.total_students || 20}</span>
            <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">Roster Capacity</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Grading</span>
            <span className="text-2xl font-extrabold text-amber-600">{submissions.length}</span>
            <span className="text-[11px] text-amber-600/90 font-semibold block mt-0.5">Awaiting Review</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Class Attendance Rate</span>
            <span className="text-2xl font-extrabold text-indigo-600">{stats.overall_attendance}%</span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">Above Target (75%)</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Command Hub */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" /> Faculty Command & Control Shortcuts
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/faculty/attendance"
            className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition-all text-center space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">Mark Attendance</span>
          </Link>

          <Link
            to="/academics"
            className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-all text-center space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">Upload Quiz</span>
          </Link>

          <button
            onClick={() => setNoticeModal(true)}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-purple-50 border border-slate-100 hover:border-purple-200 transition-all text-center space-y-2 group w-full"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">Broadcast Notice</span>
          </button>

          <Link
            to="/student/ai-assistant"
            className="p-4 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 transition-all text-center space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">AI Assistant</span>
          </Link>

          <Link
            to="/faculty/attendance"
            className="p-4 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 transition-all text-center space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">Course Roster</span>
          </Link>

          <button
            onClick={() => setOfficeHoursActive(!officeHoursActive)}
            className={`p-4 rounded-2xl border transition-all text-center space-y-2 group w-full ${
              officeHoursActive
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-100 text-slate-600'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center transition-transform group-hover:scale-110 ${
              officeHoursActive ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold block">
              {officeHoursActive ? 'Office Hours: ON' : 'Office Hours: OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Assigned Courses Roster Grid */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" /> Active Assigned Courses & Timetable
          </h2>
          <span className="text-xs font-bold text-slate-400">{courses.length} Courses Handled</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {courses.map((c) => (
            <div key={c.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-indigo-200 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-extrabold font-mono">
                    {c.code}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {c.enrolled} Students
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{c.title}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {c.schedule} | <span className="font-semibold text-slate-700">{c.room}</span>
                </p>
              </div>

              {/* Attendance Progress bar */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Class Attendance</span>
                  <span className="text-indigo-600">{c.attendance}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                    style={{ width: `${c.attendance}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Link
                  to="/faculty/attendance"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs text-center transition-all shadow-xs"
                >
                  Attendance
                </Link>
                <Link
                  to="/academics"
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs text-center transition-all"
                >
                  Assignments
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Split: Pending Submissions Queue & Real-time Class Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Student Submissions & Grading Queue */}
        <div className="lg:col-span-7 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-500" /> Pending Grading Queue ({submissions.length})
            </h2>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
              Requires Action
            </span>
          </div>

          <div className="space-y-3">
            {submissions.length > 0 ? (
              submissions.map((sub) => (
                <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-200 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-700">
                        {sub.course_code}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{sub.assignment_title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Student: <span className="font-bold text-slate-800">{sub.student_name}</span> ({sub.student_roll})
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold block">Submitted: {sub.submitted_at}</span>
                  </div>

                  <button
                    onClick={() => setGradingModal(sub)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all shrink-0 self-start sm:self-center"
                  >
                    Grade & Feedback
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">All student submissions are graded!</p>
                <p className="text-[11px] text-slate-400">No pending assignments in evaluation queue.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Today's Schedule & At-Risk Attendance Alerts */}
        <div className="lg:col-span-5 space-y-6">
          {/* Today's Teaching Schedule */}
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" /> Today's Lecture Schedule
            </h2>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-indigo-900 block">CS-301 Data Structures</span>
                  <span className="text-[11px] text-indigo-700 font-medium">09:00 AM - 10:30 AM | Room 302</span>
                </div>
                <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                  Completed
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-amber-900 block">CS-402 Artificial Intelligence</span>
                  <span className="text-[11px] text-amber-700 font-medium">11:30 AM - 01:00 PM | Lab 4</span>
                </div>
                <span className="text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                  Next Up
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">CS-205 Database Systems</span>
                  <span className="text-[11px] text-slate-500 font-medium">02:00 PM - 03:30 PM | Hall B</span>
                </div>
                <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                  Upcoming
                </span>
              </div>
            </div>
          </div>

          {/* At-Risk Attendance Alert */}
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> At-Risk Attendance Alerts (&lt;75%)
              </h2>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                2 Students
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Amit K. (2026-CS-015)</span>
                  <span className="text-[11px] text-rose-700 font-medium">CS-402 Attendance: 68.0%</span>
                </div>
                <button
                  onClick={() => alert('Automated shortage warning dispatched to student & guardian.')}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition-all"
                >
                  Send Warning
                </button>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Neha S. (2026-CS-071)</span>
                  <span className="text-[11px] text-rose-700 font-medium">CS-301 Attendance: 71.5%</span>
                </div>
                <button
                  onClick={() => alert('Automated shortage warning dispatched to student & guardian.')}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition-all"
                >
                  Send Warning
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Teaching Insights & Announcements Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-[24px] p-6 shadow-md space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> AI Teaching Insights & Class Health
            </h2>
            <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
              Live Synthesis
            </span>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
              <span className="font-bold text-indigo-300 block">💡 CS-301 Quiz Performance Insight</span>
              <p className="text-slate-300">
                85% of CS-301 students scored above 80% on Quiz 2. Recommended focus area for next week: Advanced Graph Traversal Algorithms.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
              <span className="font-bold text-indigo-300 block">📊 Lab Submission Rate</span>
              <p className="text-slate-300">
                Neural Networks Lab report submission rate is 90% (18/20 students). 2 pending submissions in queue.
              </p>
            </div>
          </div>

          <Link
            to="/student/ai-assistant"
            className="inline-flex items-center gap-2 text-xs font-bold text-indigo-300 hover:text-white transition-colors pt-2"
          >
            Open AI Assistant for Lesson Planning <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="lg:col-span-6 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" /> Faculty Notices & Announcements
            </h2>
            <button
              onClick={() => setNoticeModal(true)}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              + Post Notice
            </button>
          </div>

          <div className="space-y-3">
            {announcements.length > 0 ? (
              announcements.slice(0, 3).map((ann, idx) => (
                <div key={ann.id || idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-900">{ann.title}</span>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                      {ann.target_role || 'Student'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{ann.content}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No recent department notices posted.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Grade Submission */}
      {gradingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Grade Student Submission</h3>
                <p className="text-xs text-slate-500 font-medium">{gradingModal.assignment_title}</p>
              </div>
              <button onClick={() => setGradingModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGradeSubmit} className="space-y-4 text-xs font-medium">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-800">Student: {gradingModal.student_name} ({gradingModal.student_roll})</span>
                <span className="block text-slate-500">Course: {gradingModal.course_code}</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold">Marks Scored (Out of 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="e.g. 92"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold">Faculty Feedback</label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Great explanation of tree balancing algorithms!"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md"
                >
                  Submit Marks & Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Post Quick Notice */}
      {noticeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Broadcast Class Notice</h3>
              <button onClick={() => setNoticeModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleNoticeSubmit} className="space-y-4 text-xs font-medium">
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold">Notice Headline / Title</label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. CS-301 Midterm Examination Schedule Released"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold">Announcement Content</label>
                <textarea
                  rows={4}
                  required
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="Please review chapter 4 before tomorrow's lecture..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNoticeModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminDashboard({ name }: { name?: string }) {
  return (
    <div className="space-y-7 animate-fade-in font-sans pb-12">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Students</span>
            <span className="text-2xl font-extrabold text-indigo-600">450</span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Faculty</span>
            <span className="text-2xl font-extrabold text-emerald-600">32</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Courses</span>
            <span className="text-2xl font-extrabold text-amber-600">24</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Open Concerns</span>
            <span className="text-2xl font-extrabold text-rose-600">3</span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function HostelWardenDashboard({ name }: { name?: string }) {
  return (
    <div className="space-y-7 animate-fade-in font-sans pb-12">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Rooms</span>
            <span className="text-2xl font-extrabold text-indigo-600">120</span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Occupied Beds</span>
            <span className="text-2xl font-extrabold text-emerald-600">210</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Maintenance Requests</span>
            <span className="text-2xl font-extrabold text-amber-600">4</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Gate Pass Pending</span>
            <span className="text-2xl font-extrabold text-indigo-600">2</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PlacementOfficerDashboard({ name }: { name?: string }) {
  return (
    <div className="space-y-7 animate-fade-in font-sans pb-12">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Recruiting Companies</span>
            <span className="text-2xl font-extrabold text-indigo-600">12</span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Drives</span>
            <span className="text-2xl font-extrabold text-emerald-600">4</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Applications</span>
            <span className="text-2xl font-extrabold text-slate-900">45</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Placement Rate</span>
            <span className="text-2xl font-extrabold text-emerald-600">88.5%</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
