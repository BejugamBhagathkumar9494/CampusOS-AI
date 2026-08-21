import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth.js'
import {
  Sparkles,
  ArrowRight,
  Shield,
  Activity,
  TrendingUp,
  Brain,
  Search,
  Check,
  ChevronDown,
  BookOpen,
  Briefcase,
  Home,
  Bus,
  DollarSign,
  Layers,
  Menu,
  X,
  Play
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'

const attendanceData = [
  { name: 'Week 1', actual: 72, predicted: 72 },
  { name: 'Week 2', actual: 73, predicted: 74 },
  { name: 'Week 3', actual: 71, predicted: 75 },
  { name: 'Week 4', actual: 74, predicted: 78 },
  { name: 'Week 5', actual: 77, predicted: 81 },
  { name: 'Week 6', actual: null, predicted: 83 },
  { name: 'Week 7', actual: null, predicted: 85 },
]

const placementData = [
  { year: '2022', placement: 84 },
  { year: '2023', placement: 87 },
  { year: '2024', placement: 91 },
  { year: '2025', placement: 94 },
  { year: '2026 (Est)', placement: 98 },
]

const foodDemandData = [
  { hour: '08:00', demand: 120 },
  { hour: '10:00', demand: 250 },
  { hour: '12:00', demand: 680 },
  { hour: '14:00', demand: 420 },
  { hour: '16:00', demand: 180 },
  { hour: '18:00', demand: 390 },
  { hour: '20:00', demand: 510 },
]

const utilizationData = [
  { name: 'Library', value: 85, color: '#2563EB' },
  { name: 'Hostels', value: 92, color: '#4F46E5' },
  { name: 'Transport', value: 64, color: '#0ea5e9' },
  { name: 'Labs', value: 78, color: '#10b981' },
]

const institutionsList = [
  { icon: '🏛', title: 'Universities', tag: 'Multi-disciplinary Campuses' },
  { icon: '🎓', title: 'Engineering Colleges', tag: 'Lab & Accreditation Tracking' },
  { icon: '🏫', title: 'Technical Institutes', tag: 'Vocational Skill Automation' },
  { icon: '🔬', title: 'Research Centers', tag: 'R&D Grants & Publication RAG' },
  { icon: '🌍', title: 'Global Campuses', tag: 'Multi-Location AI Sync' },
]

export default function LandingPage() {
  const { isAuthenticated, role } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getDashboardLink = () => {
    if (!isAuthenticated || !role) return '/login';
    const routes = {
      student: '/student/dashboard',
      faculty: '/faculty/dashboard',
      admin: '/admin/dashboard',
      hostel_warden: '/hostel/dashboard',
      placement_officer: '/placement/dashboard',
      super_admin: '/super-admin/dashboard',
    };

    return routes[role] || '/login';
  };

  const dashboardLink = getDashboardLink();
  const [searchFocused, setSearchFocused] = useState(false)
  const [activeDashboardTab, setActiveDashboardTab] = useState('student')
  const [faqOpen, setFaqOpen] = useState(null)
  const [currentInstIndex, setCurrentInstIndex] = useState(0)

  const heroVideoRef = useRef(null)

  useEffect(() => {
    if (heroVideoRef.current) {
      heroVideoRef.current.defaultMuted = true
      heroVideoRef.current.muted = true
      heroVideoRef.current.play().catch((err) => {
        console.warn('Hero video autoplay error:', err)
      })
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentInstIndex((prev) => (prev + 1) % institutionsList.length)
    }, 2800)
    return () => clearInterval(timer)
  }, [])
  
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am your CampusOS Copilot. Ask me anything about university academic performance, predictive analytics, or campus logistics.'
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (chatMessages.length > 1 || isTyping) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, isTyping])

  useEffect(() => {
    const body = document.body
    const originalClasses = body.className
    body.className = "bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden"
    return () => {
      body.className = originalClasses
    }
  }, [])

  const [stats, setStats] = useState({
    modules: 0,
    features: 0,
    portals: 0,
    workflows: 0
  })

  useEffect(() => {
    const duration = 1500
    const steps = 50
    const stepTime = duration / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      setStats({
        modules: Math.floor((7 / steps) * currentStep),
        features: Math.floor((20 / steps) * currentStep),
        portals: Math.floor((5 / steps) * currentStep),
        workflows: Math.floor((50 / steps) * currentStep)
      })

      if (currentStep >= steps) {
        clearInterval(timer)
        setStats({
          modules: 7,
          features: 20,
          portals: 5,
          workflows: 50
        })
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [])

  const handleCopilotSubmit = (text) => {
    if (!text.trim() || isTyping) return
    
    const userMsg = text
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }])
    setChatInput('')
    setIsTyping(true)

    setTimeout(() => {
      setIsTyping(false)
      if (userMsg.toLowerCase().includes('attendance')) {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'assistant',
            text: 'I have analyzed your current academic metrics and student files.',
            details: {
              title: 'Academic Analytics Advisory',
              prediction: 'Current placement probability: 74%. Recommended target: 75% to guarantee exam eligibility and placement drive clearance.',
              policy: 'Section 4.2 of the University Regulation: Minimum 75% attendance is required to sit for the End-Semester Examination.',
              confidence: '98%',
              action: 'Attend the remaining 4 lectures of Automata Theory this week to cross the critical threshold.'
            }
          }
        ])
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'assistant',
            text: 'I have logged that request in the University knowledge base. Based on our predictive RAG system, the campus logistics model has verified the data. Let me know if you want me to spin up a specialized Workflow Agent to automate this route.'
          }
        ])
      }
    }, 1500)
  }

  const presetQueries = [
    "My attendance is 71%. Can I sit for exams?",
    "Predict the placement readiness of Computer Science 2026 batch",
    "Identify optimization strategy for energy grids in Hostel D"
  ]

  const workflowNodes = [
    { id: 'stud', label: 'Student request', desc: 'Queries eligibility or support requests' },
    { id: 'stud-agt', label: 'AI Student Agent', desc: 'Analyzes student profile & historical patterns' },
    { id: 'acad-agt', label: 'Academic Agent', desc: 'Cross-checks course policies & grade analytics' },
    { id: 'know-agt', label: 'Knowledge Agent', desc: 'Queries vector database (RAG) for university policy' },
    { id: 'place-agt', label: 'Placement Agent', desc: 'Maps placement readiness and alerts coordinators' },
    { id: 'final-rec', label: 'Final Advisory', desc: 'Resolves waiver logic and sends automated action' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-hidden grid-bg-light">
      <div className="absolute top-0 inset-x-0 h-[1000px] pointer-events-none -z-10" />

      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl xl:max-w-[1440px] mx-auto px-6 sm:px-8 xl:px-12 h-18 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="font-bold text-xl tracking-tight font-sans text-white">
              CampusOS <span className="text-blue-400 font-extrabold">AI</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            <a href="#features" className="text-[15px] font-medium text-slate-300 hover:text-blue-400 transition-colors duration-200">Features</a>
            <a href="#agents" className="text-[15px] font-medium text-slate-300 hover:text-blue-400 transition-colors duration-200">AI Agents</a>
            <a href="#intelligence" className="text-[15px] font-medium text-slate-300 hover:text-blue-400 transition-colors duration-200">Solutions</a>
            <a href="#copilot" className="text-[15px] font-medium text-slate-300 hover:text-blue-400 transition-colors duration-200">AI Copilot</a>
            <a href="#pricing" className="text-[15px] font-medium text-slate-300 hover:text-blue-400 transition-colors duration-200">Pricing</a>
            <a href="#faq" className="text-[15px] font-medium text-slate-300 hover:text-blue-400 transition-colors duration-200">FAQ</a>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <div className={`relative flex items-center transition-all duration-300 ${searchFocused ? 'w-60' : 'w-44'}`}>
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search solutions..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full bg-slate-900/80 hover:bg-slate-900 focus:bg-slate-900 text-white text-xs pl-9 pr-4 py-2 rounded-full border border-white/10 focus:border-blue-500/50 outline-none transition-all placeholder-slate-400"
              />
            </div>
            {isAuthenticated ? (
              <>
                <Link to={dashboardLink} className="text-[15px] font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5">
                  Dashboard
                </Link>
                <Link
                  to={dashboardLink}
                  className="text-sm font-semibold tracking-wide bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-full shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap border border-blue-400/30 active:scale-95 shrink-0"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="text-[15px] font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5">
                  Register
                </Link>
                <Link
                  to="/login"
                  className="text-sm font-semibold tracking-wide bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-full shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap border border-blue-400/30 active:scale-95 shrink-0"
                >
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 px-6 py-8 flex flex-col gap-6 shadow-xl animate-fade-in">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-800 hover:text-blue-600">Features</a>
            <a href="#agents" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-800 hover:text-blue-600">AI Agents</a>
            <a href="#intelligence" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-800 hover:text-blue-600">Solutions</a>
            <a href="#copilot" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-800 hover:text-blue-600">AI Copilot</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-800 hover:text-blue-600">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-slate-800 hover:text-blue-600">FAQ</a>
            <hr className="border-slate-100" />
            <div className="flex flex-col gap-4">
              <Link to={isAuthenticated ? dashboardLink : '/register'} onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center text-base font-semibold text-slate-800 hover:text-blue-600 py-2 border border-slate-200 rounded-xl">
                {isAuthenticated ? 'Dashboard' : 'Register'}
              </Link>
              <Link to={isAuthenticated ? dashboardLink : '/login'} onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-semibold py-3 rounded-full shadow-lg shadow-blue-500/20 hover:bg-blue-700">
                <span>{isAuthenticated ? 'Go to Dashboard' : 'Login'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      <section className="relative z-0 pt-14 pb-14 lg:pt-20 lg:pb-20 px-6 sm:px-8 xl:px-12 overflow-hidden flex flex-col items-center justify-center min-h-[calc(100vh-4.5rem)]">
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none -z-10 transform-gpu bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b15_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b15_1px,transparent_1px)] bg-[size:4rem_4rem]" />

          <video
            ref={heroVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-10000 transform-gpu opacity-80"
          >
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-slate-950/30 to-purple-950/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-slate-950/80" />
        </div>

        <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4.5 py-2 rounded-full bg-slate-900/60 border border-blue-500/30 text-blue-200 backdrop-blur-md mb-5 shadow-lg shadow-blue-950/20 text-xs sm:text-sm font-semibold tracking-wide uppercase transition-all hover:border-blue-500/50 hover:bg-slate-900/80">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>Built for Modern Higher Education</span>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 mb-7">
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full bg-slate-900/60 text-slate-200 border border-white/10 backdrop-blur-md shadow-sm">
              <Check className="w-3.5 h-3.5 text-blue-400" /> AI Powered
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full bg-slate-900/60 text-slate-200 border border-white/10 backdrop-blur-md shadow-sm">
              <Check className="w-3.5 h-3.5 text-indigo-400" /> Enterprise Ready
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full bg-slate-900/60 text-slate-200 border border-white/10 backdrop-blur-md shadow-sm">
              <Check className="w-3.5 h-3.5 text-sky-400" /> Multi-Agent AI
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full bg-slate-900/60 text-slate-200 border border-white/10 backdrop-blur-md shadow-sm">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Predictive Analytics
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-white max-w-5xl leading-[1.08] mb-6 drop-shadow-md">
            The AI Operating System for{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-sky-400 bg-clip-text text-transparent drop-shadow-md">
              Modern Universities
            </span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-slate-200 max-w-[640px] font-normal leading-relaxed mb-9 drop-shadow-sm">
            Empowering students, faculty, administrators, and university staff with AI Agents, Machine Learning, Predictive Analytics, Intelligent Automation, and Enterprise Decision Support.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-9 w-full sm:w-auto">
            <Link
              to="/dashboard"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all text-base flex items-center justify-center gap-2 group border border-blue-400/30 hover:-translate-y-0.5 active:scale-95"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#copilot"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full border border-white/20 backdrop-blur-md shadow-md transition-all text-base flex items-center justify-center gap-2 hover:-translate-y-0.5 group active:scale-95"
            >
              <Play className="w-4 h-4 fill-white text-white group-hover:scale-110 transition-transform" />
              Watch Demo
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white border-y border-slate-200/80 py-16 px-6 sm:px-8 xl:px-12 relative z-30 shadow-sm">
        <div className="max-w-7xl xl:max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="flex flex-col items-center justify-center px-4">
            <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
              {stats.modules}+
            </h3>
            <p className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Smart Campus Modules
            </p>
          </div>
          <div className="flex flex-col items-center justify-center px-4 pt-6 md:pt-0">
            <h3 className="text-4xl md:text-5xl font-extrabold text-blue-600 tracking-tight mb-2">
              {stats.features}+
            </h3>
            <p className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wider">
              AI-Powered Features
            </p>
          </div>
          <div className="flex flex-col items-center justify-center px-4 pt-6 md:pt-0">
            <h3 className="text-4xl md:text-5xl font-extrabold text-indigo-600 tracking-tight mb-2">
              {stats.portals}
            </h3>
            <p className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wider">
              User Portals
            </p>
          </div>
          <div className="flex flex-col items-center justify-center px-4 pt-6 md:pt-0">
            <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
              {stats.workflows}+
            </h3>
            <p className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Automated Workflows
            </p>
          </div>
          <div className="flex flex-col items-center justify-center px-4 pt-6 md:pt-0">
            <h3 className="text-4xl md:text-5xl font-extrabold text-emerald-600 tracking-tight mb-2">
              24/7
            </h3>
            <p className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wider">
              AI Assistance
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-200/80 py-16 px-6 sm:px-8 xl:px-12 relative z-30">
        <div className="max-w-7xl xl:max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 font-medium gap-4">
          <span>&copy; {new Date().getFullYear()} CampusOS AI Platform. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
