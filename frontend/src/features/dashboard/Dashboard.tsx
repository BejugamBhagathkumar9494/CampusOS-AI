import { useState, useEffect } from 'react';
import {
  Sparkles, Calendar, BookOpen, Clock, AlertTriangle,
  Users, CheckSquare, Building2, ShieldCheck,
  ClipboardList, Target, ArrowRight,
  Plus, FileText, CheckCircle2, Award, Bell, Activity, X, GraduationCap, GitFork, Mic
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
    case 'super_admin':
      return <SuperAdminDashboard name={name} />;
    case 'hostel_warden':
      return <HostelWardenDashboard name={name} />;
    case 'placement_officer':
      return <PlacementOfficerDashboard name={name} />;
    case 'librarian':
      return <LibrarianDashboard name={name} />;
    case 'student':
      return <StudentDashboard name={name} profileId={profile?.id} />;
    default:
      return <AdminDashboard name={name} />;
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
  }, [profileId]);

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1C211F] text-white p-7 rounded-2xl shadow-md border border-[#EAE3D8]/15">
        <div className="space-y-1.5 max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, <span className="text-[#C85A32]">{name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9893] font-normal leading-relaxed">
            Your schedule, real-time academic progress, and intelligence workspaces for today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/student/mock-interview"
            className="px-4 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-2 border border-[#C85A32]/40"
          >
            <Mic className="w-4 h-4" /> AI Mock Interview
          </Link>
          <Link
            to="/student/exam-prep"
            className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F4EFEA] text-[#1C211F] font-semibold text-xs shadow-sm transition-all flex items-center gap-2 border border-[#EAE3D8]"
          >
            <GraduationCap className="w-4 h-4 text-[#C85A32]" /> Exam Prep
          </Link>
          <Link
            to="/student/repodna"
            className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F4EFEA] text-[#1C211F] font-semibold text-xs shadow-sm transition-all flex items-center gap-2 border border-[#EAE3D8]"
          >
            <GitFork className="w-4 h-4 text-[#C85A32]" /> RepoDNA
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[#C85A32]/30 transition-all">
          <div>
            <span className="text-[11px] font-semibold text-[#8E9893] uppercase tracking-wider block">Attendance Rate</span>
            <span className={`text-2xl font-bold ${stats.attendance_percentage >= 75 ? 'text-[#5E8C71]' : 'text-[#C85A32]'}`}>
              {stats.attendance_percentage}%
            </span>
            <span className="text-[11px] text-[#5E6763] font-medium block mt-0.5">Target: 75.0% Min</span>
          </div>
          <div className="p-3 rounded-xl bg-[#F0F6F2] text-[#5E8C71] border border-[#5E8C71]/20">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[#C85A32]/30 transition-all">
          <div>
            <span className="text-[11px] font-semibold text-[#8E9893] uppercase tracking-wider block">Current CGPA</span>
            <span className="text-2xl font-bold text-[#C85A32]">{stats.cgpa}</span>
            <span className="text-[11px] text-[#5E6763] font-medium block mt-0.5">Academic Record</span>
          </div>
          <div className="p-3 rounded-xl bg-[#FDF2ED] text-[#C85A32] border border-[#C85A32]/20">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[#C85A32]/30 transition-all">
          <div>
            <span className="text-[11px] font-semibold text-[#8E9893] uppercase tracking-wider block">Issued Books</span>
            <span className="text-2xl font-bold text-[#1C211F]">{stats.issued_books}</span>
            <span className="text-[11px] text-[#5E6763] font-medium block mt-0.5">Active Holds</span>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF7F2] text-[#C85A32] border border-[#EAE3D8]">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[#C85A32]/30 transition-all">
          <div>
            <span className="text-[11px] font-semibold text-[#8E9893] uppercase tracking-wider block">Open Concerns</span>
            <span className="text-2xl font-bold text-[#D9822B]">{stats.open_complaints}</span>
            <span className="text-[11px] text-[#5E6763] font-medium block mt-0.5">Campus Support</span>
          </div>
          <div className="p-3 rounded-xl bg-[#FEF7ED] text-[#D9822B] border border-[#D9822B]/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Featured Intelligence Workspaces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* RepoDNA Card */}
        <div className="bg-[#FFFFFF] p-6 rounded-2xl shadow-sm border border-[#EAE3D8] hover:border-[#C85A32]/40 transition-all flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#FDF2ED] text-[#C85A32] flex items-center justify-center border border-[#C85A32]/20 shrink-0">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C211F]">
                RepoDNA Codebase Intelligence
              </h3>
              <p className="text-xs text-[#5E6763] font-normal mt-1 leading-relaxed">
                Inspect GitHub repositories to understand architecture, internal data flows, REST endpoints, database schemas, and generate technical interview Q&A.
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Link
              to="/student/repodna"
              className="px-4 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              Open RepoDNA <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* AI Exam Prep Card */}
        <div className="bg-[#FFFFFF] p-6 rounded-2xl shadow-sm border border-[#EAE3D8] hover:border-[#C85A32]/40 transition-all flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#FDF2ED] text-[#C85A32] flex items-center justify-center border border-[#C85A32]/20 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C211F]">
                AI Exam Preparation Studio
              </h3>
              <p className="text-xs text-[#5E6763] font-normal mt-1 leading-relaxed">
                Upload course lecture notes and unit PDFs to generate chapter summaries, 2-mark, 4-mark, and 10-mark model answers with rapid revision sheets.
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Link
              to="/student/exam-prep"
              className="px-4 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              Open Exam Studio <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-[24px] p-6 border border-[#EAE3D8] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#1C211F] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#C85A32]" /> Enrolled Courses
            </h2>
            <Link to="/student/academics" className="text-xs font-bold text-[#C85A32] hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classes.length > 0 ? (
              classes.slice(0, 4).map((c, idx) => (
                <div key={c.id || idx} className="p-4 rounded-2xl bg-[#FDFBF8] border border-[#EAE3D8] hover:border-[rgba(200,90,50,0.3)] transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-[#FDF2ED] text-[#C85A32] text-xs font-bold font-mono border border-[rgba(200,90,50,0.2)]">
                      {c.code}
                    </span>
                    <span className="text-[11px] text-[#8E9893] font-semibold">{c.credits || 3} Credits</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#1C211F] line-clamp-1">{c.title}</h3>
                  <p className="text-xs text-[#5E6763] mt-1 font-medium">Department: {c.department || 'Computer Science'}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#8E9893] py-4 col-span-2 text-center font-medium">Loading enrolled courses...</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-[24px] p-6 border border-[#EAE3D8] shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-[#1C211F] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#C85A32]" /> Campus Notices
          </h2>

          <div className="space-y-3">
            {announcements.length > 0 ? (
              announcements.slice(0, 3).map((ann, idx) => (
                <div key={ann.id || idx} className="p-3.5 rounded-xl bg-[#FDFBF8] border border-[#EAE3D8] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#1C211F] truncate">{ann.title}</span>
                    <span className="text-[10px] text-[#D9822B] font-bold bg-[#FEF7ED] px-2 py-0.5 rounded-full border border-[#D9822B]/20">{ann.target_role || 'All'}</span>
                  </div>
                  <p className="text-xs text-[#5E6763] line-clamp-2 leading-relaxed">{ann.content}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#8E9893] py-4 text-center font-medium">No campus notices posted yet.</p>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1C211F] text-white p-7 rounded-[28px] shadow-xl border border-[#EAE3D8]/15 relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF2ED]/10 text-[#FDF2ED] text-xs font-bold border border-[#C85A32]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#C85A32]" /> Faculty Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, <span className="text-[#C85A32]">{name}</span> 🎓
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9893] font-medium leading-relaxed">
            Manage course student rosters, record daily classroom attendance, and oversee assignment grading in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <Link
            to="/faculty/attendance"
            className="px-5 py-3 rounded-2xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-extrabold text-xs shadow-lg shadow-[#C85A32]/25 transition-all flex items-center gap-2 border border-[#C85A32]/40"
          >
            <Users className="w-4 h-4" /> Open Attendance Portal
          </Link>

          <button
            onClick={() => setNoticeModal(true)}
            className="px-4 py-3 rounded-2xl bg-[#F4EFEA] hover:bg-[#EFE8DF] text-[#1C211F] font-bold text-xs shadow-sm border border-[#EAE3D8] transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-[#C85A32]" /> Post Quick Notice
          </button>
        </div>

        <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#C85A32]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Real-Time Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Assigned Courses</span>
            <span className="text-2xl font-extrabold text-[#C85A32]">{courses.length || stats.courses_handled}</span>
            <span className="text-[11px] text-[#5E6763] font-semibold block mt-0.5">Active Teaching Modules</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FDF2ED] text-[#C85A32] border border-[#C85A32]/20">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Enrolled Students</span>
            <span className="text-2xl font-extrabold text-[#1C211F]">{stats.total_students || 20}</span>
            <span className="text-[11px] text-[#5E6763] font-semibold block mt-0.5">Roster Capacity</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FDF2ED] text-[#C85A32] border border-[#C85A32]/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Pending Grading</span>
            <span className="text-2xl font-extrabold text-[#D9822B]">{submissions.length}</span>
            <span className="text-[11px] text-[#D9822B] font-semibold block mt-0.5">Awaiting Review</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FEF7ED] text-[#D9822B] border border-[#D9822B]/20">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Class Attendance Rate</span>
            <span className="text-2xl font-extrabold text-[#5E8C71]">{stats.overall_attendance}%</span>
            <span className="text-[11px] text-[#5E8C71] font-semibold block mt-0.5">Above Target (75%)</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#F0F6F2] text-[#5E8C71] border border-[#5E8C71]/20">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Command Hub */}
      <div className="bg-white rounded-[24px] p-6 border border-[#EAE3D8] shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#1C211F] flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#C85A32]" /> Faculty Command & Control Shortcuts
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/faculty/attendance"
            className="p-4 rounded-2xl bg-[#FAF7F2] hover:bg-[#FDF2ED] border border-[#EAE3D8] hover:border-[#C85A32]/30 transition-all text-center space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FDF2ED] text-[#C85A32] mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1C211F] block">Mark Attendance</span>
          </Link>

          <Link
            to="/academics"
            className="p-4 rounded-2xl bg-[#FAF7F2] hover:bg-[#F0F6F2] border border-[#EAE3D8] hover:border-[#5E8C71]/30 transition-all text-center space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F0F6F2] text-[#5E8C71] mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1C211F] block">Upload Quiz</span>
          </Link>

          <button
            onClick={() => setNoticeModal(true)}
            className="p-4 rounded-2xl bg-[#FAF7F2] hover:bg-[#FEF7ED] border border-[#EAE3D8] hover:border-[#D9822B]/30 transition-all text-center space-y-2 group w-full"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FEF7ED] text-[#D9822B] mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1C211F] block">Broadcast Notice</span>
          </button>

          <Link
            to="/student/ai-assistant"
            className="p-4 rounded-2xl bg-[#FAF7F2] hover:bg-[#FDF2ED] border border-[#EAE3D8] hover:border-[#C85A32]/30 transition-all text-center space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FDF2ED] text-[#C85A32] mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1C211F] block">AI Assistant</span>
          </Link>

          <Link
            to="/faculty/attendance"
            className="p-4 rounded-2xl bg-[#FAF7F2] hover:bg-[#FDF2ED] border border-[#EAE3D8] hover:border-[#C85A32]/30 transition-all text-center space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FDF2ED] text-[#C85A32] mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#1C211F] block">Course Roster</span>
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
          <h2 className="text-lg font-bold text-[#1C211F] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C85A32]" /> Active Assigned Courses & Timetable
          </h2>
          <span className="text-xs font-bold text-[#8E9893]">{courses.length} Courses Handled</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {courses.map((c) => (
            <div key={c.id} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] hover:border-[#C85A32]/30 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 rounded-lg bg-[#FDF2ED] text-[#C85A32] text-xs font-extrabold font-mono">
                    {c.code}
                  </span>
                  <span className="text-[11px] font-bold text-[#5E8C71] bg-[#F0F6F2] px-2 py-0.5 rounded-full">
                    {c.enrolled} Students
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#1C211F] leading-snug">{c.title}</h3>
                <p className="text-xs text-[#5E6763] font-medium">
                  {c.schedule} | <span className="font-semibold text-[#1C211F]">{c.room}</span>
                </p>
              </div>

              {/* Attendance Progress bar */}
              <div className="space-y-1.5 pt-2 border-t border-[#EAE3D8]">
                <div className="flex justify-between text-[11px] font-bold text-[#5E6763]">
                  <span>Class Attendance</span>
                  <span className="text-[#C85A32]">{c.attendance}%</span>
                </div>
                <div className="w-full h-2 bg-[#F4EFEA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C85A32] rounded-full"
                    style={{ width: `${c.attendance}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Link
                  to="/faculty/attendance"
                  className="flex-1 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-bold text-xs text-center transition-all shadow-xs"
                >
                  Attendance
                </Link>
                <Link
                  to="/academics"
                  className="px-3 py-2 rounded-xl bg-white hover:bg-[#F4EFEA] border border-[#EAE3D8] text-[#1C211F] font-bold text-xs text-center transition-all"
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
        <div className="lg:col-span-7 bg-white rounded-[24px] p-6 border border-[#EAE3D8] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-[#1C211F] flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#D9822B]" /> Pending Grading Queue ({submissions.length})
            </h2>
            <span className="text-xs font-bold text-[#D9822B] bg-[#FEF7ED] px-2.5 py-1 rounded-full">
              Requires Action
            </span>
          </div>

          <div className="space-y-3">
            {submissions.length > 0 ? (
              submissions.map((sub) => (
                <div key={sub.id} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#D9822B]/40 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#FDF2ED] text-[#C85A32]">
                        {sub.course_code}
                      </span>
                      <h4 className="text-xs font-bold text-[#1C211F]">{sub.assignment_title}</h4>
                    </div>
                    <p className="text-xs text-[#5E6763] font-medium">
                      Student: <span className="font-bold text-[#1C211F]">{sub.student_name}</span> ({sub.student_roll})
                    </p>
                    <span className="text-[10px] text-[#8E9893] font-semibold block">Submitted: {sub.submitted_at}</span>
                  </div>

                  <button
                    onClick={() => setGradingModal(sub)}
                    className="px-4 py-2 rounded-xl bg-[#D9822B] hover:bg-[#B44E27] text-white font-bold text-xs shadow-xs transition-all shrink-0 self-start sm:self-center"
                  >
                    Grade & Feedback
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-[#FAF7F2] rounded-2xl border border-dashed border-[#EAE3D8] space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#5E8C71] mx-auto" />
                <p className="text-xs font-bold text-[#1C211F]">All student submissions are graded!</p>
                <p className="text-[11px] text-[#8E9893]">No pending assignments in evaluation queue.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Today's Schedule & At-Risk Attendance Alerts */}
        <div className="lg:col-span-5 space-y-6">
          {/* Today's Teaching Schedule */}
          <div className="bg-white rounded-[24px] p-6 border border-[#EAE3D8] shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#1C211F] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#C85A32]" /> Today's Lecture Schedule
            </h2>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#F0F6F2] border border-[#5E8C71]/30 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-[#1C211F] block">CS-301 Data Structures</span>
                  <span className="text-[11px] text-[#5E6763] font-medium">09:00 AM - 10:30 AM | Room 302</span>
                </div>
                <span className="text-[10px] font-bold bg-[#5E8C71] text-white px-2 py-0.5 rounded-full">
                  Completed
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FEF7ED] border border-[#D9822B]/30 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-[#D9822B] block">CS-402 Artificial Intelligence</span>
                  <span className="text-[11px] text-[#5E6763] font-medium">11:30 AM - 01:00 PM | Lab 4</span>
                </div>
                <span className="text-[10px] font-bold bg-[#D9822B] text-white px-2 py-0.5 rounded-full animate-pulse">
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
        <div className="lg:col-span-6 bg-[#1C211F] text-white rounded-[24px] p-6 shadow-md space-y-4 border border-[#2D3330]">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C85A32]" /> AI Teaching Insights & Class Health
            </h2>
            <span className="text-[10px] font-bold bg-[#C85A32]/20 text-[#FAF0E9] px-2 py-0.5 rounded-full border border-[#C85A32]/30">
              Live Synthesis
            </span>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
              <span className="font-bold text-[#FAF0E9] block">💡 CS-301 Quiz Performance Insight</span>
              <p className="text-[#FAF7F2]/80">
                85% of CS-301 students scored above 80% on Quiz 2. Recommended focus area for next week: Advanced Graph Traversal Algorithms.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
              <span className="font-bold text-[#FAF0E9] block">📊 Lab Submission Rate</span>
              <p className="text-[#FAF7F2]/80">
                Neural Networks Lab report submission rate is 90% (18/20 students). 2 pending submissions in queue.
              </p>
            </div>
          </div>

          <Link
            to="/student/ai-assistant"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#C85A32] hover:text-[#B44E27] transition-colors pt-2"
          >
            Open AI Assistant for Lesson Planning <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="lg:col-span-6 bg-white rounded-[24px] p-6 border border-[#EAE3D8] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-[#1C211F] flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#C85A32]" /> Faculty Notices & Announcements
            </h2>
            <button
              onClick={() => setNoticeModal(true)}
              className="text-xs font-bold text-[#C85A32] hover:underline flex items-center gap-1"
            >
              + Post Notice
            </button>
          </div>

          <div className="space-y-3">
            {announcements.length > 0 ? (
              announcements.slice(0, 3).map((ann, idx) => (
                <div key={ann.id || idx} className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#1C211F]">{ann.title}</span>
                    <span className="text-[10px] text-[#C85A32] font-bold bg-[#FDF2ED] px-2 py-0.5 rounded-full">
                      {ann.target_role || 'Student'}
                    </span>
                  </div>
                  <p className="text-xs text-[#5E6763] line-clamp-2">{ann.content}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#8E9893] py-4 text-center">No recent department notices posted.</p>
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
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EAE3D8] focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[#1C211F] font-bold">Faculty Feedback</label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Great explanation of tree balancing algorithms!"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EAE3D8] focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#EAE3D8] text-[#5E6763] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D9822B] hover:bg-[#B44E27] text-white font-bold shadow-md"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in border border-[#EAE3D8]">
            <div className="flex justify-between items-center border-b border-[#EAE3D8] pb-3">
              <h3 className="text-base font-bold text-[#1C211F]">Broadcast Class Notice</h3>
              <button onClick={() => setNoticeModal(false)} className="p-1 rounded-lg text-[#8E9893] hover:text-[#1C211F]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleNoticeSubmit} className="space-y-4 text-xs font-medium">
              <div className="space-y-1.5">
                <label className="block text-[#1C211F] font-bold">Notice Headline / Title</label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. CS-301 Midterm Examination Schedule Released"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EAE3D8] focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[#1C211F] font-bold">Announcement Content</label>
                <textarea
                  rows={4}
                  required
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="Please review chapter 4 before tomorrow's lecture..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EAE3D8] focus:outline-none focus:border-[#C85A32]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNoticeModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EAE3D8] text-[#5E6763] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-bold shadow-md"
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1C211F] text-white p-7 rounded-[28px] shadow-xl border border-[#EAE3D8]/15 relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF2ED]/10 text-[#FDF2ED] text-xs font-bold border border-[#C85A32]/30">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C85A32]" /> Admin Control Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, <span className="text-[#C85A32]">{name}</span> 🛡️
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9893] font-medium leading-relaxed">
            Manage university users, monitor campus complaints, and broadcast university notices.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link
            to="/admin/users"
            className="px-5 py-3 rounded-2xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-extrabold text-xs shadow-lg shadow-[#C85A32]/25 transition-all flex items-center gap-2 border border-[#C85A32]/40"
          >
            <Users className="w-4 h-4" /> Manage User Accounts
          </Link>
        </div>
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#C85A32]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Total Students</span>
            <span className="text-2xl font-extrabold text-[#C85A32]">450</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FDF2ED] text-[#C85A32] border border-[#C85A32]/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Active Faculty</span>
            <span className="text-2xl font-extrabold text-[#5E8C71]">32</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#F0F6F2] text-[#5E8C71] border border-[#5E8C71]/20">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Active Courses</span>
            <span className="text-2xl font-extrabold text-[#C85A32]">24</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FDF2ED] text-[#C85A32] border border-[#C85A32]/20">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Open Concerns</span>
            <span className="text-2xl font-extrabold text-[#D9822B]">3</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FEF7ED] text-[#D9822B] border border-[#D9822B]/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SuperAdminDashboard({ name }: { name?: string }) {
  return (
    <div className="space-y-7 animate-fade-in font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1C211F] text-white p-7 rounded-3xl shadow-sm border border-[#2D3330] relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF2ED]/10 text-[#FDF2ED] text-xs font-bold border border-[#C85A32]/30">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C85A32]" /> Super Admin Global Control
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, <span className="text-[#C85A32]">{name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9893] font-medium leading-relaxed">
            Full system governance, institutional user & role control, database security, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link
            to="/super-admin/users"
            className="px-5 py-3 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 border border-[#C85A32]/40"
          >
            <Users className="w-4 h-4" /> User & Role Governance
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Total Users</span>
            <span className="text-2xl font-extrabold text-[#C85A32]">512</span>
            <span className="text-[11px] text-[#5E6763] font-semibold block mt-0.5">Across All Roles</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FDF2ED] text-[#C85A32] border border-[#C85A32]/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Faculty Members</span>
            <span className="text-2xl font-extrabold text-[#C85A32]">32</span>
            <span className="text-[11px] text-[#5E6763] font-semibold block mt-0.5">Active Staff</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FDF2ED] text-[#C85A32] border border-[#C85A32]/20">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">System Health</span>
            <span className="text-2xl font-extrabold text-[#5E8C71]">99.9%</span>
            <span className="text-[11px] text-[#5E8C71] font-semibold block mt-0.5">FastAPI & DB Live</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#F0F6F2] text-[#5E8C71] border border-[#5E8C71]/20">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Security Audits</span>
            <span className="text-2xl font-extrabold text-[#1C211F]">0</span>
            <span className="text-[11px] text-[#5E6763] font-semibold block mt-0.5">No Active Alerts</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FDFBF8] text-[#8E9893] border border-[#EAE3D8]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LibrarianDashboard({ name }: { name?: string }) {
  return (
    <div className="space-y-7 animate-fade-in font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1C211F] text-white p-7 rounded-[28px] shadow-xl border border-[#EAE3D8]/15 relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF2ED]/10 text-[#FDF2ED] text-xs font-bold border border-[#C85A32]/30">
            <BookOpen className="w-3.5 h-3.5 text-[#C85A32]" /> Library Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Library Desk, <span className="text-[#C85A32]">{name}</span> 📚
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9893] font-medium leading-relaxed">
            Manage catalog records, issue/return textbooks, and track student lending history.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link
            to="/library/library"
            className="px-5 py-3 rounded-2xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-extrabold text-xs shadow-lg shadow-[#C85A32]/25 transition-all flex items-center gap-2 border border-[#C85A32]/40"
          >
            <BookOpen className="w-4 h-4" /> Open Library Catalog
          </Link>
        </div>
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#C85A32]/10 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
}

function HostelWardenDashboard({ name }: { name?: string }) {
  return (
    <div className="space-y-7 animate-fade-in font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1C211F] text-white p-7 rounded-[28px] shadow-xl border border-[#EAE3D8]/15 relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF2ED]/10 text-[#FDF2ED] text-xs font-bold border border-[#C85A32]/30">
            <Building2 className="w-3.5 h-3.5 text-[#C85A32]" /> Hostel Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Hostel Warden Portal, <span className="text-[#C85A32]">{name}</span> 🏠
          </h1>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link
            to="/hostel/hostel"
            className="px-5 py-3 rounded-2xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-extrabold text-xs shadow-lg shadow-[#C85A32]/25 transition-all flex items-center gap-2 border border-[#C85A32]/40"
          >
            <Building2 className="w-4 h-4" /> Manage Hostel Rooms
          </Link>
        </div>
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#C85A32]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Total Rooms</span>
            <span className="text-2xl font-extrabold text-[#C85A32]">120</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FDF2ED] text-[#C85A32] border border-[#C85A32]/20">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Occupied Beds</span>
            <span className="text-2xl font-extrabold text-[#5E8C71]">210</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#F0F6F2] text-[#5E8C71] border border-[#5E8C71]/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Maintenance Requests</span>
            <span className="text-2xl font-extrabold text-[#D9822B]">4</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FEF7ED] text-[#D9822B] border border-[#D9822B]/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Gate Pass Pending</span>
            <span className="text-2xl font-extrabold text-[#D9822B]">2</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FEF7ED] text-[#D9822B] border border-[#D9822B]/20">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1C211F] text-white p-7 rounded-3xl shadow-sm border border-[#2D3330] relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF2ED]/10 text-[#FDF2ED] text-xs font-bold border border-[#C85A32]/30">
            <Target className="w-3.5 h-3.5 text-[#C85A32]" /> Corporate Placement Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Placement Officer Portal, <span className="text-[#C85A32]">{name}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link
            to="/placement/placements"
            className="px-5 py-3 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 border border-[#C85A32]/40"
          >
            <ClipboardList className="w-4 h-4" /> View Corporate Drives
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Recruiting Companies</span>
            <span className="text-2xl font-extrabold text-[#C85A32]">12</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FDF2ED] text-[#C85A32] border border-[#C85A32]/20">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Active Drives</span>
            <span className="text-2xl font-extrabold text-[#5E8C71]">4</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#F0F6F2] text-[#5E8C71] border border-[#5E8C71]/20">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Total Applications</span>
            <span className="text-2xl font-extrabold text-[#1C211F]">45</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FDF2ED] text-[#C85A32] border border-[#C85A32]/20">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm flex items-center justify-between hover:border-[rgba(200,90,50,0.3)] transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Placement Rate</span>
            <span className="text-2xl font-extrabold text-[#5E8C71]">88.5%</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#F0F6F2] text-[#5E8C71] border border-[#5E8C71]/20">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
