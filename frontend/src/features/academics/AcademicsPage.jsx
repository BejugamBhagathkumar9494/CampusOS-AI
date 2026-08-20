import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { courseService } from '../../services/courseService.js';
import { BookOpen, Cpu, CheckCircle, Download, X } from 'lucide-react';

export default function AcademicsPage() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollMsg, setEnrollMsg] = useState('');
  const [activeSyllabus, setActiveSyllabus] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchAcademicData() {
      try {
        setLoading(true);
        if (profile?.id) {
          const res = profile.role === 'faculty'
            ? await courseService.getFacultyCourses(profile.id)
            : await courseService.getStudentCourses(profile.id);
          if (isMounted) setCourses(res);
        }
        const available = await courseService.getAllCourses();
        if (isMounted) setAllCourses(available);
      } catch (err) {
        console.error('Error fetching academic courses:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAcademicData();
    return () => { isMounted = false; };
  }, [profile]);

  const handleEnroll = async (courseId, courseTitle) => {
    if (!profile?.id) return;
    try {
      await courseService.enrollCourse(profile.id, courseId);
      setEnrollMsg(`Enrollment request for "${courseTitle}" recorded successfully!`);
      setTimeout(() => setEnrollMsg(''), 4000);
      const res = profile.role === 'faculty'
        ? await courseService.getFacultyCourses(profile.id)
        : await courseService.getStudentCourses(profile.id);
      setCourses(res);
    } catch (err) {
      alert(err.message || 'Failed to submit course enrollment.');
    }
  };

  const recommendedElectives = allCourses.filter(
    (ac) => !courses.some((c) => c.id === ac.id)
  );

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
          <span className="text-xs font-bold text-slate-700">Institution ID • {profile?.institution_id || profile?.id?.slice(0, 8) || 'STUDENT'}</span>
        </div>
      </div>

      {enrollMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {enrollMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" /> Current Enrolled Subjects ({courses.length})
          </h2>
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400 font-medium">Loading courses from database...</div>
          ) : courses.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Enrolled Courses</p>
              <p className="text-xs text-slate-500">You are not currently registered for any academic courses this semester.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((subject) => (
                <div key={subject.id || subject.code} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 flex flex-col justify-between gap-3 hover:bg-slate-50 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {subject.code} • {subject.credits || 4} Credits
                      </span>
                      <h3 className="text-base text-slate-900 font-bold mt-1.5">{subject.title || subject.name}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Instructor: {subject.instructor_name || 'Faculty Member'}</p>
                    </div>
                    <button
                      onClick={() => setActiveSyllabus(subject)}
                      className="text-xs font-bold text-indigo-600 bg-white border border-indigo-100 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      Syllabus PDF
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                      <span>Syllabus Completion</span>
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
            <Cpu className="w-5 h-5 text-indigo-600" /> Available Electives & Recommendations
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Based on your academic curriculum track and industry placement dataset requirements:
          </p>

          {recommendedElectives.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 font-medium">
              You are enrolled in all available campus courses!
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedElectives.map((ele, idx) => (
                <div key={ele.id} className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-900">{ele.title}</h3>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {96 - idx * 5}% Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Code: {ele.code} • {ele.credits} Credits • Offered by {ele.instructor_name || 'Academic Dept'}
                  </p>
                  <button
                    onClick={() => handleEnroll(ele.id, ele.title)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Request Enrollment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeSyllabus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 border border-slate-200 shadow-2xl relative">
            <button onClick={() => setActiveSyllabus(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{activeSyllabus.title}</h3>
                <p className="text-xs text-slate-500 font-mono">Course Code: {activeSyllabus.code} • Credits: {activeSyllabus.credits}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 max-h-60 overflow-y-auto">
              <p className="font-bold text-slate-900 uppercase tracking-wide text-[10px]">Official Course Overview & Curriculum Breakdown</p>
              <p>Module 1: Fundamental Concepts & Theoretical Foundations</p>
              <p>Module 2: Advanced Data Architectures & System Specifications</p>
              <p>Module 3: Practical Implementation, Lab Problem Sets, & Case Studies</p>
              <p>Module 4: Industry Applications & Comprehensive Project Evaluation</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setActiveSyllabus(null)} className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors">
                Close Preview
              </button>
              <a
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(`CampusOS AI - Official Syllabus PDF Document\nCourse: ${activeSyllabus.title} (${activeSyllabus.code})\nCredits: ${activeSyllabus.credits}\nInstructor: ${activeSyllabus.instructor_name || 'Department Faculty'}\n\nModules:\n1. Theoretical Foundations\n2. Advanced Systems\n3. Laboratory Practicals\n4. Capstone Project Evaluation`)}`}
                download={`${activeSyllabus.code}_Syllabus.txt`}
                className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download Document
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
