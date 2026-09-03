import React, { useState } from 'react';
import { X, BookPlus, Sparkles } from 'lucide-react';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    subject_name: string;
    course_code: string;
    semester: number;
    branch: string;
    academic_year: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting
}) => {
  const [subjectName, setSubjectName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [semester, setSemester] = useState(4);
  const [branch, setBranch] = useState('CSE');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      setError('Please enter a subject name (e.g. Database Management Systems).');
      return;
    }
    if (!courseCode.trim()) {
      setError('Please enter a course code (e.g. CS401).');
      return;
    }
    setError('');
    await onSubmit({
      subject_name: subjectName.trim(),
      course_code: courseCode.trim().toUpperCase(),
      semester: Number(semester),
      branch: branch.trim().toUpperCase(),
      academic_year: academicYear.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">New Subject Study Collection</h3>
            <p className="text-xs text-slate-500 font-medium">
              Enter course metadata before uploading multiple PDF notes
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Subject Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Database Management Systems"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Course Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS401"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium uppercase outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium outline-none transition-all bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Branch / Dept
              </label>
              <input
                type="text"
                placeholder="e.g. CSE, ECE, MECH"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium uppercase outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Academic Year
              </label>
              <input
                type="text"
                placeholder="e.g. 2025-2026"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isSubmitting ? 'Creating Collection...' : 'Create & Upload PDFs'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
