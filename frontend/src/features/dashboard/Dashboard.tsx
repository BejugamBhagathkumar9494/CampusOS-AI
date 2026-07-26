import { useState, useEffect } from 'react'
import { Sparkles, Calendar, BookOpen, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { getStudentProfile, getStudentAttendance } from '../../services/api'

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [attendance, setAttendance] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const prof = await getStudentProfile()
        setProfile(prof)
        const att = await getStudentAttendance(prof.id)
        setAttendance(att)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      }
    }
    loadData()
  }, [])

  const recommendations = [
    "Your attendance in 'Automata Theory' is at 74%. Attend tomorrow's session to cross the 75% threshold.",
    "Academic risk model predicts upcoming mid-terms for 'Discrete Math' may be difficult. Generate a practice quiz.",
    "TCS Placement drive has opened. Your placement readiness is 78.5%. Apply soon.",
  ]

  const classes = [
    { name: 'Automata Theory', time: '09:00 AM - 10:00 AM', room: 'LHC-201', professor: 'Dr. Sarah Jenkins' },
    { name: 'Computer Networks', time: '10:15 AM - 11:15 AM', room: 'LHC-104', professor: 'Prof. Alan Vance' },
    { name: 'Database Management Systems', time: '11:30 AM - 12:30 PM', room: 'Lab-3', professor: 'Dr. Emily Stone' },
  ]

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 p-7 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Welcome back, <span className="gradient-text">{profile ? profile.user.full_name : 'John Doe'}</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
              CampusOS AI has analyzed your academics, hostel status, and placement goals. Here are your personalized recommendations.
            </p>
          </div>
          <div className="flex gap-2.5">
            <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              GPA: {profile ? profile.cgpa : '8.42'}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Semester {profile ? (profile.current_semester === 5 ? 'V' : profile.current_semester) : 'V'}
            </span>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Attendance</span>
            <Calendar className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">{attendance ? `${attendance.overall_rate}%` : '87.5%'}</p>

          <span className="text-xs font-semibold text-emerald-400">Above minimum requirement</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Placement Readiness</span>
            <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">78.5%</p>
          <span className="text-xs font-semibold text-indigo-400">Top 15% of your class</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Library Dues</span>
            <BookOpen className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">0 Books</p>
          <span className="text-xs font-semibold text-slate-400">No active fines</span>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">Hostel Complaints</span>
            <AlertTriangle className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">1 Open</p>
          <span className="text-xs font-semibold text-yellow-400">AI Priority: Medium</span>
        </div>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {/* Weekly recommendations */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> AI Insights & Actions
            </h2>
          </div>
          <div className="space-y-3.5">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-5 flex gap-3.5 items-start border-l-4 border-l-indigo-500">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-sm font-bold">
                  {idx + 1}
                </span>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" /> Today's Schedule
            </h2>
          </div>
          <div className="space-y-3.5">
            {classes.map((cls, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm sm:text-base font-bold text-white">{cls.name}</h3>
                  <span className="text-[11px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    {cls.room}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">{cls.professor}</p>
                <div className="flex justify-between items-center text-xs text-slate-400 pt-1.5 border-t border-slate-800/60">
                  <span className="font-mono">{cls.time}</span>
                  <span className="text-indigo-400 font-semibold flex items-center gap-1 cursor-pointer hover:underline">
                    View Notes <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
