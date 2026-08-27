import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { assignmentService } from '../../services/assignmentService';
import { courseService } from '../../services/courseService';
import { supabase } from '../../services/supabaseClient';
import { Upload, CheckCircle2, Plus, Sparkles, X, FileText, Check, Award, MessageSquare } from 'lucide-react';

export default function AssignmentsPage() {
  const { profile } = useAuth();
  const roleLower = (profile?.role || '').toLowerCase();
  const isFacultyOrAdmin = ['faculty', 'admin', 'super_admin'].includes(roleLower);

  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Student submission state
  const [activeModal, setActiveModal] = useState<any>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Faculty assignment creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState<any>({
    title: '',
    description: '',
    course_id: '',
    due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    total_points: 100
  });

  // Faculty view submissions state
  const [inspectedSubmissions, setInspectedSubmissions] = useState<any>(null);
  const [submissionList, setSubmissionList] = useState<any[]>([]);
  const [gradeInputs, setGradeInputs] = useState<Record<string, any>>({});

  const fetchAssignmentsAndSubmissions = async () => {
    try {
      setLoading(true);
      const res = await assignmentService.getAssignments();
      setAssignments(res || []);
      const cList = await courseService.getAllCourses();
      setCourses(cList || []);
      if (cList.length > 0 && !newAssignment.course_id) {
        setNewAssignment((prev: any) => ({ ...prev, course_id: cList[0].id }));
      }

      if (profile?.id && !isFacultyOrAdmin) {
        const uSubs = await assignmentService.getUserSubmissions(profile.id);
        setUserSubmissions(uSubs || []);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentsAndSubmissions();

    const channel = supabase
      .channel('public:assignments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
        fetchAssignmentsAndSubmissions();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignment_submissions' }, () => {
        fetchAssignmentsAndSubmissions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const handleStudentSubmit = async (e: React.FormEvent, assignId: any) => {
    e.preventDefault();
    if (!submissionUrl.trim() || !profile?.id) return;
    setSubmitting(true);
    try {
      await assignmentService.submitAssignment(assignId, profile.id, submissionUrl);
      setMsg('Assignment submission successfully recorded in database!');
      setActiveModal(null);
      setSubmissionUrl('');
      setTimeout(() => setMsg(''), 5000);
      fetchAssignmentsAndSubmissions();
    } catch (err: any) {
      alert(err.message || 'Failed to submit assignment solution.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
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
      setTimeout(() => setMsg(''), 5000);
      fetchAssignmentsAndSubmissions();
    } catch (err: any) {
      alert(err.message || 'Failed to create assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenSubmissions = async (assignment: any) => {
    setInspectedSubmissions(assignment);
    try {
      const subs = await assignmentService.getSubmissions(assignment.id);
      setSubmissionList(subs || []);
      const initGrades: Record<string, any> = {};
      (subs || []).forEach((s: any) => {
        initGrades[s.id] = {
          marks: s.marks || s.marks_obtained || 90,
          feedback: s.feedback || 'Good work!'
        };
      });
      setGradeInputs(initGrades);
    } catch (err: any) {
      console.error('Error fetching submissions:', err);
    }
  };

  const handleGradeSubmission = async (subId: any, targetProfileId: any) => {
    const input = gradeInputs[subId] || { marks: 90, feedback: 'Good work!' };
    try {
      await assignmentService.gradeSubmission(
        subId,
        input.marks,
        input.feedback,
        targetProfileId,
        inspectedSubmissions?.title
      );
      setMsg('Submission score & faculty feedback saved directly to database!');
      setTimeout(() => setMsg(''), 5000);
      if (inspectedSubmissions) {
        const subs = await assignmentService.getSubmissions(inspectedSubmissions.id);
        setSubmissionList(subs || []);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to grade submission.');
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Upload className="w-5 h-5" />
            </span>
            Assignments & Evaluations
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {isFacultyOrAdmin ? 'Publish course assignments, evaluate student submissions in DB, and log scores live.' : 'Upload solutions, track submission status, and review faculty scores & feedback.'}
          </p>
        </div>

        {isFacultyOrAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 active:scale-95"
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

      {/* Main Assignment List */}
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
            {assignments.map((item) => {
              const mySub = userSubmissions.find(s => s.assignment_id === item.id || s.assignment?.id === item.id);
              const isGraded = mySub && (mySub.status?.toLowerCase() === 'graded');

              return (
                <div key={item.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-all">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                        Due: {new Date(item.due_date || item.deadline).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-slate-500 font-mono font-bold">{item.courses?.code || 'CS'} • {item.total_points || 100} Total Points</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{item.description}</p>

                    {/* Student Evaluated Score & Feedback Display */}
                    {!isFacultyOrAdmin && mySub && (
                      <div className="mt-3 p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${
                            isGraded ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {isGraded ? 'Graded & Evaluated' : 'Submitted • Pending Faculty Evaluation'}
                          </span>
                          {isGraded && (
                            <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" /> Score: {mySub.marks || mySub.marks_obtained} / {item.total_points || 100}
                            </span>
                          )}
                        </div>

                        {mySub.file_url && (
                          <p className="text-xs text-slate-600 font-mono truncate">
                            <span className="font-bold">Submission URL:</span> {mySub.file_url}
                          </p>
                        )}

                        {isGraded && mySub.feedback && (
                          <div className="pt-1 border-t border-slate-100 flex items-start gap-1.5 text-xs text-slate-700">
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                            <p><span className="font-bold text-slate-900">Faculty Remarks:</span> "{mySub.feedback}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isFacultyOrAdmin ? (
                      <button
                        onClick={() => handleOpenSubmissions(item)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" /> View & Grade Submissions
                      </button>
                    ) : !mySub ? (
                      <button
                        onClick={() => setActiveModal(item.id)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 shrink-0 active:scale-95"
                      >
                        <Upload className="w-4 h-4" /> Submit Solution
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveModal(item.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                      >
                        Resubmit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Faculty Assignment Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 border border-slate-100 shadow-2xl relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Post New Course Assignment
              </h3>
              <p className="text-xs text-slate-500 mt-1">Publish an assignment to students registered in DB.</p>
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
                    <option key={c.id} value={c.id}>{c.code} - {c.title || c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-xs font-bold text-slate-700 block mb-1">Total Points</label>
                  <input
                    type="number"
                    min={10}
                    value={newAssignment.total_points}
                    onChange={(e) => setNewAssignment({ ...newAssignment, total_points: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description / Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Provide instructions or problem specification..."
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

      {/* Faculty Submissions Inspection & Evaluation Modal */}
      {inspectedSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full space-y-5 border border-slate-100 shadow-2xl relative">
            <button onClick={() => setInspectedSubmissions(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" /> Evaluate Student Submissions
              </h3>
              <p className="text-xs text-slate-500">{inspectedSubmissions.title} • Total Points: {inspectedSubmissions.total_points || 100} • {submissionList.length} Submission(s)</p>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {submissionList.length === 0 ? (
                <p className="text-xs text-slate-400 p-6 text-center font-medium bg-slate-50 rounded-xl">No student submissions recorded for this assignment yet.</p>
              ) : (
                submissionList.map(sub => {
                  const studentName = sub.students?.profiles?.full_name || 'Student';
                  const rollNo = sub.students?.roll_number || 'STU-001';
                  const currentInput = gradeInputs[sub.id] || { marks: sub.marks || sub.marks_obtained || 90, feedback: sub.feedback || 'Good solution' };

                  return (
                    <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-slate-900">{studentName}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">{rollNo}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          sub.status?.toLowerCase() === 'graded' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {sub.status ? sub.status.toUpperCase() : 'SUBMITTED'}
                        </span>
                      </div>

                      <a href={sub.file_url || sub.file_path} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:underline block truncate">
                        🔗 {sub.file_url || sub.file_path || 'https://github.com/student/repo'}
                      </a>

                      <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-200/60">
                        <div className="w-full sm:w-32">
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Marks Obtained</label>
                          <input
                            type="number"
                            max={inspectedSubmissions.total_points || 100}
                            placeholder="Marks (e.g. 90)"
                            value={currentInput.marks}
                            onChange={(e) => setGradeInputs({
                              ...gradeInputs,
                              [sub.id]: { ...currentInput, marks: e.target.value }
                            })}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-none"
                          />
                        </div>

                        <div className="flex-1 w-full">
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Faculty Feedback Remarks</label>
                          <input
                            type="text"
                            placeholder="Feedback remarks..."
                            value={currentInput.feedback}
                            onChange={(e) => setGradeInputs({
                              ...gradeInputs,
                              [sub.id]: { ...currentInput, feedback: e.target.value }
                            })}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                          />
                        </div>

                        <button
                          onClick={() => handleGradeSubmission(sub.id, sub.students?.profile_id)}
                          className="w-full sm:w-auto px-4 py-2 mt-4 sm:mt-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Save Evaluation
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

      {/* Student Solution Submission Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900">Upload Assignment Solution</h3>
              <p className="text-xs text-slate-500">Provide GitHub repo URL or file storage link to submit your work for faculty evaluation.</p>
            </div>

            <input
              type="text"
              value={submissionUrl}
              onChange={(e) => setSubmissionUrl(e.target.value)}
              placeholder="e.g. https://github.com/username/assignment-solution"
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-indigo-500 bg-slate-50"
            />

            <div className="flex gap-3 pt-2">
              <button onClick={() => setActiveModal(null)} className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={(e) => handleStudentSubmit(e, activeModal.id)} disabled={submitting} className="w-1/2 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md hover:bg-indigo-700 transition-colors">
                {submitting ? 'Submitting...' : 'Submit Solution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
