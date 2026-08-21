import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { examService } from '../../services/examService.js';
import { courseService } from '../../services/courseService.js';
import { supabase } from '../../services/supabaseClient.js';
import { FileText, Calendar, Plus, Trash2, Sparkles, X } from 'lucide-react';

export default function ExamsPage() {
  const { profile } = useAuth();
  const isFacultyOrAdmin = profile?.role === 'faculty' || profile?.role === 'admin' || profile?.role === 'super_admin';

  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExam, setNewExam] = useState({
    exam_name: 'End-Semester Examination',
    course_id: '',
    exam_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    location: 'Hall A - Main Auditorium',
    total_marks: 100
  });
  const [submitting, setSubmitting] = useState(false);

  async function fetchExamsAndCourses() {
    try {
      const res = await examService.getExams();
      setExams(res);
      const cList = await courseService.getAllCourses();
      setCourses(cList);
      if (cList.length > 0 && !newExam.course_id) {
        setNewExam(prev => ({ ...prev, course_id: cList[0].id }));
      }
    } catch (err) {
      console.error('Error fetching exam schedules:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExamsAndCourses();

    const channel = supabase
      .channel('public:examinations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'examinations' }, () => {
        fetchExamsAndCourses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await examService.createExam(newExam);
      setShowAddModal(false);
      fetchExamsAndCourses();
    } catch (err) {
      alert(err.message || 'Failed to schedule exam.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExam = async (examId, title) => {
    if (!window.confirm(`Are you sure you want to delete exam "${title}" from the timetable?`)) return;
    try {
      await examService.deleteExam(examId);
      fetchExamsAndCourses();
    } catch (err) {
      alert(err.message || 'Failed to delete exam.');
    }
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <FileText className="w-5 h-5" />
            </span>
            Exams & Timetables
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            View upcoming semester timetables, examination halls, and schedule notices synchronized live with Supabase.
          </p>
        </div>

        {isFacultyOrAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Schedule New Exam
          </button>
        )}
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" /> Upcoming Examination Timetable ({exams.length})
        </h2>

        {loading ? (
          <p className="text-xs text-slate-400 font-medium p-4 text-center">Loading exam schedules from database...</p>
        ) : exams.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Examinations Scheduled</p>
            <p className="text-xs text-slate-500">There are currently no active or published end-semester examination timetables.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exams.map((ex, idx) => (
              <div key={ex.id || idx} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-3 hover:bg-slate-50 transition-all relative group">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                    {ex.exam_date ? new Date(ex.exam_date).toLocaleDateString() : 'TBD'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Official</span>
                    {isFacultyOrAdmin && (
                      <button
                        onClick={() => handleDeleteExam(ex.id, ex.exam_name || ex.courses?.title)}
                        title="Delete Exam Schedule"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{ex.exam_name || ex.courses?.title || 'Examination'}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Code: {ex.courses?.code || 'CS'} • Location: {ex.location || 'Exam Hall'}</p>
                </div>

                <div className="text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80 text-center font-mono">
                  10:00 AM - 01:00 PM (Total Marks: {ex.total_marks || 100})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 border border-slate-100 shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Schedule Examination
              </h3>
              <p className="text-xs text-slate-500 mt-1">Publish an examination schedule to the student portal.</p>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Exam Name / Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End-Semester Examination"
                  value={newExam.exam_name}
                  onChange={(e) => setNewExam({ ...newExam, exam_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subject / Course</label>
                <select
                  value={newExam.course_id}
                  onChange={(e) => setNewExam({ ...newExam, course_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Exam Date</label>
                <input
                  type="date"
                  required
                  value={newExam.exam_date}
                  onChange={(e) => setNewExam({ ...newExam, exam_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Hall / Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hall B - Science Block"
                  value={newExam.location}
                  onChange={(e) => setNewExam({ ...newExam, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Scheduling...' : 'Publish Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
