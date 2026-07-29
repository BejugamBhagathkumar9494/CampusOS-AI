import { useState, useEffect } from 'react'
import {
  predictPlacementReadiness,
  getPlacementAnalytics,
  getRecruitingCompanies,
  reviewResume,
  searchLibraryBooks,
  getHostelComplaints,
  fileHostelComplaint,
  getTransportRoutes,
  getFeeDetails,
  getScholarships,
  getAdminAnalytics,
  getStudentAttendance
} from '../services/api'
import {
  BookOpen, Upload, Landmark, Bus, Info, Cpu, Award, Briefcase, TrendingUp, CheckCircle, Search, FileText
} from 'lucide-react'

// Academics Component
export const Academics = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-3xl font-bold text-white mb-1">Academics</h1>
      <p className="text-sm text-slate-300 font-medium">Manage courses, syllabi, and AI study planners.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-indigo-400" /> Current Enrolled Subjects
        </h2>
        <div className="space-y-3">
          {[
            { code: 'CS301', name: 'Automata & Formal Languages', credits: 4 },
            { code: 'CS302', name: 'Computer Networks & Protocols', credits: 4 },
            { code: 'CS303', name: 'Database Management Systems', credits: 4 }
          ].map((subject) => (
            <div key={subject.code} className="flex justify-between items-center p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-indigo-400">{subject.code} • {subject.credits} Credits</span>
                <h3 className="text-base text-slate-200 font-bold mt-0.5">{subject.name}</h3>
              </div>
              <span className="text-sm text-indigo-400 font-semibold cursor-pointer hover:underline">Syllabus PDF</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
          <Cpu className="w-6 h-6 text-indigo-400" /> AI Elective Recommender
        </h2>
        <p className="text-sm text-slate-300">Based on your academic performance and interest in AI & Systems:</p>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
            <h3 className="text-base font-bold text-white">Natural Language Processing & LLMs</h3>
            <p className="text-xs text-slate-400 mt-1">96% recommendation match • High placement signal in 2026 data.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
            <h3 className="text-base font-bold text-white">Distributed Systems & Cloud Architecture</h3>
            <p className="text-xs text-slate-400 mt-1">88% recommendation match • Highly demanded by tech recruiters.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Attendance Component with Live Data
export const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState<any>(null)

  useEffect(() => {
    getStudentAttendance(1)
      .then(data => setAttendanceData(data))
      .catch(() => {
        setAttendanceData({
          overall_rate: 85.0,
          subjects: [
            { subject_name: 'Automata Theory', subject_code: 'CS301', total_classes: 32, attended_classes: 24, attendance_rate: 75.0, status: 'Safe' },
            { subject_name: 'Computer Networks', subject_code: 'CS302', total_classes: 34, attended_classes: 31, attendance_rate: 91.2, status: 'Safe' },
            { subject_name: 'Database Management Systems', subject_code: 'CS303', total_classes: 30, attended_classes: 27, attendance_rate: 90.0, status: 'Safe' }
          ]
        })
      })
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Attendance Monitor</h1>
          <p className="text-sm text-slate-300 font-medium">Track subject attendance rates and predictive shortage alerts.</p>
        </div>
        {attendanceData && (
          <div className="px-4 py-2 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-right">
            <span className="text-xs text-slate-400">Overall Attendance</span>
            <div className="text-2xl font-extrabold text-indigo-400">{attendanceData.overall_rate}%</div>
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-left border-collapse text-base">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold">
              <th className="p-4.5">Subject</th>
              <th className="p-4.5">Total Classes</th>
              <th className="p-4.5">Attended</th>
              <th className="p-4.5">Percentage</th>
              <th className="p-4.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {(attendanceData?.subjects || []).map((sub: any) => (
              <tr key={sub.subject_name} className="hover:bg-slate-900/30">
                <td className="p-4.5 font-semibold text-white">
                  {sub.subject_name} <span className="text-xs text-slate-500 font-mono">({sub.subject_code})</span>
                </td>
                <td className="p-4.5 text-slate-300">{sub.total_classes}</td>
                <td className="p-4.5 text-slate-300">{sub.attended_classes}</td>
                <td className="p-4.5 text-slate-300 font-mono">{sub.attendance_rate}%</td>
                <td className="p-4.5">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    sub.status === 'Safe' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {sub.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Exams Component
export const Exams = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-3xl font-bold text-white mb-1">Exams & Evaluations</h1>
      <p className="text-sm text-slate-300 font-medium">View schedules, historical score breakdowns, and internal grade predictions.</p>
    </div>
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Upcoming End Semester Timetable</h2>
      <div className="space-y-4">
        {[
          { date: 'Nov 12, 2026', code: 'CS301', name: 'Automata Theory', time: '10:00 AM - 01:00 PM', hall: 'Hall 4B' },
          { date: 'Nov 14, 2026', code: 'CS302', name: 'Computer Networks', time: '10:00 AM - 01:00 PM', hall: 'Hall 2A' },
          { date: 'Nov 17, 2026', code: 'CS303', name: 'Database Management Systems', time: '10:00 AM - 01:00 PM', hall: 'Hall 3C' },
        ].map((ex) => (
          <div key={ex.code} className="flex justify-between items-center p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-indigo-400">{ex.date} • Location: {ex.hall}</span>
              <h3 className="text-base font-bold text-white mt-0.5">{ex.name} ({ex.code})</h3>
            </div>
            <span className="text-sm text-slate-300 font-mono bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700">{ex.time}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// Assignments Component
export const Assignments = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-3xl font-bold text-white mb-1">Assignments</h1>
      <p className="text-sm text-slate-300 font-medium">Upload reports, submit lab code, and view automated feedback.</p>
    </div>
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <h2 className="text-xl font-bold text-white">Pending Assignments</h2>
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-white">OS Lab: Thread Scheduling & Synchronization</h3>
            <p className="text-sm text-red-400 font-semibold mt-1">Due in 2 days (Oct 31, 2026)</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all">
            <Upload className="w-4 h-4" /> Submit Solution
          </button>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-white">DBMS Project: B+ Tree Index Implementation</h3>
            <p className="text-sm text-slate-400 font-medium mt-1">Due in 6 days (Nov 04, 2026)</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-all">
            <Upload className="w-4 h-4" /> Submit Solution
          </button>
        </div>
      </div>
    </div>
  </div>
)

// Library Component with Live Search API
export const Library = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    try {
      const res = await searchLibraryBooks(query)
      setResults(res.results || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleSearch()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Library Knowledge Base</h1>
        <p className="text-sm text-slate-300 font-medium">Search reference books, research papers, and available university copies.</p>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search titles, authors, or subjects (e.g. 'Algorithms', 'Networks')..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-base text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button onClick={handleSearch} disabled={loading} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-base text-white font-semibold transition-all">
          {loading ? 'Searching...' : 'Search Library'}
        </button>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Available Books ({results.length})</h2>
        <div className="space-y-3">
          {results.map((book) => (
            <div key={book.id || book.title} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">{book.title}</h3>
                <p className="text-sm text-slate-300 mt-0.5">Author: {book.author} • Category: {book.category} • Location: {book.location}</p>
                {book.isbn && <p className="text-xs text-slate-500 font-mono mt-1">ISBN: {book.isbn}</p>}
              </div>
              <span className={`text-xs px-3.5 py-1.5 rounded-full font-bold ${
                book.copies_available > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {book.copies_available > 0 ? `${book.copies_available} Copies Available` : 'All Issued'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Hostel Component with Live AI Priority Prediction
export const Hostel = () => {
  const [complaintTitle, setComplaintTitle] = useState('')
  const [complaintText, setComplaintText] = useState('')
  const [complaints, setComplaints] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)

  const fetchComplaints = async () => {
    try {
      const data = await getHostelComplaints()
      setComplaints(data.complaints || [])
    } catch {
      setComplaints([])
    }
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!complaintTitle || !complaintText) return
    setSubmitting(true)
    try {
      await fileHostelComplaint(complaintTitle, complaintText, '302-B')
      setComplaintTitle('')
      setComplaintText('')
      await fetchComplaints()
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Hostel Hub</h1>
        <p className="text-sm text-slate-300 font-medium">File maintenance tickets, inspect AI priority rankings, and check room details.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Submit Maintenance Request</h2>
          <input
            type="text"
            value={complaintTitle}
            onChange={(e) => setComplaintTitle(e.target.value)}
            placeholder="Complaint Subject (e.g. WiFi router power failure)"
            className="w-full p-3 rounded-lg border border-slate-800 bg-slate-900 text-sm text-white focus:outline-none focus:border-indigo-500"
            required
          />
          <textarea
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            placeholder="Detailed description (e.g. Power outlet in Room 302-B sparked)..."
            className="w-full h-24 p-3 rounded-lg border border-slate-800 bg-slate-900 text-sm text-white focus:outline-none focus:border-indigo-500"
            required
          />
          <button type="submit" disabled={submitting} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white font-semibold transition-all">
            {submitting ? 'Categorizing with AI...' : 'Submit & Predict AI Priority'}
          </button>
        </form>

        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Allotted Room Details</h2>
          <div className="space-y-2.5 text-sm text-slate-300">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span>Room Number</span>
              <span className="font-semibold text-white">302-B</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span>Block & Wing</span>
              <span className="font-semibold text-white">C-Block (Boys)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span>Room Capacity</span>
              <span className="font-semibold text-white">4 Occupants (1 Allotted)</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Hostel Warden</span>
              <span className="font-semibold text-white">Mr. Robert Dev (+91-9876543210)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Active Maintenance Tickets ({complaints.length})</h2>
        <div className="space-y-3">
          {complaints.map((c) => (
            <div key={c.id || c.title} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">{c.title}</h3>
                <p className="text-sm text-slate-400 mt-0.5">{c.description}</p>
                <span className="text-xs text-slate-500 font-mono mt-1 inline-block">Room: {c.room_number || '302-B'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                  c.priority === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}>
                  Priority: {c.priority || 'Medium'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Transport Component with Live Bus Route Tracking
export const Transport = () => {
  const [routes, setRoutes] = useState<any[]>([])

  useEffect(() => {
    getTransportRoutes()
      .then((data) => setRoutes(data.routes || []))
      .catch(() => {
        setRoutes([
          { route: 'Route 10A (Central Station to Campus)', bus_number: 'TS-09-UA-1234', eta: '8 mins', demand: 'High' },
          { route: 'Route 14B (Metro Link to North Gate)', bus_number: 'TS-09-UA-5678', eta: '14 mins', demand: 'Low' }
        ])
      })
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Transport & Bus Schedule</h1>
        <p className="text-sm text-slate-300 font-medium">Track campus shuttles, live ETAs, driver contacts, and peak occupancy predictions.</p>
      </div>
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Bus className="w-5 h-5 text-indigo-400" /> Active Campus Bus Routes
        </h2>
        <div className="space-y-3">
          {routes.map((bus) => (
            <div key={bus.route} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">{bus.route}</h3>
                <p className="text-sm text-slate-400 mt-0.5">Vehicle: <span className="font-mono text-indigo-400">{bus.bus_number}</span> • Driver: {bus.driver_name || 'Ramesh Kumar'}</p>
                <p className="text-xs text-slate-500 mt-1">Live ETA: <span className="text-emerald-400 font-bold">{bus.eta}</span></p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                bus.demand === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                Peak Occupancy: {bus.demand}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Full Dataset-Backed Placements Hub & AI Predictor
export const Placements = () => {
  const [cgpa, setCgpa] = useState('8.50')
  const [branch, setBranch] = useState('CSE')
  const [tier, setTier] = useState('Tier 1')
  const [codingScore, setCodingScore] = useState('85')
  const [mockScore, setMockScore] = useState('78')
  const [internships, setInternships] = useState('1')
  const [skills, setSkills] = useState('Python, Data Structures, System Design, SQL')

  const [prediction, setPrediction] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [resumeText, setResumeText] = useState('')
  const [resumeResult, setResumeResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [evaluatingResume, setEvaluatingResume] = useState(false)

  useEffect(() => {
    getPlacementAnalytics().then(setAnalytics).catch(() => {})
    getRecruitingCompanies().then(res => setCompanies(res.companies || [])).catch(() => {})
  }, [])

  const calculateReadiness = async () => {
    setLoading(true)
    try {
      const res = await predictPlacementReadiness({
        cgpa: Number(cgpa),
        branch,
        college_tier: tier,
        coding_platform_score: Number(codingScore),
        mock_interview_score: Number(mockScore),
        internships_count: Number(internships),
        skills: skills.split(',').map(s => s.trim()).filter(Boolean)
      })
      setPrediction(res)
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }

  const handleResumeReview = async () => {
    if (!resumeText) return
    setEvaluatingResume(true)
    try {
      const res = await reviewResume(resumeText)
      setResumeResult(res)
    } catch {
      // fallback
    } finally {
      setEvaluatingResume(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold mb-2">
            <Award className="w-3.5 h-3.5" /> Powered by 100,000+ Placement Dataset
          </div>
          <h1 className="text-3xl font-extrabold text-white">Placements & Salary Predictor</h1>
          <p className="text-sm text-slate-300 mt-1">Real ML models trained on dual datasets for readiness scoring, package estimation, and skill analysis.</p>
        </div>
        {analytics && (
          <div className="flex gap-4">
            <div className="text-center px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">Total Analyzed</span>
              <div className="text-lg font-bold text-white">{analytics.total_records?.toLocaleString()}</div>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">Placement Rate</span>
              <div className="text-lg font-bold text-emerald-400">{analytics.placement_rate}%</div>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">Avg Salary Package</span>
              <div className="text-lg font-bold text-indigo-400">${analytics.avg_salary_lpa} LPA</div>
            </div>
          </div>
        )}
      </div>

      {/* Dataset Statistics Cards */}
      {analytics && analytics.branches && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" /> Department Placement Performance (2026 Dataset)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {analytics.branches.map((b: any) => (
              <div key={b.branch} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-xs text-indigo-400 font-bold">{b.branch}</span>
                <div className="text-xl font-extrabold text-white">{b.placement_rate}%</div>
                <p className="text-[11px] text-slate-400">Avg {b.avg_salary_lpa} LPA</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calculator & Predictor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" /> ML Placement & Salary Calculator
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">CGPA (0 - 10)</label>
              <input value={cgpa} onChange={(e) => setCgpa(e.target.value)} type="number" step="0.01" className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Branch</label>
              <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white">
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="EEE">EEE</option>
                <option value="Civil">Civil</option>
                <option value="Mechanical">Mechanical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">College Tier</label>
              <select value={tier} onChange={(e) => setTier(e.target.value)} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white">
                <option value="Tier 1">Tier 1</option>
                <option value="Tier 2">Tier 2</option>
                <option value="Tier 3">Tier 3</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Coding Score (0-100)</label>
              <input value={codingScore} onChange={(e) => setCodingScore(e.target.value)} type="number" className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Mock Interview Score</label>
              <input value={mockScore} onChange={(e) => setMockScore(e.target.value)} type="number" className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Internships Completed</label>
              <input value={internships} onChange={(e) => setInternships(e.target.value)} type="number" className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Technical Skills (comma separated)</label>
            <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Python, SQL, React, System Design" className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white" />
          </div>

          <button onClick={calculateReadiness} disabled={loading} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-bold text-white transition-all">
            {loading ? 'Predicting with ML Model...' : 'Calculate Placement Readiness & Salary Package'}
          </button>

          {prediction && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Readiness Rating</span>
                  <div className="text-xl font-bold text-white">{prediction.readiness_rating} ({prediction.readiness_score}%)</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Expected Salary Package</span>
                  <div className="text-2xl font-extrabold text-emerald-400">${prediction.expected_salary_lpa} LPA</div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Actionable ML Recommendations:</h4>
                <ul className="space-y-1">
                  {prediction.recommendations?.map((rec: string, i: number) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* AI Resume Reviewer & Recruiters */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" /> AI Resume Reviewer
            </h2>
            <p className="text-xs text-slate-300">Paste your resume content to evaluate score against recruiters' dataset expectations.</p>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste resume text here (e.g. 'Built fullstack web app using Python, FastAPI, React, SQL. Improved latency by 35%...')"
              className="w-full h-28 p-3 rounded-xl border border-slate-800 bg-slate-900 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button onClick={handleResumeReview} disabled={evaluatingResume || !resumeText} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-white transition-all">
              {evaluatingResume ? 'Analyzing Resume...' : 'Analyze Resume Score & Skill Gaps'}
            </button>

            {resumeResult && (
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Resume Impact Score</span>
                  <span className="text-lg font-bold text-indigo-400">{resumeResult.score}/100</span>
                </div>
                <p className="text-xs text-slate-200">{resumeResult.feedback}</p>
                {resumeResult.skills_detected?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {resumeResult.skills_detected.map((sk: string) => (
                      <span key={sk} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">{sk}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" /> Active Campus Recruiters ({companies.length})
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {companies.map((comp) => (
                <div key={comp.id || comp.name} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-white">{comp.name}</h3>
                    <p className="text-[11px] text-slate-400">{comp.industry}</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-400 font-mono">${comp.avg_package_lpa || 8.5} LPA</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Finance Component
export const Finance = () => {
  const [feeInfo, setFeeInfo] = useState<any>(null)
  const [scholarships, setScholarships] = useState<any[]>([])

  useEffect(() => {
    getFeeDetails('1').then(setFeeInfo).catch(() => {})
    getScholarships('1').then(res => setScholarships(res.recommendations || [])).catch(() => {})
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Finance & Fees</h1>
        <p className="text-sm text-slate-300 font-medium">Check dues, inspect structural breakdown, and review scholarship matches.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 space-y-3">
          <span className="text-slate-400 text-xs">Total Semester Fee Pending</span>
          <p className="text-3xl font-extrabold text-white">${feeInfo?.dues?.toLocaleString() || '1,250.00'}</p>
          <p className="text-xs text-slate-400">Due Date: <span className="text-red-400 font-semibold">{feeInfo?.due_date || '2026-08-15'}</span></p>
          <button className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs text-white font-bold transition-all">
            Pay Dues Online
          </button>
        </div>

        <div className="glass-card rounded-2xl p-6 md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-400" /> AI Scholarship Matches ({scholarships.length})
          </h2>
          <div className="space-y-3">
            {scholarships.map((sch) => (
              <div key={sch.id || sch.title} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <h3 className="text-base font-bold text-white">{sch.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Criteria: {sch.criteria} • Eligibility Match: <span className="text-emerald-400 font-bold">{sch.eligibility_match}%</span></p>
                </div>
                <span className="text-base font-extrabold text-emerald-400 font-mono">${sch.amount_usd}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Generic Placeholder Component for smaller modules
const GenericPlaceholder = ({ title, desc }: { title: string; desc: string }) => (
  <div className="flex flex-col items-center justify-center h-[calc(100vh-14rem)] text-center animate-fade-in">
    <div className="p-4 rounded-full bg-slate-900 border border-slate-800 mb-4">
      <Info className="w-8 h-8 text-indigo-500" />
    </div>
    <h1 className="text-xl font-bold text-white mb-2">{title}</h1>
    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">{desc}</p>
  </div>
)

export const Events = () => <GenericPlaceholder title="Campus Events" desc="Register for technical fests, guest lectures, hackathons, and sports events. AI suggestion lists incoming." />
export const Clubs = () => <GenericPlaceholder title="Student Clubs" desc="Explore active university clubs: Robotics, Coding club, Drama, and Literature societies. Enrollments are open." />
export const Notices = () => <GenericPlaceholder title="Notice Board" desc="View general circulars, holidays, and administrator updates. Filter notices based on roles and departments." />
export const Research = () => <GenericPlaceholder title="Research & Journals" desc="Publish research papers, request supervisor approvals, and search index articles using library systems." />

export const AIInsights = () => {
  const [adminStats, setAdminStats] = useState<any>(null)

  useEffect(() => {
    getAdminAnalytics().then(setAdminStats).catch(() => {})
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Campus AI Analytics & Predictions</h1>
        <p className="text-sm text-slate-300 font-medium">Predictive dashboards based on university operational logs and 100,000+ student dataset records.</p>
      </div>

      {adminStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <span className="text-xs text-slate-400">Total Analyzed Records</span>
            <div className="text-2xl font-extrabold text-white mt-1">{adminStats.total_analyzed_students?.toLocaleString()}</div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <span className="text-xs text-slate-400">Campus Placement Forecast</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{adminStats.placement_rate_forecast}%</div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <span className="text-xs text-slate-400">Hostel Occupancy Rate</span>
            <div className="text-2xl font-extrabold text-indigo-400 mt-1">{adminStats.hostel_occupancy_prediction}%</div>
          </div>
        </div>
      )}

      {adminStats?.top_influencing_factors && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Top Predictive Signals for Student Success</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminStats.top_influencing_factors.map((factor: any) => (
              <div key={factor.feature} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-200">{factor.feature}</span>
                <span className="text-xs font-mono font-bold text-indigo-400">Correlation: {factor.raw_correlation}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const Settings = () => <GenericPlaceholder title="Account Settings" desc="Manage active sessions, reset password credentials, set default dark/light UI modes, and configure notification alerts." />
export const Profile = () => <GenericPlaceholder title="Student Profile" desc="Manage contact details, department branches, academic semesters, list certifications, and view security records." />
