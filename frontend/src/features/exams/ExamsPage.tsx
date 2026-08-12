import { useState, useEffect } from 'react';
import { examService } from '../../services/examService';
import { Examination } from '../../types/database';
import { FileText, Calendar } from 'lucide-react';

export default function ExamsPage() {
  const [exams, setExams] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examService.getExams()
      .then((res) => setExams(res))
      .catch((err) => console.error('Error fetching exams from database:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <FileText className="w-5 h-5" />
          </span>
          Exams & Timetables
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">View upcoming semester timetables, examination halls, and schedule notices.</p>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Upcoming Examination Timetable</h2>
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
            {exams.map((ex: any, idx) => (
              <div key={ex.id || idx} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-3 hover:bg-slate-50 transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    {ex.exam_date ? new Date(ex.exam_date).toLocaleDateString() : 'TBD'}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Official</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{ex.exam_name || ex.courses?.title || 'Examination'}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Code: {ex.courses?.code || 'CS'} • Location: {ex.location || 'Exam Hall'}</p>
                </div>
                <div className="text-xs font-semibold text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 text-center font-mono">
                  10:00 AM - 01:00 PM
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
