import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { assignmentService } from '../../services/assignmentService';
import { Assignment } from '../../types/database';
import { Upload, CheckCircle2 } from 'lucide-react';

export default function AssignmentsPage() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
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
      setMsg('Assignment submission successfully recorded in database!');
      setActiveModal(null);
      setSubmissionUrl('');
      setTimeout(() => setMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit assignment solution.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {msg}
        </div>
      )}

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Pending & Upcoming Tasks</h2>
        {loading ? (
          <p className="text-xs text-slate-400 font-medium p-4 text-center">Loading assignments from database...</p>
        ) : assignments.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Pending Assignments</p>
            <p className="text-xs text-slate-500">You have no active assignment submissions due at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((item: any) => (
              <div key={item.id} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                      Deadline: {new Date(item.due_date || item.deadline).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{item.courses?.code || 'CS'}</span>
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
