import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { assignmentService } from '../../services/assignmentService.js';
import { courseService } from '../../services/courseService.js';
import { supabase } from '../../services/supabaseClient.js';
import { Upload, CheckCircle2, Plus, Sparkles, X, FileText, Check, Award } from 'lucide-react';

export default function AssignmentsPage() {
  const { profile } = useAuth();
  const isFacultyOrAdmin = profile?.role === 'faculty' || profile?.role === 'admin' || profile?.role === 'super_admin';

  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Student submission state
  const [activeModal, setActiveModal] = useState(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Faculty assignment creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    course_id: '',
    due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    total_points: 100
  });

  // Faculty view submissions state
  const [inspectedSubmissions, setInspectedSubmissions] = useState(null);
  const [submissionList, setSubmissionList] = useState([]);
  const [gradePayload, setGradePayload] = useState({ submissionId: '', marks: 95, feedback: 'Great work!' });

  const fetchAssignmentsAndCourses = async () => {
    try {
      setLoading(true);
      const res = await assignmentService.getAssignments();
      setAssignments(res);
      const cList = await courseService.getAllCourses();
      setCourses(cList);
      if (cList.length > 0 && !newAssignment.course_id) {
        setNewAssignment(prev => ({ ...prev, course_id: cList[0].id }));
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentsAndCourses();

    const channel = supabase
      .channel('public:assignments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
        fetchAssignmentsAndCourses();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignment_submissions' }, () => {
        fetchAssignmentsAndCourses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmitAssignment = async (assignId) => {
    if (!submissionUrl || !profile?.id) return;
    setSubmitting(true);
    try {
      await assignmentService.submitAssignment(assignId, profile.id, submissionUrl);
      setMsg('Assignment submission successfully recorded in database!');
      setActiveModal(null);
      setSubmissionUrl('');
      setTimeout(() => setMsg(''), 4000);
      fetchAssignmentsAndCourses();
    } catch (err) {
      alert(err.message || 'Failed to submit assignment solution.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignment.title.trim()) return;

    try {
      setSubmitting(true);
      await assignmentService.createAssignment(
        newAssignment.course_id,
        newAssignment.title,
        newAssignment.description,
        newAssignment.due_date,
        newAssignment.total_points
      );
      setShowCreateModal(false);
      setNewAssignment({
        title: '',
        description: '',
        course_id: courses[0]?.id || '',
        due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        total_points: 100
      });
      setMsg('New assignment published successfully to students!');
      setTimeout(() => setMsg(''), 4000);
      fetchAssignmentsAndCourses();
    } catch (err) {
      alert(err.message || 'Failed to create assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenSubmissions = async (assignment) => {
    setInspectedSubmissions(assignment);
    try {
      const subs = await assignmentService.getSubmissions(assignment.id);
      setSubmissionList(subs);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  const handleGradeSubmission = async (subId) => {
    try {
      await assignmentService.gradeSubmission(subId, gradePayload.marks, gradePayload.feedback);
      setMsg('Submission graded successfully!');
      setTimeout(() => setMsg(''), 4000);
      if (inspectedSubmissions) {
        const subs = await assignmentService.getSubmissions(inspectedSubmissions.id);
        setSubmissionList(subs);
      }
    } catch (err) {
      alert(err.message || 'Failed to grade submission.');
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Upload className="w-5 h-5" />
            </span>
            Assignments & Submissions
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {isFacultyOrAdmin ? 'Publish course assignments, review student submissions, and log grades live.' : 'Upload solutions, check assignment deadlines, and review grading reports.'}
          </p>
        </div>

        {isFacultyOrAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create New Assignment
          </button>
        )}
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {msg}
        </div>
      )}

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Active Course Assignments ({assignments.length})</h2>
        {loading ? (
          <p className="text-xs text-slate-400 font-medium p-4 text-center">Loading assignments from database...</p>
        ) : assignments.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Assignments Found</p>
            <p className="text-xs text-slate-500">There are currently no active assignment submissions due.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((item) => (
              <div key={item.id} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-all">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                      Due: {new Date(item.due_date || item.deadline).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-bold">{item.courses?.code || 'CS'} • {item.total_points || 100} Points</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5">{item.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{item.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  {isFacultyOrAdmin ? (
                    <button
                      onClick={() => handleOpenSubmissions(item)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" /> View Submissions
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveModal(item.id)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 shrink-0"
                    >
                      <Upload className="w-4 h-4" /> Submit Solution
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 border border-slate-100 shadow-2xl relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Post New Assignment
              </h3>
              <p className="text-xs text-slate-500 mt-1">Publish an assignment to students registered in Supabase.</p>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab 4: Binary Search Trees Implementation"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Course / Subject</label>
                <select
                  value={newAssignment.course_id}
                  onChange={(e) => setNewAssignment({ ...newAssignment, course_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={newAssignment.due_date}
                  onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description / Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Provide instructions or upload link..."
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {inspectedSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full space-y-5 border border-slate-100 shadow-2xl relative">
            <button onClick={() => setInspectedSubmissions(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Student Submissions</h3>
              <p className="text-xs text-slate-500">{inspectedSubmissions.title} • {submissionList.length} Submission(s)</p>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3">
              {submissionList.length === 0 ? (
                <p className="text-xs text-slate-400 p-6 text-center font-medium">No student submissions recorded for this assignment yet.</p>
              ) : (
                submissionList.map(sub => {
                  const studentName = sub.students?.profiles?.full_name || 'Student';
                  const rollNo = sub.students?.roll_number || 'STU-001';

                  return (
                    <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-slate-900">{studentName}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">{rollNo}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          sub.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {sub.status.toUpperCase()}
                        </span>
                      </div>

                      <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:underline block truncate">
                        🔗 {sub.file_url}
                      </a>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                        <input
                          type="number"
                          placeholder="Marks (e.g. 90)"
                          defaultValue={sub.marks || 90}
                          onChange={(e) => setGradePayload({ ...gradePayload, marks: e.target.value })}
                          className="w-24 px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Feedback remarks..."
                          defaultValue={sub.feedback || 'Good solution'}
                          onChange={(e) => setGradePayload({ ...gradePayload, feedback: e.target.value })}
                          className="flex-1 px-3 py-1 rounded-lg border border-slate-200 text-xs"
                        />
                        <button
                          onClick={() => handleGradeSubmission(sub.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                        >
                          Grade
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

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
              <button onClick={() => setActiveModal(null)} className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={() => handleSubmitAssignment(activeModal)} disabled={submitting} className="w-1/2 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md hover:bg-indigo-700 transition-colors">
                {submitting ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
