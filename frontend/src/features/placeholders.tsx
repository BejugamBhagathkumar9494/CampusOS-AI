import { useState } from 'react'
import {
  BookOpen, Upload, Landmark, Bus, Info, Cpu
} from 'lucide-react'


// Academics Component
export const Academics = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold text-white">Academics</h1>
      <p className="text-xs text-slate-400">Manage courses, syllabi, and study planners.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" /> Current Enrolled Subjects
        </h2>
        <div className="space-y-3">
          {['Automata Theory (CS301)', 'Computer Networks (CS302)', 'Database Systems (CS303)'].map((subject) => (
            <div key={subject} className="flex justify-between items-center p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <span className="text-sm text-slate-200">{subject}</span>
              <span className="text-xs text-indigo-400 font-medium cursor-pointer hover:underline">Syllabus PDF</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" /> AI Elective Recommender
        </h2>
        <p className="text-xs text-slate-400">Based on your interests in machine learning and database systems, our model suggests:</p>
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20">
            <h3 className="text-xs font-semibold text-white">Natural Language Processing</h3>
            <p className="text-[10px] text-slate-400 mt-1">94% recommendation match. Offered by Dr. Jenkins.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
            <h3 className="text-xs font-semibold text-white">Cloud Computing Architectures</h3>
            <p className="text-[10px] text-slate-400 mt-1">82% recommendation match. Offered by Prof. Vance.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Attendance Component
export const Attendance = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold text-white">Attendance Monitor</h1>
      <p className="text-xs text-slate-400">Track subject attendance and predict future shortages.</p>
    </div>
    <div className="glass-panel rounded-xl overflow-hidden">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold">
            <th className="p-4">Subject</th>
            <th className="p-4">Total Classes</th>
            <th className="p-4">Attended</th>
            <th className="p-4">Percentage</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {[
            { name: 'Automata Theory', total: 32, attended: 24, percent: 74.0, status: 'Shortage Alert' },
            { name: 'Computer Networks', total: 34, attended: 31, percent: 91.1, status: 'Safe' },
            { name: 'Database Management Systems', total: 30, attended: 27, percent: 90.0, status: 'Safe' },
          ].map((sub) => (
            <tr key={sub.name} className="hover:bg-slate-900/20">
              <td className="p-4 font-medium text-white">{sub.name}</td>
              <td className="p-4 text-slate-300">{sub.total}</td>
              <td className="p-4 text-slate-300">{sub.attended}</td>
              <td className="p-4 text-slate-300">{sub.percent}%</td>
              <td className="p-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  sub.status === 'Safe' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
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

// Exams Component
export const Exams = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold text-white">Exams</h1>
      <p className="text-xs text-slate-400">View schedules, results, and exam predictions.</p>
    </div>
    <div className="glass-card rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">Upcoming End Semester Timetable</h2>
      <div className="space-y-4">
        {[
          { date: 'Nov 12, 2026', code: 'CS301', name: 'Automata Theory', time: '10:00 AM - 01:00 PM' },
          { date: 'Nov 14, 2026', code: 'CS302', name: 'Computer Networks', time: '10:00 AM - 01:00 PM' },
        ].map((ex) => (
          <div key={ex.code} className="flex justify-between items-center p-4 rounded-lg bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-xs text-indigo-400">{ex.date}</span>
              <h3 className="text-sm font-semibold text-white mt-0.5">{ex.name} ({ex.code})</h3>
            </div>
            <span className="text-xs text-slate-400">{ex.time}</span>
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
      <h1 className="text-2xl font-bold text-white">Assignments</h1>
      <p className="text-xs text-slate-400">Upload reports and view grades.</p>
    </div>
    <div className="glass-card rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-bold text-white">Pending Assignments</h2>
      <div className="space-y-3">
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-white">OS Lab: Thread Scheduling</h3>
            <p className="text-xs text-red-400 mt-1">Due in 2 days</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
            <Upload className="w-3.5 h-3.5" /> Submit File
          </button>
        </div>
      </div>
    </div>
  </div>
)

// Library Component
export const Library = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])

  const handleSearch = () => {
    if (query) {
      setResults([
        { title: 'Introduction to Algorithms', author: 'Cormen, Leiserson', location: 'Rack C-4', copies: 3 },
        { title: 'Compilers: Principles & Tools', author: 'Aho, Ullman', location: 'Rack E-1', copies: 0 },
      ])
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Semantic Library Search</h1>
        <p className="text-xs text-slate-400">Find reference books and digital materials using vector search.</p>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics (e.g. 'machine learning algorithms')"
          className="flex-1 px-4 py-2 rounded-lg border border-slate-800 bg-slate-900 text-sm focus:outline-none focus:border-indigo-500"
        />
        <button onClick={handleSearch} className="px-4 py-2 bg-indigo-600 rounded-lg text-sm text-white font-semibold">
          Search
        </button>
      </div>

      {results.length > 0 && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-md font-bold text-white">Results</h2>
          <div className="space-y-3">
            {results.map((book) => (
              <div key={book.title} className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-white">{book.title}</h3>
                  <p className="text-xs text-slate-400">{book.author} • Location: {book.location}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                  book.copies > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {book.copies > 0 ? `${book.copies} Copies Available` : 'All Issued'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Hostel Component
export const Hostel = () => {
  const [complaintText, setComplaintText] = useState('')
  const [priority, setPriority] = useState('')

  const handlePredict = () => {
    if (complaintText.toLowerCase().includes("fire") || complaintText.toLowerCase().includes("leak")) {
      setPriority("High")
    } else {
      setPriority("Medium")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Hostel Hub</h1>
        <p className="text-xs text-slate-400">File complaints, check room occupancy, and request maintenance.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-md font-bold text-white">Submit Maintenance Request</h2>
          <div className="space-y-3">
            <textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="Explain the complaint (e.g. WiFi router in Room 302 has no power)..."
              className="w-full h-24 p-3 rounded-lg border border-slate-800 bg-slate-900 text-sm focus:outline-none focus:border-indigo-500"
            />
            <div className="flex justify-between items-center">
              <button onClick={handlePredict} className="px-4 py-2 bg-indigo-600 rounded-lg text-xs text-white font-semibold">
                Predict AI Priority
              </button>
              {priority && (
                <span className={`text-xs px-2.5 py-1 rounded font-bold ${
                  priority === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}>
                  Predicted Priority: {priority}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-md font-bold text-white">Room Details</h2>
          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span>Room Number</span>
              <span className="font-semibold text-white">302-B</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span>Block Name</span>
              <span className="font-semibold text-white">C-Block (Boys)</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Warden Name</span>
              <span className="font-semibold text-white">Mr. Robert Dev</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Transport Component
export const Transport = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold text-white">Transport & Bus Schedule</h1>
      <p className="text-xs text-slate-400">Track campus buses, view ETA predictions, and avoid rush hours.</p>
    </div>
    <div className="glass-card rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <Bus className="w-5 h-5 text-indigo-400" /> Active Campus Routes
      </h2>
      <div className="space-y-3">
        {[
          { route: 'Route 10A (Central Station to Campus)', eta: '8 mins', demand: 'High' },
          { route: 'Route 14B (Metro Link to North Gate)', eta: '14 mins', demand: 'Low' },
        ].map((bus) => (
          <div key={bus.route} className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-white">{bus.route}</h3>
              <p className="text-xs text-slate-500 mt-1">ETA: {bus.eta}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
              bus.demand === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              Peak Occupancy: {bus.demand}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// Placements Component
export const Placements = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold text-white">Placements Portal</h1>
      <p className="text-xs text-slate-400">Submit resumes, view recruiter drives, and check placement readiness.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="text-md font-bold text-white">AI Resume Reviewer</h2>
        <p className="text-xs text-slate-400">Upload your PDF resume to generate scores and skill gaps instantly.</p>
        <div className="border border-dashed border-slate-800 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-900/10 transition-colors">
          <Upload className="w-8 h-8 text-indigo-500 mb-2" />
          <span className="text-xs text-slate-300">Click to upload resume PDF</span>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="text-md font-bold text-white">Placement Readiness Prediction</h2>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 flex items-center justify-center rounded-full border-4 border-indigo-600/30 border-t-indigo-500">
            <span className="text-sm font-bold text-white">78%</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Placement Class Rating: Ready</h3>
            <p className="text-[10px] text-slate-400 mt-1">Strengthen: System Design, Mock interviews</p>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Finance Component
export const Finance = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold text-white">Finance & Fees</h1>
      <p className="text-xs text-slate-400">Check balance, make secure fee payments, and search scholarships.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass-card rounded-xl p-6 space-y-2">
        <span className="text-slate-400 text-xs">Total Semester Fee Due</span>
        <p className="text-2xl font-bold text-white">$1,250.00</p>
        <button className="w-full mt-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-xs text-white font-semibold transition-colors">
          Pay Now
        </button>
      </div>

      <div className="glass-card rounded-xl p-6 md:col-span-2 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Landmark className="w-4 h-4 text-indigo-500" /> Scholarship Match Results
        </h2>
        <div className="space-y-2">
          <div className="p-3 rounded bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
            <div>
              <h4 className="font-semibold text-slate-200">Merit Academic Excellence Grant</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Eligibility Match: 95%</p>
            </div>
            <span className="text-emerald-400 font-semibold">$2,500</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)

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
export const AIInsights = () => <GenericPlaceholder title="AI Analytics & Predictions" desc="Comprehensive dashboards detailing campus operational logs, mess food waste analytics, and room forecasting." />
export const Settings = () => <GenericPlaceholder title="Account Settings" desc="Manage active sessions, reset password credentials, set default dark/light UI modes, and configure notification alerts." />
export const Profile = () => <GenericPlaceholder title="Student Profile" desc="Manage contact details, department branches, academic semesters, list certifications, and view security records." />
