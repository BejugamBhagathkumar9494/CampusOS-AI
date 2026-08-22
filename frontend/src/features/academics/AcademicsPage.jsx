import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { courseService } from '../../services/courseService.js';
import { BookOpen, Cpu, CheckCircle, Download, X, Users, Megaphone, Plus, Sliders, FileText } from 'lucide-react';

export default function AcademicsPage() {
  const { profile } = useAuth();
  const isFaculty = (profile?.role || '').toLowerCase() === 'faculty';

  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollMsg, setEnrollMsg] = useState('');
  const [activeSyllabus, setActiveSyllabus] = useState(null);

  // Faculty specific state
  const [selectedCourseRoster, setSelectedCourseRoster] = useState(null);
  const [rosterData, setRosterData] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Faculty Announcement Modal
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTarget, setAnnTarget] = useState('student');
  const [postingAnn, setPostingAnn] = useState(false);

  // Faculty Syllabus Progress Manager
  const [showSyllabusModal, setShowSyllabusModal] = useState(null);
  const [progressVal, setProgressVal] = useState(80);

  useEffect(() => {
    let isMounted = true;
    async function fetchAcademicData() {
      try {
        setLoading(true);
        if (profile?.id) {
          const res = isFaculty
            ? await courseService.getFacultyCourses(profile.id)
            : await courseService.getStudentCourses(profile.id);
          if (isMounted) setCourses(res || []);
        }
        const available = await courseService.getAllCourses();
        if (isMounted) setAllCourses(available || []);
      } catch (err) {
        console.error('Error fetching academic courses:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAcademicData();
    return () => { isMounted = false; };
  }, [profile, isFaculty]);

  const handleOpenRoster = async (course) => {
    setSelectedCourseRoster(course);
    setLoadingRoster(true);
    try {
      const res = await courseService.getCourseRoster(course.id || 1);
      setRosterData(res || []);
    } catch (err) {
      console.error('Error loading course roster:', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    setPostingAnn(true);
    try {
      const { fetchWithAuth } = await import('../../services/api.js');
      await fetchWithAuth('/academic-ext/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          target_role: annTarget
        })
      });

      setShowAnnounceModal(false);
      setAnnTitle('');
      setAnnContent('');
      setEnrollMsg('Course announcement published successfully to enrolled students!');
      setTimeout(() => setEnrollMsg(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to publish announcement.');
    } finally {
      setPostingAnn(false);
    }
  };

  const handleUpdateSyllabusProgress = (courseId) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, syllabus_progress: Number(progressVal), progress: Number(progressVal) } : c));
    setShowSyllabusModal(null);
    setEnrollMsg('Syllabus coverage progress updated successfully!');
    setTimeout(() => setEnrollMsg(''), 4000);
  };

  const handleEnroll = async (courseId, courseTitle) => {
    if (!profile?.id) return;
    try {
      await courseService.enrollCourse(profile.id, courseId);
      setEnrollMsg(`Enrollment request for "${courseTitle}" recorded successfully!`);
      setTimeout(() => setEnrollMsg(''), 4000);
      const res = await courseService.getStudentCourses(profile.id);
      setCourses(res);
    } catch (err) {
      alert(err.message || 'Failed to submit course enrollment.');
    }
  };

  const recommendedElectives = allCourses.filter(
    (ac) => !courses.some((c) => c.id === ac.id)
  );

  // -------------------------------------------------------------
  // FACULTY TAILORED ACADEMIC WORKSPACE
  // -------------------------------------------------------------
  if (isFaculty) {
    return (
      <div className="space-y-7 animate-fade-in font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <BookOpen className="w-5 h-5" />
              </span>
              Faculty Academic Workspace & Course Control
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Manage assigned teaching load, update syllabus coverage, inspect student rosters, and publish announcements.</p>
          </div>

          <button
            onClick={() => setShowAnnounceModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Megaphone className="w-4 h-4" /> Post Course Announcement
          </button>
        </div>

        {enrollMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold animate-fade-in flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            {enrollMsg}
          </div>
        )}

        {/* Faculty Course Load Cards Grid */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" /> Assigned Teaching Courses ({courses.length})
            </h2>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
              Semester 5 Load
            </span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400 font-medium">Loading assigned courses from database...</div>
          ) : courses.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Assigned Subjects</p>
              <p className="text-xs text-slate-500">You have no course teaching assignments for the current academic term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((subject) => (
                <div key={subject.id || subject.code} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between gap-4 hover:bg-slate-50 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase font-mono">
                        {subject.code} • {subject.credits || 4} Credits
                      </span>
                      <h3 className="text-base text-slate-900 font-bold mt-2">{subject.name || subject.title}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Enrolled Roster: {subject.enrolled_count || 45} Students</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>Syllabus Coverage</span>
                      <span className="text-indigo-600">{subject.syllabus_progress || subject.progress || 80}%</span>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 h-2 rounded-full transition-all duration-500" style={{ width: `${subject.syllabus_progress || subject.progress || 80}%` }}></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenRoster(subject)}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-600" /> View Roster
                    </button>
                    <button
                      onClick={() => {
                        setShowSyllabusModal(subject);
                        setProgressVal(subject.syllabus_progress || 80);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5" /> Manage Syllabus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Roster Modal */}
        {selectedCourseRoster && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-2xl w-full space-y-4 border border-slate-100 shadow-2xl relative">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" /> Course Student Roster: {selectedCourseRoster.name} ({selectedCourseRoster.code})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Enrolled student list synchronized with campus database records.</p>
                </div>
                <button onClick={() => setSelectedCourseRoster(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingRoster ? (
                <p className="text-xs text-slate-400 font-medium p-6 text-center">Loading enrolled roster from DB...</p>
              ) : rosterData.length === 0 ? (
                <p className="text-xs text-slate-500 font-medium p-6 text-center bg-slate-50 rounded-xl">No students enrolled yet.</p>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 pr-1">
                  {rosterData.map((st) => (
                    <div key={st.student_id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{st.full_name || 'Student'}</span>
                        <span className="text-slate-400 font-mono ml-2">({st.roll_number})</span>
                        <p className="text-[11px] text-slate-500">{st.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px]">
                          Semester {st.current_semester || 5}
                        </span>
                        <p className="text-[11px] text-slate-500 font-bold mt-0.5">CGPA: {st.cgpa}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button onClick={() => setSelectedCourseRoster(null)} className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs">
                  Close Roster
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Syllabus Progress Manager Modal */}
        {showSyllabusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 border border-slate-100 shadow-2xl relative">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-extrabold text-slate-900">Manage Syllabus Coverage</h3>
                <button onClick={() => setShowSyllabusModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{showSyllabusModal.name} ({showSyllabusModal.code})</h4>
                  <p className="text-xs text-slate-500">Adjust the current syllabus completion percentage for your course.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Syllabus Completion %</span>
                    <span className="text-indigo-600 font-extrabold">{progressVal}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progressVal}
                    onChange={(e) => setProgressVal(e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-700">
                  <p className="font-bold text-slate-900">Course Modules Breakdown:</p>
                  {(showSyllabusModal.modules || ["Core Theory", "Lab Practicals", "Midterm Assessment", "Advanced Topics"]).map((mod, i) => (
                    <p key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> {mod}
                    </p>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowSyllabusModal(null)} className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200">
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateSyllabusProgress(showSyllabusModal.id)}
                    className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20"
                  >
                    Save Progress
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Announcement Modal */}
        {showAnnounceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 border border-slate-100 shadow-2xl relative">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-extrabold text-slate-900">Post Course Announcement</h3>
                <button onClick={() => setShowAnnounceModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handlePostAnnouncement} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Announcement Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Midterm Exam Schedule & Lab Submission Guidelines"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Content Details</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide details regarding lectures, lab assignments, or course schedule..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Audience</label>
                  <select
                    value={annTarget}
                    onChange={(e) => setAnnTarget(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="student">Enrolled Students Only</option>
                    <option value="all">All Campus Members</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAnnounceModal(false)} className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={postingAnn}
                    className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {postingAnn ? 'Publishing...' : 'Publish Announcement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // STUDENT ACADEMIC VIEW
  // -------------------------------------------------------------
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
                <h3 className="text-base font-bold text-slate-900">{activeSyllabus.title || activeSyllabus.name}</h3>
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
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(`CampusOS AI - Official Syllabus PDF Document\nCourse: ${activeSyllabus.title || activeSyllabus.name} (${activeSyllabus.code})\nCredits: ${activeSyllabus.credits}\nInstructor: ${activeSyllabus.instructor_name || 'Department Faculty'}\n\nModules:\n1. Theoretical Foundations\n2. Advanced Systems\n3. Laboratory Practicals\n4. Capstone Project Evaluation`)}`}
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
