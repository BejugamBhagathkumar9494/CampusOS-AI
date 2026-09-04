import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { attendanceService } from '../../services/attendanceService';
import { supabase } from '../../services/supabaseClient';
import { 
  Calendar, Check, AlertTriangle, Users, BookOpen, 
  Search, CheckCircle2, XCircle, ShieldCheck, Sparkles, X
} from 'lucide-react';

export default function AttendancePage() {
  const { profile } = useAuth();
  const isFaculty = profile?.role === 'faculty' || profile?.role === 'admin' || profile?.role === 'super_admin';

  if (isFaculty) {
    return <FacultyAttendancePortal profile={profile} />;
  }
  return <StudentAttendanceBoard profile={profile} />;
}

function FacultyAttendancePortal({ profile }: { profile?: any }) {
  const [rosters, setRosters] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentStatuses, setStudentStatuses] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [inspectedStudent, setInspectedStudent] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadFacultyData() {
      try {
        setLoading(true);
        if (profile?.id) {
          const data = await attendanceService.getFacultyCoursesWithStudents(profile.id);
          if (isMounted) {
            setRosters(data);
            if (data.length > 0) {
              setSelectedCourseId(data[0].course_id);
            }
          }
        }
      } catch (err) {
        console.error('Error loading faculty rosters:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadFacultyData();
    return () => { isMounted = false; };
  }, [profile]);

  useEffect(() => {
    let isMounted = true;
    async function loadExistingLogs() {
      if (!selectedCourseId || !selectedDate) return;
      try {
        const logs = await attendanceService.getCourseAttendanceLogsForDate(selectedCourseId, selectedDate);
        if (isMounted) {
          setStudentStatuses(logs);
        }
      } catch (err) {
        console.error('Error fetching logs for date:', err);
      }
    }
    loadExistingLogs();
    return () => { isMounted = false; };
  }, [selectedCourseId, selectedDate]);

  const activeRoster = rosters.find(r => r.course_id === selectedCourseId) || rosters[0];

  const handleStatusChange = (studentId: any, status: string) => {
    setStudentStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status: string) => {
    if (!activeRoster) return;
    const updated = { ...studentStatuses };
    activeRoster.students.forEach((st: any) => {
      updated[st.student_id] = status;
    });
    setStudentStatuses(updated);
  };

  const handleSaveAttendance = async () => {
    if (!activeRoster) return;
    try {
      setSaving(true);
      setFeedback(null);
      const recordsToSubmit = activeRoster.students.map((st: any) => ({
        student_id: st.student_id,
        course_id: activeRoster.course_id,
        date: selectedDate,
        status: studentStatuses[st.student_id] || 'present'
      }));

      await attendanceService.saveFacultyAttendance(recordsToSubmit);

      setFeedback({
        type: 'success',
        message: `Successfully recorded attendance for ${recordsToSubmit.length} students in ${activeRoster.code} on ${selectedDate}.`
      });

      if (profile?.id) {
        const refreshed = await attendanceService.getFacultyCoursesWithStudents(profile.id);
        setRosters(refreshed);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to record attendance to database.'
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = (activeRoster?.students || []).filter((st: any) =>
    (st.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (st.roll_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (st.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = filteredStudents.filter((st: any) => (studentStatuses[st.student_id] || 'present') === 'present' || studentStatuses[st.student_id] === 'late').length;
  const absentCount = filteredStudents.filter((st: any) => studentStatuses[st.student_id] === 'absent').length;
  const totalCount = filteredStudents.length;
  const sessionRate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : '100.0';

  const lowAttendanceStudents = (activeRoster?.students || []).filter((st: any) => st.course_attendance_rate < 75.0);

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C211F] tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FDF2ED] text-[#C85A32] border border-[#EAE3D8]">
              <Users className="w-5 h-5" />
            </span>
            Faculty Attendance Portal
          </h1>
          <p className="text-sm text-[#5E6763] font-medium mt-1">
            Select assigned course, view student profiles, and log daily classroom attendance directly into Supabase.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveAttendance}
            disabled={saving || !activeRoster}
            className="px-5 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-[#C85A32]/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {saving ? 'Saving Records...' : 'Submit & Save Attendance'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs font-bold animate-fade-in flex items-center gap-2.5 ${
          feedback.type === 'success' ? 'bg-[#F0F6F2] text-[#5E8C71] border-[#5E8C71]/30' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#5E8C71] shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white rounded-[24px] p-6 border border-[#EAE3D8] shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#5E6763] uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#C85A32]" /> Select Course Roster
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-[#1C211F] text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C85A32]/20 focus:border-[#C85A32] transition-all"
              >
                {rosters.map((r) => (
                  <option key={r.course_id} value={r.course_id}>
                    {r.code} - {r.title} ({r.students.length} Students)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#5E6763] uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C85A32]" /> Lecture Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-[#1C211F] text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C85A32]/20 focus:border-[#C85A32] transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#F3ECE2]">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#8E9893] absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search by student name or roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-xs font-semibold text-[#1C211F] placeholder:text-[#8E9893] focus:outline-none focus:ring-2 focus:ring-[#C85A32]/20 focus:border-[#C85A32]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleMarkAll('present')}
                className="px-3 py-1.5 rounded-lg bg-[#F0F6F2] hover:bg-[#F0F6F2]/80 text-[#5E8C71] text-xs font-bold transition-all border border-[#5E8C71]/30 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> All Present
              </button>
              <button
                onClick={() => handleMarkAll('absent')}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200 flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" /> All Absent
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-gradient-to-br from-[#FAF7F2] via-[#FDF2ED] to-[#FAF7F2] text-[#1C211F] border border-[#EAE3D8] rounded-[24px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <span className="text-[11px] font-bold text-[#C85A32] uppercase tracking-wider block mb-1">Session Attendance Summary</span>
            <div className="text-3xl font-extrabold text-[#1C211F] tracking-tight">{sessionRate}%</div>
            <p className="text-xs text-[#5E6763] font-medium mt-1">
              {presentCount} Present / {absentCount} Absent out of {totalCount} Students
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs border-t border-[#EAE3D8] mt-3">
            <span className="font-semibold text-[#5E6763]">Course Code:</span>
            <span className="font-mono font-bold text-[#C85A32]">{activeRoster?.code || 'N/A'}</span>
          </div>

          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#C85A32]/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>

      {lowAttendanceStudents.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs font-medium flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold block text-amber-950">AI Attendance Alert ({lowAttendanceStudents.length} Students below 75%)</span>
              <span>The Student Success agent recommends notifying these students to prevent exam eligibility shortage.</span>
            </div>
          </div>
          <div className="flex -space-x-2 shrink-0">
            {lowAttendanceStudents.slice(0, 4).map((st: any, idx: number) => (
              <span key={idx} className="w-7 h-7 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center text-[10px] font-extrabold text-amber-800" title={`${st.full_name} (${st.course_attendance_rate}%)`}>
                {st.full_name.charAt(0)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-[24px] border border-[#EAE3D8] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#EAE3D8] flex justify-between items-center">
          <h2 className="text-lg font-bold text-[#1C211F] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C85A32]" /> Student Attendance Roster ({filteredStudents.length})
          </h2>
          <span className="text-xs font-bold text-[#8E9893]">Click student row to view full profile details</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#8E9893] font-medium">Loading student rosters from database...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#5E6763] font-medium">No student records found matching search filters.</div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#EAE3D8] text-[#5E6763] font-bold text-xs uppercase tracking-wider">
                  <th className="p-4.5 pl-6">Student Information</th>
                  <th className="p-4.5">Roll Number</th>
                  <th className="p-4.5">Department</th>
                  <th className="p-4.5">Course Attendance Rate</th>
                  <th className="p-4.5 pr-6 text-center">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3D8] font-medium">
                {filteredStudents.map((st: any) => {
                  const currentStatus = studentStatuses[st.student_id] || 'present';
                  return (
                    <tr key={st.student_id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="p-4.5 pl-6">
                        <button
                          onClick={() => setInspectedStudent(st)}
                          className="text-left font-bold text-[#C85A32] hover:text-[#B44E27] hover:underline flex flex-col"
                        >
                          <span className="text-sm font-bold text-[#1C211F]">{st.full_name}</span>
                          <span className="text-xs text-[#8E9893] font-normal">{st.email}</span>
                        </button>
                      </td>
                      <td className="p-4.5 font-mono text-xs text-[#1C211F] font-bold">{st.roll_number}</td>
                      <td className="p-4.5 text-xs text-[#5E6763]">{st.department}</td>
                      <td className="p-4.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-[#1C211F] w-12">{st.course_attendance_rate}%</span>
                          <div className="w-24 bg-[#F4EFEA] rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${st.course_attendance_rate >= 75 ? 'bg-[#5E8C71]' : 'bg-[#C85A32]'}`}
                              style={{ width: `${Math.min(100, st.course_attendance_rate)}%` }}
                            />
                          </div>
                          {st.course_attendance_rate < 75 && (
                            <span className="px-2 py-0.5 rounded-md bg-[#FDF2ED] text-[#C85A32] text-[10px] font-extrabold border border-[#EAE3D8]">
                              Shortage
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4.5 pr-6 text-center">
                        <div className="inline-flex rounded-xl bg-[#F4EFEA] p-1 gap-1">
                          <button
                            onClick={() => handleStatusChange(st.student_id, 'present')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === 'present'
                                ? 'bg-[#5E8C71] text-white shadow-xs'
                                : 'text-[#5E6763] hover:text-[#1C211F]'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleStatusChange(st.student_id, 'absent')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === 'absent'
                                ? 'bg-[#C85A32] text-white shadow-xs'
                                : 'text-[#5E6763] hover:text-[#1C211F]'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => handleStatusChange(st.student_id, 'late')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === 'late'
                                ? 'bg-[#D9822B] text-white shadow-xs'
                                : 'text-[#5E6763] hover:text-[#1C211F]'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            onClick={() => handleStatusChange(st.student_id, 'excused')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === 'excused'
                                ? 'bg-[#D9822B] text-white shadow-xs'
                                : 'text-[#5E6763] hover:text-[#1C211F]'
                            }`}
                          >
                            Excused
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {inspectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C211F]/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 border border-[#EAE3D8] shadow-2xl relative">
            <button onClick={() => setInspectedStudent(null)} className="absolute top-4 right-4 text-[#8E9893] hover:text-[#1C211F] p-1">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FDF2ED] text-[#C85A32] flex items-center justify-center font-extrabold text-xl border border-[#EAE3D8]">
                {inspectedStudent.full_name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1C211F]">{inspectedStudent.full_name}</h3>
                <p className="text-xs text-[#5E6763] font-medium">{inspectedStudent.email}</p>
                <span className="inline-block mt-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-[#FDF2ED] text-[#C85A32] border border-[#EAE3D8] font-mono">
                  {inspectedStudent.roll_number}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#F4EFEA] border border-[#EAE3D8]">
                <span className="text-[10px] font-bold text-[#8E9893] uppercase tracking-wider block">Department</span>
                <span className="text-xs font-bold text-[#1C211F]">{inspectedStudent.department}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F4EFEA] border border-[#EAE3D8]">
                <span className="text-[10px] font-bold text-[#8E9893] uppercase tracking-wider block">Current CGPA</span>
                <span className="text-xs font-bold text-[#5E8C71]">{inspectedStudent.cgpa}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F4EFEA] border border-[#EAE3D8]">
                <span className="text-[10px] font-bold text-[#8E9893] uppercase tracking-wider block">Logged Classes</span>
                <span className="text-xs font-bold text-[#1C211F]">{inspectedStudent.course_total_classes} Sessions</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F4EFEA] border border-[#EAE3D8]">
                <span className="text-[10px] font-bold text-[#8E9893] uppercase tracking-wider block">Course Attendance Rate</span>
                <span className={`text-xs font-bold ${inspectedStudent.course_attendance_rate >= 75 ? 'text-[#5E8C71]' : 'text-[#C85A32]'}`}>
                  {inspectedStudent.course_attendance_rate}%
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setInspectedStudent(null)}
                className="w-full py-2.5 rounded-xl bg-[#1C211F] text-white font-bold text-xs hover:bg-[#2D3330] transition-colors"
              >
                Close Student Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentAttendanceBoard({ profile }: { profile?: any }) {
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
        console.error('Error fetching student attendance:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAttendance();

    // 1. Real-time Supabase attendance listener
    let channel: any;
    try {
      channel = supabase
        .channel('public:attendance_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
          loadAttendance();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription warning:', e);
    }

    // 2. Fast heartbeat interval to guarantee live sync across browser sessions
    const intervalId = setInterval(loadAttendance, 3000);

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, [profile]);

  const pred = attendanceData?.prediction;

  return (
    <div className="space-y-7 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C211F] tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#F0F6F2] text-[#5E8C71] border border-[#EAE3D8]">
              <Calendar className="w-5 h-5" />
            </span>
            Student Attendance Monitor
          </h1>
          <p className="text-sm text-[#5E6763] font-medium mt-1">
            Real-time database attendance tracking & ML shortage forecasting model.
          </p>
        </div>

        {attendanceData && (
          <div className="px-5 py-3 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs flex items-center gap-4">
            <div>
              <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider block">Overall Rate</span>
              <span className={`text-2xl font-extrabold ${attendanceData.overall_rate >= 75 ? 'text-[#5E8C71]' : 'text-[#C85A32]'}`}>
                {attendanceData.overall_rate}%
              </span>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm ${
              attendanceData.overall_rate >= 75 ? 'bg-[#F0F6F2] text-[#5E8C71]' : 'bg-[#FDF2ED] text-[#C85A32]'
            }`}>
              {attendanceData.overall_rate >= 75 ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
          </div>
        )}
      </div>

      {pred && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 bg-gradient-to-r from-[#1C211F] via-[#2D3330] to-[#1C211F] text-white rounded-[24px] p-6 shadow-md space-y-4 relative overflow-hidden border border-[#EAE3D8]">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#C85A32]/20 text-[#FAF0E9] text-xs font-bold border border-[#C85A32]/30 inline-flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#C85A32]" /> ML Attendance Predictor Engine
                </span>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Shortage Prevention & Target Buffer Analysis
                </h2>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                pred.shortage_risk ? 'bg-[#C85A32]/20 text-[#FDF2ED] border border-[#C85A32]/30' : 'bg-[#5E8C71]/20 text-[#F0F6F2] border border-[#5E8C71]/30'
              }`}>
                {pred.shortage_risk ? 'Shortage Warning' : 'Attendance Safe'}
              </span>
            </div>

            <p className="text-xs text-[#FAF7F2]/80 font-medium leading-relaxed max-w-xl">
              {pred.recommendation}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-[#8E9893] uppercase tracking-wider block">Forecasted Rate</span>
                <span className="text-lg font-extrabold text-[#FAF7F2]">{pred.predicted_attendance}%</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-[#8E9893] uppercase tracking-wider block">Required Future Classes</span>
                <span className="text-lg font-extrabold text-[#D9822B]">{pred.required_future_classes} Sessions</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-[#8E9893] uppercase tracking-wider block">Allowable Margin Absences</span>
                <span className="text-lg font-extrabold text-[#5E8C71]">{pred.margin_absences_allowed} Sessions</span>
              </div>
            </div>

            <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#C85A32]/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          <div className="lg:col-span-4 bg-white rounded-[24px] p-6 border border-[#EAE3D8] shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1C211F] flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-[#5E8C71]" /> Academic Eligibility Threshold
              </h3>
              <p className="text-xs text-[#5E6763] font-medium leading-relaxed">
                As per university academic regulations, a minimum of 75.0% attendance is mandatory to sit for end-semester examinations.
              </p>
            </div>

            <div className="pt-4 border-t border-[#EAE3D8] space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#5E6763]">Target Threshold:</span>
                <span className="text-[#C85A32]">75.0%</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#5E6763]">Condonation Buffer:</span>
                <span className="text-[#1C211F]">65.0% - 74.9%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[24px] border border-[#EAE3D8] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#EAE3D8] flex justify-between items-center">
          <h2 className="text-lg font-bold text-[#1C211F]">Subject Breakdown & Target Buffer</h2>
          <span className="text-xs font-bold text-[#C85A32]">Minimum Threshold: 75.0%</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#8E9893] font-medium">Loading live attendance records...</div>
          ) : !attendanceData?.subjects || attendanceData.subjects.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5E6763] font-medium">No attendance records logged for your courses yet.</div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#EAE3D8] text-[#5E6763] font-bold text-xs uppercase tracking-wider">
                  <th className="p-4.5 pl-6">Subject</th>
                  <th className="p-4.5">Total Classes</th>
                  <th className="p-4.5">Attended</th>
                  <th className="p-4.5">Attendance Rate</th>
                  <th className="p-4.5">Target Requirement</th>
                  <th className="p-4.5 pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3D8] font-medium">
                {attendanceData.subjects.map((sub: any) => (
                  <tr key={sub.subject_code || sub.subject_name} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="p-4.5 pl-6 font-bold text-[#1C211F]">
                      {sub.subject_name} <span className="text-xs text-[#8E9893] font-semibold font-mono">({sub.subject_code})</span>
                    </td>
                    <td className="p-4.5 text-[#5E6763]">{sub.total_classes}</td>
                    <td className="p-4.5 text-[#5E6763]">{sub.attended_classes}</td>
                    <td className="p-4.5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[#1C211F] w-12">{sub.attendance_rate}%</span>
                        <div className="w-28 bg-[#F4EFEA] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${sub.attendance_rate >= 75 ? 'bg-[#5E8C71]' : 'bg-[#C85A32]'}`}
                            style={{ width: `${Math.min(100, sub.attendance_rate)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4.5 text-xs font-semibold">
                      {sub.attendance_rate >= 75 ? (
                        <span className="text-[#5E8C71]">Can miss up to {sub.margin_absences_allowed} class{sub.margin_absences_allowed !== 1 ? 'es' : ''}</span>
                      ) : (
                        <span className="text-[#D9822B] font-bold">Must attend next {sub.required_future_classes} class{sub.required_future_classes !== 1 ? 'es' : ''}</span>
                      )}
                    </td>
                    <td className="p-4.5 pr-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        sub.status === 'Safe' ? 'bg-[#F0F6F2] text-[#5E8C71] border-[#5E8C71]/30' : 'bg-[#FDF2ED] text-[#C85A32] border-[#C85A32]/30'
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
}
