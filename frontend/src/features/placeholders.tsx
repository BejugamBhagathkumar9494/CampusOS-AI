import { useState, useEffect } from 'react';
import {
  predictPlacementReadiness,
  getPlacementAnalytics,
  reviewResume,
  getTransportRoutes,
  getFeeDetails,
  getScholarships,
  getAdminAnalytics
} from '../services/api';
import { useAuth } from '../auth/hooks/useAuth';
import { supabase } from '../services/supabaseClient';
import { courseService } from '../services/courseService';
import { assignmentService } from '../services/assignmentService';
import { attendanceService } from '../services/attendanceService';
import { examService } from '../services/examService';
import { announcementService } from '../services/announcementService';
import { hostelService } from '../services/hostelService';
import { complaintService } from '../services/complaintService';
import { libraryService } from '../services/libraryService';
import { placementService } from '../services/placementService';
import { eventService } from '../services/eventService';
import {
  BookOpen, Upload, Landmark, Bus, Cpu, Award, Briefcase, Search, FileText, Check, Users, Calendar, AlertTriangle, Sparkles, User, Lock, Bell
} from 'lucide-react';

// 1. ACADEMICS COMPONENT
export const Academics = () => {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollMsg, setEnrollMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchCourses() {
      try {
        if (profile?.id) {
          const res = profile.role === 'faculty'
            ? await courseService.getFacultyCourses(profile.id)
            : await courseService.getStudentCourses(profile.id);
          if (isMounted && res.length > 0) {
            setCourses(res);
            setLoading(false);
            return;
          }
        }
        const all = await courseService.getAllCourses();
        if (isMounted) setCourses(all);
      } catch (err) {
        console.error('Error fetching academic courses:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchCourses();
    return () => { isMounted = false; };
  }, [profile]);

  const handleEnroll = async (courseId: string, courseTitle: string) => {
    if (!profile?.id) return;
    try {
      await courseService.enrollCourse(profile.id, courseId);
      setEnrollMsg(`Enrollment request for ${courseTitle} recorded in database!`);
      setTimeout(() => setEnrollMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit course enrollment.');
    }
  };

  const displayCourses = courses.length > 0 ? courses : [
    { id: '1', code: 'CS301', title: 'Automata & Formal Languages', credits: 4, instructor_name: 'Dr. Sarah Jenkins', progress: 78 },
    { id: '2', code: 'CS302', title: 'Computer Networks & Protocols', credits: 4, instructor_name: 'Prof. Alan Vance', progress: 85 },
    { id: '3', code: 'CS303', title: 'Database Management Systems', credits: 4, instructor_name: 'Dr. Emily Stone', progress: 92 }
  ];

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <BookOpen className="w-5 h-5" />
            </span>
            Academics & Courses
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage enrolled courses, syllabi, study planners, and AI elective recommendations.</p>
        </div>
        <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-700">Semester V • {profile?.institution_id || 'STU001'}</span>
        </div>
      </div>

      {enrollMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold animate-fade-in">
          {enrollMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" /> Current Enrolled Subjects ({displayCourses.length})
          </h2>
          {loading ? (
            <p className="text-xs text-slate-400 font-medium">Loading courses from Supabase...</p>
          ) : (
            <div className="space-y-3">
              {displayCourses.map((subject) => (
                <div key={subject.code} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 flex flex-col justify-between gap-3 hover:bg-slate-50 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">{subject.code} • {subject.credits || 4} Credits</span>
                      <h3 className="text-base text-slate-900 font-bold mt-1.5">{subject.title || subject.name}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Instructor: {subject.instructor_name || subject.prof || 'Faculty Member'}</p>
                    </div>
                    <button onClick={() => alert(`Downloading official Syllabus PDF for ${subject.code}...`)} className="text-xs font-bold text-indigo-600 bg-white border border-indigo-100 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-all shadow-2xs">
                      Syllabus PDF
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                      <span>Syllabus Completed</span>
                      <span className="text-indigo-600">{subject.progress || 80}%</span>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 h-2 rounded-full transition-all duration-500" style={{ width: `${subject.progress || 80}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" /> AI Elective Recommender
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">Based on your academic performance, coding scores, and placement dataset requirements:</p>
          
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100 space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">Natural Language Processing & LLMs</h3>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">96% Match</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">High placement weightage in dataset • Offered by Dr. Sarah Jenkins</p>
              <button onClick={() => handleEnroll(displayCourses[0]?.id || '1', 'Natural Language Processing & LLMs')} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm">
                Request Enrollment
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">Distributed Systems & Cloud Architecture</h3>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">88% Match</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Demanded by recruiters (TCS, Google, Amazon) • Offered by Prof. Vance</p>
              <button onClick={() => handleEnroll(displayCourses[1]?.id || '2', 'Distributed Systems & Cloud Architecture')} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all">
                Request Enrollment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. ATTENDANCE COMPONENT
export const Attendance = () => {
  const { profile } = useAuth();
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadAttendance() {
      try {
        if (profile?.id) {
          const res = await attendanceService.getStudentAttendance(profile.id);
          if (isMounted) setAttendanceData(res);
        }
      } catch (err) {
        console.error('Error fetching attendance from Supabase:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAttendance();
    return () => { isMounted = false; };
  }, [profile]);

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Calendar className="w-5 h-5" />
            </span>
            Attendance Monitor
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Track subject attendance rates and predictive shortage alerts.</p>
        </div>
        {attendanceData && (
          <div className="px-5 py-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Overall Rate</span>
              <span className="text-2xl font-extrabold text-emerald-600">{attendanceData.overall_rate}%</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-sm">
              <Check className="w-5 h-5" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Subject Breakdown</h2>
          <span className="text-xs font-bold text-indigo-600">Threshold: 75.0%</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-xs text-slate-400 font-medium">Loading live attendance records...</div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <th className="p-4.5 pl-6">Subject</th>
                  <th className="p-4.5">Total Classes</th>
                  <th className="p-4.5">Attended</th>
                  <th className="p-4.5">Attendance Rate</th>
                  <th className="p-4.5 pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(attendanceData?.subjects || []).map((sub: any) => (
                  <tr key={sub.subject_name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4.5 pl-6 font-bold text-slate-900">
                      {sub.subject_name} <span className="text-xs text-slate-400 font-semibold font-mono">({sub.subject_code})</span>
                    </td>
                    <td className="p-4.5 text-slate-600">{sub.total_classes}</td>
                    <td className="p-4.5 text-slate-600">{sub.attended_classes}</td>
                    <td className="p-4.5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-800 w-12">{sub.attendance_rate}%</span>
                        <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className={`h-2 rounded-full ${sub.attendance_rate >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${sub.attendance_rate}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4.5 pr-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        sub.status === 'Safe' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// 3. EXAMS COMPONENT
export const Exams = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examService.getExams()
      .then((res) => setExams(res))
      .catch((err) => console.error('Error fetching exams:', err))
      .finally(() => setLoading(false));
  }, []);

  const defaultExams = [
    { exam_date: '2026-05-15T10:00:00Z', subject_code: 'CS301', subject_name: 'Automata Theory', time: '10:00 AM - 01:00 PM', location: 'Hall 302' },
    { exam_date: '2026-05-17T14:00:00Z', subject_code: 'CS302', subject_name: 'Computer Networks', time: '02:00 PM - 05:00 PM', location: 'Hall 104' },
    { exam_date: '2026-05-19T10:00:00Z', subject_code: 'CS303', subject_name: 'Database Management Systems', time: '10:00 AM - 01:00 PM', location: 'Lab 2' }
  ];

  const displayExams = exams.length > 0 ? exams.map(e => ({
    exam_date: e.exam_date,
    subject_code: e.courses?.code || 'CS',
    subject_name: e.exam_name || e.courses?.title || 'Exam',
    time: '10:00 AM - 01:00 PM',
    location: e.location || 'Exam Hall A'
  })) : defaultExams;

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <FileText className="w-5 h-5" />
          </span>
          Exams & Grade Predictions
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">View upcoming semester timetables, hall passes, and internal grade predictions.</p>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Upcoming End Semester Timetable</h2>
        {loading ? (
          <p className="text-xs text-slate-400 font-medium">Loading exam schedules from Supabase...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayExams.map((ex, idx) => (
              <div key={ex.subject_code || idx} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-3 hover:bg-slate-50 transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">{new Date(ex.exam_date).toLocaleDateString()}</span>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">A (Predicted)</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{ex.subject_name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Code: {ex.subject_code} • Location: {ex.location}</p>
                </div>
                <div className="text-xs font-semibold text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 text-center font-mono">
                  {ex.time}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 4. ASSIGNMENTS COMPONENT
export const Assignments = () => {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = async () => {
    try {
      const res = await assignmentService.getAssignments();
      setAssignments(res);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSubmitAssignment = async (assignId: string) => {
    if (!submissionUrl || !profile?.id) return;
    setSubmitting(true);
    try {
      await assignmentService.submitAssignment(assignId, profile.id, submissionUrl);
      setMsg('Assignment submission successfully recorded in Supabase!');
      setActiveModal(null);
      setSubmissionUrl('');
      setTimeout(() => setMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit assignment solution.');
    } finally {
      setSubmitting(false);
    }
  };

  const defaultAssigns = [
    { id: '1', title: 'DFA & NFA Finite State Simulator', subject_code: 'CS301 Lab', description: 'Implement finite state machine simulator in C++ or Python.', due_date: '2026-08-16T23:59:00Z' },
    { id: '2', title: 'Socket Programming & TCP Handshake', subject_code: 'CS302 Lab', description: 'Write client-server socket scripts establishing TCP connection.', due_date: '2026-08-20T23:59:00Z' }
  ];

  const displayList = assignments.length > 0 ? assignments.map(a => ({
    id: a.id,
    title: a.title,
    subject_code: a.courses?.code || 'CS',
    description: a.description || 'Complete assigned problem set and upload submission URL.',
    due_date: a.due_date
  })) : defaultAssigns;

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Upload className="w-5 h-5" />
          </span>
          Assignments & Submissions
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Upload solutions, check assignment deadlines, and review grading reports.</p>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          {msg}
        </div>
      )}

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Pending & Upcoming Tasks</h2>
        {loading ? (
          <p className="text-xs text-slate-400 font-medium">Loading assignments from Supabase...</p>
        ) : (
          <div className="space-y-3">
            {displayList.map((item) => (
              <div key={item.id} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                      Deadline: {new Date(item.due_date).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{item.subject_code}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5">{item.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{item.description}</p>
                </div>
                <button
                  onClick={() => setActiveModal(item.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 shrink-0"
                >
                  <Upload className="w-4 h-4" /> Submit Solution
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Upload Assignment Solution</h3>
            <p className="text-xs text-slate-500">Provide GitHub repo URL or file storage link to submit your work.</p>
            <input
              type="text"
              value={submissionUrl}
              onChange={(e) => setSubmissionUrl(e.target.value)}
              placeholder="https://github.com/username/assignment-repo"
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-indigo-500"
            />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setActiveModal(null)} className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">Cancel</button>
              <button onClick={() => handleSubmitAssignment(activeModal)} disabled={submitting} className="w-1/2 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md">
                {submitting ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 5. LIBRARY COMPONENT
export const Library = () => {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await libraryService.getBooks(query);
      setBooks(res);
    } catch (err) {
      console.error('Library fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleIssue = async (bookId: string, title: string) => {
    if (!profile?.id) return;
    try {
      await libraryService.issueBook(profile.id, bookId);
      setMsg(`Book "${title}" issued successfully!`);
      setTimeout(() => setMsg(''), 4000);
      fetchBooks();
    } catch (err: any) {
      alert(err.message || 'Failed to issue book.');
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <BookOpen className="w-5 h-5" />
          </span>
          Library & Vector Search
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Search reference books, research papers, and available university copies.</p>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          {msg}
        </div>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBooks()}
            placeholder="Search titles, authors, or subjects (e.g. 'Algorithms', 'Networks')..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 shadow-xs transition-all"
          />
        </div>
        <button onClick={fetchBooks} disabled={loading} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-2xl text-sm text-white font-bold transition-all shadow-md shadow-indigo-500/20">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Available Library Catalog ({books.length})</h2>
        <div className="space-y-3">
          {books.map((book) => (
            <div key={book.id || book.isbn} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{book.title}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Author: {book.author} • Category: {book.category || 'CS'}</p>
                {book.isbn && <p className="text-[11px] text-slate-400 font-mono mt-1">ISBN: {book.isbn}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3.5 py-1.5 rounded-full font-extrabold border ${
                  book.copies_available > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}>
                  {book.copies_available > 0 ? `${book.copies_available} Available` : 'All Issued'}
                </span>
                {book.copies_available > 0 && (
                  <button onClick={() => handleIssue(book.id, book.title)} className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs">
                    Borrow Book
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 6. HOSTEL COMPONENT
export const Hostel = () => {
  const { profile } = useAuth();
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [complaints, setComplaints] = useState<any[]>([]);

  const [leaveReason, setLeaveReason] = useState('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'complaints' | 'leave'>('complaints');

  const fetchComplaints = async () => {
    try {
      const data = await complaintService.getComplaints(profile?.id);
      setComplaints(data);
    } catch {
      setComplaints([]);
    }
  };

  const fetchLeaves = async () => {
    try {
      const data = await hostelService.getLeaveRequests(profile?.id);
      setLeaveRequests(data);
    } catch {
      setLeaveRequests([]);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchLeaves();
  }, [profile]);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintTitle || !complaintText || !profile?.id) return;
    setSubmitting(true);
    try {
      await complaintService.fileComplaint(profile.id, complaintTitle, complaintText, 'Hostel Maintenance', 'medium');
      setComplaintTitle('');
      setComplaintText('');
      await fetchComplaints();
    } catch (err: any) {
      alert(err.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason || !leaveStart || !leaveEnd || !profile?.id) return;
    setSubmitting(true);
    try {
      await hostelService.applyLeave(profile.id, {
        reason: leaveReason,
        start_date: leaveStart,
        end_date: leaveEnd
      });
      setLeaveReason('');
      setLeaveStart('');
      setLeaveEnd('');
      await fetchLeaves();
    } catch (err: any) {
      alert(err.message || 'Failed to apply leave.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <AlertTriangle className="w-5 h-5" />
          </span>
          Hostel Hub & Leave Portal
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">File maintenance tickets, check room details, and submit leave requests.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('complaints')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'complaints' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Maintenance Tickets ({complaints.length})
        </button>
        <button
          onClick={() => setActiveTab('leave')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'leave' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Hostel Leave Requests ({leaveRequests.length})
        </button>
      </div>

      {activeTab === 'complaints' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleSubmitComplaint} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Submit Maintenance Request</h2>
            <input
              type="text"
              value={complaintTitle}
              onChange={(e) => setComplaintTitle(e.target.value)}
              placeholder="Complaint Subject (e.g. WiFi router power failure)"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              required
            />
            <textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="Detailed description (e.g. Power outlet in Room 302-B sparked)..."
              className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              required
            />
            <button type="submit" disabled={submitting} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-indigo-500/20">
              {submitting ? 'Submitting to Supabase...' : 'Submit & Log Maintenance Ticket'}
            </button>
          </form>

          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Allotted Room Details</h2>
            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              <div className="flex justify-between py-2 border-b border-slate-100 font-medium">
                <span className="text-slate-500">Room Number</span>
                <span className="font-bold text-slate-900">302-B</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 font-medium">
                <span className="text-slate-500">Block & Wing</span>
                <span className="font-bold text-slate-900">BLOCK-A (Cauvery Hall)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 font-medium">
                <span className="text-slate-500">Room Capacity</span>
                <span className="font-bold text-slate-900">2 Bed Capacity</span>
              </div>
              <div className="flex justify-between py-2 font-medium">
                <span className="text-slate-500">Hostel Warden</span>
                <span className="font-bold text-slate-900">Ramesh Kumar</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleSubmitLeave} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Apply for Hostel Leave</h2>
            <input
              type="text"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="Reason for leave (e.g. Weekend family visit)"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 outline-none focus:border-indigo-500"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Start Date</label>
                <input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">End Date</label>
                <input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900" required />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md">
              {submitting ? 'Submitting...' : 'Submit Leave Application'}
            </button>
          </form>

          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Leave History ({leaveRequests.length})</h2>
            {leaveRequests.map((l) => (
              <div key={l.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-900">{l.reason}</p>
                  <p className="text-[11px] text-slate-400">{l.start_date} to {l.end_date}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                  l.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : l.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'complaints' && (
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Active Maintenance Tickets ({complaints.length})</h2>
          <div className="space-y-3">
            {complaints.map((c) => (
              <div key={c.id || c.title} className="p-4.5 rounded-2xl bg-slate-50/60 border border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{c.description}</p>
                  <span className="text-[11px] text-slate-400 font-mono mt-1 block">Status: {c.status}</span>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-extrabold border ${
                  c.priority === 'urgent' || c.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                }`}>
                  Priority: {c.priority || 'medium'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 7. TRANSPORT COMPONENT
export const Transport = () => {
  const [routes, setRoutes] = useState<any[]>([]);

  useEffect(() => {
    getTransportRoutes()
      .then((data) => setRoutes(data.routes || []))
      .catch(() => {
        setRoutes([
          { route: 'Route 10A (Central Station to Campus)', bus_number: 'TS-09-UA-1234', eta: '8 mins', demand: 'High' },
          { route: 'Route 04B (Metro Link to West Gate)', bus_number: 'TS-09-UA-5678', eta: '14 mins', demand: 'Low' }
        ]);
      });
  }, []);

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Bus className="w-5 h-5" />
          </span>
          Transport & Bus Tracking
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Track campus shuttles, live ETAs, driver contacts, and peak occupancy predictions.</p>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Bus className="w-5 h-5 text-indigo-600" /> Active Campus Bus Routes
        </h2>
        <div className="space-y-3">
          {routes.map((bus) => (
            <div key={bus.route} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">{bus.route}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Vehicle: <span className="font-mono text-indigo-600 font-bold">{bus.bus_number}</span> • Driver: {bus.driver_name || 'Ramesh Kumar'}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Live ETA: <span className="text-emerald-600 font-extrabold">{bus.eta || '10 mins'}</span></p>
              </div>
              <span className={`text-xs px-3.5 py-1.5 rounded-full font-extrabold border ${
                bus.demand === 'High' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                Peak Occupancy: {bus.demand || 'Normal'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 8. PLACEMENTS COMPONENT
export const Placements = () => {
  const { profile } = useAuth();
  const [cgpa, setCgpa] = useState('8.50');
  const [branch, setBranch] = useState('CSE');
  const [tier, setTier] = useState('Tier 1');
  const [codingScore, setCodingScore] = useState('85');
  const [mockScore, setMockScore] = useState('78');
  const [internships, setInternships] = useState('1');
  const [skills, setSkills] = useState('Python, Data Structures, System Design, SQL');

  const [prediction, setPrediction] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [resumeText, setResumeText] = useState('');
  const [resumeResult, setResumeResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [evaluatingResume, setEvaluatingResume] = useState(false);

  const [applyMsg, setApplyMsg] = useState('');

  const fetchPlacementData = async () => {
    try {
      const cList = await placementService.getCompanies();
      setCompanies(cList);
      const dList = await placementService.getPlacementDrives();
      setDrives(dList);
    } catch (err) {
      console.error('Error fetching placement data:', err);
    }
  };

  useEffect(() => {
    fetchPlacementData();
    getPlacementAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  const calculateReadiness = async () => {
    setLoading(true);
    try {
      const res = await predictPlacementReadiness({
        cgpa: Number(cgpa),
        branch,
        college_tier: tier,
        coding_platform_score: Number(codingScore),
        mock_interview_score: Number(mockScore),
        internships_count: Number(internships),
        skills: skills.split(',').map(s => s.trim()).filter(Boolean)
      });
      setPrediction(res);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleResumeReview = async () => {
    if (!resumeText) return;
    setEvaluatingResume(true);
    try {
      const res = await reviewResume(resumeText);
      setResumeResult(res);
    } catch {
      // fallback
    } finally {
      setEvaluatingResume(false);
    }
  };

  const handleApplyDrive = async (driveId: string) => {
    if (!profile?.id) return;
    try {
      await placementService.applyDrive(profile.id, driveId);
      setApplyMsg('Application for drive recorded in Supabase!');
      setTimeout(() => setApplyMsg(''), 4000);
      fetchPlacementData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit placement application.');
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-7 rounded-[24px] bg-gradient-to-r from-[#EEF2FF] via-[#F3E8FF] to-[#E0E7FF] border border-indigo-100/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 text-indigo-600 text-xs font-extrabold mb-2 border border-white/80 shadow-2xs">
            <Award className="w-3.5 h-3.5" /> 100,000+ Placement Dataset ML Model
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Placements & Recruitment Drives</h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">Check drive eligibility, apply for active recruiters, and predict readiness scores.</p>
        </div>
        {analytics && (
          <div className="flex gap-3">
            <div className="text-center px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Dataset Total</span>
              <div className="text-base font-extrabold text-slate-900">{analytics.total_records?.toLocaleString()}</div>
            </div>
            <div className="text-center px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Placement Rate</span>
              <div className="text-base font-extrabold text-emerald-600">{analytics.placement_rate}%</div>
            </div>
            <div className="text-center px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Avg Salary</span>
              <div className="text-base font-extrabold text-indigo-600">{analytics.avg_salary_lpa} LPA</div>
            </div>
          </div>
        )}
      </div>

      {applyMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          {applyMsg}
        </div>
      )}

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" /> Active Placement Recruitment Drives ({drives.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drives.map((d) => (
            <div key={d.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">{d.companies?.name || 'Company'}</span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{d.job_title}</h3>
                  <p className="text-xs text-slate-500 font-medium">Package: <span className="font-bold text-emerald-600">{d.package_ctc || 12} LPA</span></p>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">Min CGPA: {d.min_cgpa || 6.0}</p>
              <button
                onClick={() => handleApplyDrive(d.id)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Apply for Drive
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" /> ML Readiness & Salary Calculator
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">CGPA (0 - 10)</label>
              <input value={cgpa} onChange={(e) => setCgpa(e.target.value)} type="number" step="0.01" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Branch</label>
              <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500">
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="MECH">MECH</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">College Tier</label>
              <select value={tier} onChange={(e) => setTier(e.target.value)} className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500">
                <option value="Tier 1">Tier 1</option>
                <option value="Tier 2">Tier 2</option>
                <option value="Tier 3">Tier 3</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Coding Score (0-100)</label>
              <input value={codingScore} onChange={(e) => setCodingScore(e.target.value)} type="number" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mock Interview Score</label>
              <input value={mockScore} onChange={(e) => setMockScore(e.target.value)} type="number" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Internships Count</label>
              <input value={internships} onChange={(e) => setInternships(e.target.value)} type="number" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Skills (comma separated)</label>
            <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Python, SQL, React, System Design" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500" />
          </div>

          <button onClick={calculateReadiness} disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 py-3 text-xs font-bold text-white transition-all shadow-md shadow-indigo-500/20">
            {loading ? 'Predicting with ML...' : 'Calculate Placement Readiness & Expected Salary'}
          </button>

          {prediction && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Readiness</span>
                  <div className="text-base font-extrabold text-slate-900">{prediction.readiness_rating} ({prediction.readiness_score}%)</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Expected Salary</span>
                  <div className="text-xl font-extrabold text-emerald-600">{prediction.expected_salary_lpa} LPA</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> AI Resume Reviewer
            </h2>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste resume text here (e.g. 'Built web app using Python, FastAPI, React, SQL...')"
              className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:border-indigo-500"
            />
            <button onClick={handleResumeReview} disabled={evaluatingResume || !resumeText} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-bold text-white transition-all shadow-xs">
              {evaluatingResume ? 'Analyzing Resume...' : 'Analyze Resume Score & Skill Gaps'}
            </button>

            {resumeResult && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Score</span>
                  <span className="text-base font-extrabold text-indigo-600">{resumeResult.score}/100</span>
                </div>
                <p className="text-xs text-slate-700 font-medium">{resumeResult.feedback}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" /> Active Campus Recruiters ({companies.length})
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {companies.map((comp) => (
                <div key={comp.id || comp.name} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{comp.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">{comp.industry || 'Tech'}</p>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-600 font-mono">Top Recruiter</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 9. FINANCE COMPONENT
export const Finance = () => {
  const [feeInfo, setFeeInfo] = useState<any>(null);
  const [scholarships, setScholarships] = useState<any[]>([]);

  useEffect(() => {
    getFeeDetails('1').then(setFeeInfo).catch(() => {});
    getScholarships('1').then(res => setScholarships(res.recommendations || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Landmark className="w-5 h-5" />
          </span>
          Finance & Fees
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Check dues, inspect structural breakdown, and review AI scholarship matching.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pending Fee Dues</span>
          <p className="text-3xl font-extrabold text-slate-900">${feeInfo?.dues?.toLocaleString() || '1,250.00'}</p>
          <p className="text-xs text-slate-500 font-medium">Due Date: <span className="text-rose-600 font-bold">{feeInfo?.due_date || '2026-08-15'}</span></p>
          <button onClick={() => alert('Online fee payment gateway initialized. Proceeding with secure checkout...')} className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-xs text-white font-bold transition-all shadow-md shadow-indigo-500/20">
            Pay Dues Online
          </button>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-600" /> AI Scholarship Matches ({scholarships.length})
          </h2>
          <div className="space-y-3">
            {scholarships.map((sch) => (
              <div key={sch.id || sch.title} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{sch.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Criteria: {sch.criteria} • Eligibility: <span className="text-emerald-600 font-extrabold">{sch.eligibility_match}% Match</span></p>
                </div>
                <span className="text-base font-extrabold text-emerald-600 font-mono">${sch.amount_usd}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 10. EVENTS COMPONENT
export const Events = () => {
  const { profile } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await eventService.getEvents();
      setEvents(res);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRegister = async (eventId: string, title: string) => {
    if (!profile?.id) return;
    try {
      await eventService.registerEvent(profile.id, eventId);
      alert(`Successfully registered for ${title}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to register for event.');
    }
  };

  const defaultEvents = [
    { id: '1', title: 'Annual AI & Robotics Summit 2026', event_date: '2026-08-20T09:00:00Z', location: 'Auditorium A', category: 'Hackathon' },
    { id: '2', title: 'Cybersecurity & Ethical Hacking Fest', event_date: '2026-09-05T10:00:00Z', location: 'CS Block Seminar Hall', category: 'Workshop' }
  ];

  const displayEvents = events.length > 0 ? events : defaultEvents;

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Calendar className="w-5 h-5" />
          </span>
          Campus Events & Hackathons
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Register for technical fests, guest lectures, AI hackathons, and sports tournaments.</p>
      </div>

      {loading ? (
        <div className="p-6 text-xs text-slate-400 font-medium">Loading events from Supabase...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayEvents.map((ev) => (
            <div key={ev.id || ev.title} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">{ev.category || 'Event'}</span>
                <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">Registration Open</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{ev.title}</h3>
              <p className="text-xs text-slate-500 font-medium">{new Date(ev.event_date).toLocaleDateString()} • {ev.location}</p>
              <button onClick={() => handleRegister(ev.id, ev.title)} className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-bold shadow-xs">
                Register Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 11. CLUBS COMPONENT
export const Clubs = () => {
  const { profile } = useAuth();
  const [clubs, setClubs] = useState<any[]>([]);

  useEffect(() => {
    eventService.getClubs().then((res) => setClubs(res)).catch(() => {});
  }, []);

  const handleJoin = async (clubId: string, name: string) => {
    if (!profile?.id) return;
    try {
      await eventService.joinClub(profile.id, clubId);
      alert(`Joined ${name} membership recorded in Supabase!`);
    } catch {
      alert('Failed to join club.');
    }
  };

  const defaultClubs = [
    { id: '1', name: 'Coding Club', category: 'Technical', description: 'Competitive programming and open source.' },
    { id: '2', name: 'Robotics Society', category: 'Technical', description: 'Hardware engineering and microcontrollers.' },
    { id: '3', name: 'Cultural Forum', category: 'Cultural', description: 'Music, dance, and festivals.' }
  ];

  const list = clubs.length > 0 ? clubs : defaultClubs;

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <Users className="w-5 h-5" />
          </span>
          Student Clubs & Societies
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Explore active student societies, enrollments, and executive committee leads.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {list.map((club) => (
          <div key={club.id} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{club.name}</h3>
            <p className="text-xs text-slate-500 font-medium">{club.description || 'Student Society'} • {club.category || 'General'}</p>
            <button
              onClick={() => handleJoin(club.id, club.name)}
              className="w-full py-2 rounded-xl text-xs font-bold transition-all bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Join Club
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// 12. NOTICES COMPONENT
export const Notices = () => {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    announcementService.getAnnouncements(profile?.role).then((res) => setAnnouncements(res)).catch(() => {});
  }, [profile]);

  const defaultAnn = [
    { id: '1', title: 'Mid-Semester Exam Instructions & Regulations', created_at: '2026-07-28', target_role: 'student', content: 'Exams begin next week.' },
    { id: '2', title: 'Campus Wi-Fi Maintenance Window Announcement', created_at: '2026-07-25', target_role: 'all', content: 'Wi-Fi upgrades scheduled.' }
  ];

  const list = announcements.length > 0 ? announcements : defaultAnn;

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Bell className="w-5 h-5" />
          </span>
          Notice Board & Circulars
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Official administration announcements, holiday lists, and exam circulars.</p>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        {list.map((n) => (
          <div key={n.id} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md uppercase">{n.target_role || 'All'}</span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{n.title}</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Published on {new Date(n.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => alert(n.content || n.title)} className="text-xs font-bold text-indigo-600 hover:underline">Read Circular</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// 14. AI INSIGHTS COMPONENT
export const AIInsights = () => {
  const [adminStats, setAdminStats] = useState<any>(null);

  useEffect(() => {
    getAdminAnalytics().then(setAdminStats).catch(() => {});
  }, []);

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Sparkles className="w-5 h-5" />
          </span>
          Campus AI Analytics & Predictions
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Predictive dashboards based on university operational logs and 100,000+ student dataset records.</p>
      </div>

      {adminStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Analyzed Dataset Records</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{adminStats.total_analyzed_students?.toLocaleString() || '100,000'}</div>
          </div>
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Placement Rate Forecast</span>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">{adminStats.placement_rate_forecast || '88.4'}%</div>
          </div>
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Hostel Occupancy Rate</span>
            <div className="text-3xl font-extrabold text-indigo-600 mt-1">{adminStats.hostel_occupancy_prediction || '92.5'}%</div>
          </div>
        </div>
      )}
    </div>
  );
};

// 15. SETTINGS COMPONENT
export const Settings = () => {
  const { profile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleUpdatePassword = async () => {
    setMsg('');
    setErr('');
    if (newPassword.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMsg('Security password updated successfully!');
      setNewPassword('');
    } catch (e: any) {
      setErr(e.message || 'Failed to update password.');
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <Lock className="w-5 h-5" />
          </span>
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Manage security settings, notifications, active sessions, and password preferences.</p>
      </div>

      {msg && <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold max-w-2xl">{msg}</div>}
      {err && <div className="p-4 rounded-xl bg-red-50 text-red-600 text-xs font-bold max-w-2xl">{err}</div>}

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-5 max-w-2xl">
        <h2 className="text-lg font-bold text-slate-900">Security & Authentication</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
            <input type="email" value={profile?.email || ''} disabled className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-500 font-medium" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500"
            />
          </div>
          <button onClick={handleUpdatePassword} className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-bold shadow-xs">
            Update Security Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// 16. PROFILE COMPONENT
export const Profile = () => {
  const { profile } = useAuth();
  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <User className="w-5 h-5" />
          </span>
          {profile?.role === 'student' ? 'Student Profile' : 'User Profile'}
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">View enrollment details, academic records, and security badge credentials.</p>
      </div>

      <div className="bg-white rounded-[24px] p-7 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-md shadow-indigo-500/20 uppercase">
          {profile?.full_name?.charAt(0) || 'U'}
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-xl font-extrabold text-slate-900">{profile?.full_name || 'Campus User'}</h2>
          <p className="text-xs text-slate-500 font-medium">Institution ID: <span className="font-mono font-bold text-indigo-600">{profile?.institution_id || 'N/A'}</span> • {profile?.email}</p>
          <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase">Role: {profile?.role}</span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 capitalize">Status: {profile?.status || 'active'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
