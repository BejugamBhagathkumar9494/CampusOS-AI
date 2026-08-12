import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { attendanceService } from '../../services/attendanceService';
import { Calendar, Check } from 'lucide-react';

export default function AttendancePage() {
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
        console.error('Error fetching attendance from database:', err);
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
          <span className="text-xs font-bold text-indigo-600">Minimum Threshold: 75.0%</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">Loading live attendance records...</div>
          ) : !attendanceData?.subjects || attendanceData.subjects.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium">No attendance records logged for your courses yet.</div>
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
                {attendanceData.subjects.map((sub: any) => (
                  <tr key={sub.subject_code || sub.subject_name} className="hover:bg-slate-50/50 transition-colors">
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
}
