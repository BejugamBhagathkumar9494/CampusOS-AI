import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
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

// Mock data for Recharts
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [activeDashboardTab, setActiveDashboardTab] = useState('student')
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [currentInstIndex, setCurrentInstIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentInstIndex((prev) => (prev + 1) % institutionsList.length)
    }, 2800)
    return () => clearInterval(timer)
  }, [])
  
  // Copilot Interactive Chat State
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; details?: any }>>([
    {
      sender: 'assistant',
      text: 'Hello! I am your CampusOS Copilot. Ask me anything about university academic performance, predictive analytics, or campus logistics.'
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto scroll chat to bottom (only when user interacts)
  useEffect(() => {
    if (chatMessages.length > 1 || isTyping) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, isTyping])

  // Custom useEffect to force Light Mode on landing page
  useEffect(() => {
    const body = document.body
    const originalClasses = body.className
    body.className = "bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden"
    return () => {
      body.className = originalClasses
    }
  }, [])

  // Stats Counters state animation triggers
  const [stats, setStats] = useState({
    universities: 0,
    students: 0,
    modules: 0,
    automation: 0,
    accuracy: 0
  })

  useEffect(() => {
    const duration = 1500
    const steps = 50
    const stepTime = duration / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      setStats({
        universities: Math.floor((100 / steps) * currentStep),
        students: Math.floor((500 / steps) * currentStep),
        modules: Math.floor((40 / steps) * currentStep),
        automation: Math.floor((95 / steps) * currentStep),
        accuracy: Math.floor((99 / steps) * currentStep)
      })

      if (currentStep >= steps) {
        clearInterval(timer)
        setStats({
          universities: 100,
          students: 500,
          modules: 40,
          automation: 95,
          accuracy: 99
        })
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [])

  const handleCopilotSubmit = (text: string) => {
    if (!text.trim() || isTyping) return
    
    const userMsg = text
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }])
    setChatInput('')
    setIsTyping(true)

    // Simulate AI Copilot Response
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

  // Pre-configured chats
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
      {/* Background gradients */}
      <div className="absolute top-0 inset-x-0 h-[1000px] pointer-events-none -z-10" />

      {/* Sticky transparent navigation */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="font-bold text-xl tracking-tight font-sans text-white">
              CampusOS <span className="text-blue-400 font-extrabold">AI</span>
            </span>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</a>
            <a href="#agents" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">AI Agents</a>
            <a href="#intelligence" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Solutions</a>
            <a href="#copilot" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">AI Copilot</a>
            <a href="#pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Right Header Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <div className={`relative flex items-center transition-all duration-300 ${searchFocused ? 'w-64' : 'w-48'}`}>
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search solutions..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full bg-slate-900/80 hover:bg-slate-900 focus:bg-slate-900 text-white text-xs pl-9 pr-4 py-2 rounded-full border border-white/10 focus:border-blue-500/50 outline-none transition-all placeholder-slate-400"
              />
            </div>
            <Link to="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3.5 py-2">
              Login
            </Link>
            <Link
              to="/dashboard"
              className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-full shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 group border border-blue-400/30"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 px-6 py-8 flex flex-col gap-6 shadow-xl animate-fade-in">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-800 hover:text-blue-600"
            >
              Features
            </a>
            <a
              href="#agents"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-800 hover:text-blue-600"
            >
              AI Agents
            </a>
            <a
              href="#intelligence"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-800 hover:text-blue-600"
            >
              Solutions
            </a>
            <a
              href="#copilot"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-800 hover:text-blue-600"
            >
              AI Copilot
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-800 hover:text-blue-600"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-800 hover:text-blue-600"
            >
              FAQ
            </a>
            <hr className="border-slate-100" />
            <div className="flex flex-col gap-4">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center text-base font-semibold text-slate-800 hover:text-blue-600 py-2 border border-slate-200 rounded-xl"
              >
                Login
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-0 pt-20 pb-24 md:pt-28 md:pb-32 px-6 overflow-hidden min-h-[92vh] flex flex-col items-center justify-center">
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-10000"
          >
            <source src="/15219398_1920_1080_60fps.mp4" type="video/mp4" />
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
          {/* Subtle blue overlay (25%) and dark vignette for 100% text readability */}
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-blue-950/30 to-slate-950/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-slate-950/60" />
        </div>

        <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-4.5 py-2 rounded-full bg-blue-500/20 border border-blue-400/35 text-blue-300 backdrop-blur-md mb-6 shadow-xl shadow-blue-500/10 text-xs sm:text-sm font-semibold tracking-wide uppercase transition-all hover:border-blue-400/60">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>Built for Modern Higher Education</span>
          </div>

          {/* Small Feature Badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-white/10 text-slate-200 border border-white/15 backdrop-blur-md shadow-md">
              <Check className="w-3.5 h-3.5 text-blue-400" /> AI Powered
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-white/10 text-slate-200 border border-white/15 backdrop-blur-md shadow-md">
              <Check className="w-3.5 h-3.5 text-indigo-400" /> Enterprise Ready
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-white/10 text-slate-200 border border-white/15 backdrop-blur-md shadow-md">
              <Check className="w-3.5 h-3.5 text-sky-400" /> Multi-Agent AI
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-white/10 text-slate-200 border border-white/15 backdrop-blur-md shadow-md">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Predictive Analytics
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-5xl leading-[1.08] mb-6 drop-shadow-md">
            The AI Operating System for{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Modern Universities
            </span>
          </h1>

          {/* Subtitle (Max 650px) */}
          <p className="text-base sm:text-lg md:text-xl text-slate-200 max-w-[650px] font-normal leading-relaxed mb-10 drop-shadow-sm">
            Empowering students, faculty, administrators, and university staff with AI Agents, Machine Learning, Predictive Analytics, Intelligent Automation, and Enterprise Decision Support.
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full sm:w-auto">
            <Link
              to="/dashboard"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-full shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all text-base flex items-center justify-center gap-2 group border border-blue-400/30 hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#copilot"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full border border-white/20 backdrop-blur-md shadow-lg transition-all text-base flex items-center justify-center gap-2 hover:-translate-y-0.5 group"
            >
              <Play className="w-4 h-4 fill-white text-white group-hover:scale-110 transition-transform" />
              Watch Demo
            </a>
          </div>

          {/* Target Users Chips */}
          <div className="flex flex-wrap justify-center gap-2.5 max-w-4xl mb-12">
            {institutionsList.map((inst, idx) => {
              const isActive = idx === currentInstIndex
              return (
                <button
                  key={inst.title}
                  onClick={() => setCurrentInstIndex(idx)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full border transition-all duration-300 hover:-translate-y-0.5 shadow-md ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-400 shadow-blue-500/30 scale-105 ring-2 ring-blue-400/30'
                      : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/20 hover:text-white backdrop-blur-md hover:border-blue-400/40'
                  }`}
                >
                  <span className="text-base">{inst.icon}</span>
                  <span>{inst.title}</span>
                </button>
              )
            })}
          </div>

          {/* 6 Floating Glassmorphism AI Cards Grid */}
          <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-6 border-t border-white/10">
            <div className="p-3 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/15 animate-float shadow-xl hover:border-blue-400/50 transition-all text-left">
              <div className="text-[11px] text-slate-300 font-semibold flex items-center gap-1">
                🤖 <span>AI Copilot</span>
              </div>
              <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" /> Active
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/15 animate-float-delayed shadow-xl hover:border-blue-400/50 transition-all text-left">
              <div className="text-[11px] text-slate-300 font-semibold flex items-center gap-1">
                📊 <span>Campus Health</span>
              </div>
              <div className="text-xs font-bold text-white mt-1">96%</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/15 animate-float-subtle shadow-xl hover:border-blue-400/50 transition-all text-left">
              <div className="text-[11px] text-slate-300 font-semibold flex items-center gap-1">
                🎓 <span>Placement</span>
              </div>
              <div className="text-xs font-bold text-white mt-1">88%</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/15 animate-float-subtle-delayed shadow-xl hover:border-blue-400/50 transition-all text-left">
              <div className="text-[11px] text-slate-300 font-semibold flex items-center gap-1">
                📈 <span>Attendance</span>
              </div>
              <div className="text-xs font-bold text-white mt-1">91%</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/15 animate-float shadow-xl hover:border-blue-400/50 transition-all text-left">
              <div className="text-[11px] text-slate-300 font-semibold flex items-center gap-1">
                🏠 <span>Hostel AI</span>
              </div>
              <div className="text-xs font-bold text-blue-400 mt-1">Running</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/15 animate-float-delayed shadow-xl hover:border-blue-400/50 transition-all text-left">
              <div className="text-[11px] text-slate-300 font-semibold flex items-center gap-1">
                📚 <span>Knowledge</span>
              </div>
              <div className="text-xs font-bold text-sky-400 mt-1">Ready</div>
            </div>
          </div>
        </div>
      </section>

      {/* Built for Modern Higher Education Section (No Fake University Names!) */}
      <section className="py-20 bg-slate-900 border-y border-white/10 text-white relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Institutions & Campuses
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Built for Modern Higher Education
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-base sm:text-lg mb-12">
            Designed to support institutions of every size through AI-powered learning, intelligent administration, and smart campus operations.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {institutionsList.map((inst) => (
              <div
                key={inst.title}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/40 hover:bg-white/10 transition-all duration-300 group hover:-translate-y-1 shadow-lg hover:shadow-blue-500/15 text-center flex flex-col items-center justify-center"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                  {inst.icon}
                </div>
                <h4 className="font-bold text-white text-base mb-1">
                  {inst.title}
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {inst.tag}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Macbook Hero Illustration */}
      <section className="relative px-6 pb-28">
        <div className="max-w-5xl mx-auto relative flex justify-center">
          {/* MacBook Mockup container */}
          <div className="relative w-full max-w-[900px] bg-slate-900 p-3 pb-8 rounded-t-[36px] rounded-b-[12px] shadow-2xl border border-slate-800 transform rotate-x-12 animate-float">
            {/* Screen border gloss */}
            <div className="absolute inset-x-0 top-0 h-1 bg-white/10 rounded-t-[36px]" />
            {/* Screen Inner Frame */}
            <div className="relative rounded-[20px] overflow-hidden bg-white border-[4px] border-slate-950 aspect-[16/10] w-full">
              {/* Dashboard Layout inside screen */}
              <div className="flex flex-col h-full bg-slate-50 text-slate-800 text-[10px]">
                {/* Dashboard top bar */}
                <div className="h-8 bg-white border-b border-slate-200 flex items-center justify-between px-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 block" />
                    <span className="h-4 w-px bg-slate-200 ml-2" />
                    <span className="font-bold text-slate-700 tracking-tight ml-1">CampusOS AI</span>
                    <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-semibold border border-blue-100 ml-2">Core OS v2.4</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 rounded-md px-2 py-0.5 w-32 border border-slate-200">
                    <Search className="w-2.5 h-2.5 text-slate-400" />
                    <span className="text-slate-400 text-[8px]">Ask anything...</span>
                  </div>
                </div>

                {/* Dashboard Grid Content */}
                <div className="flex-1 p-3 overflow-hidden grid grid-cols-12 gap-3">
                  {/* Left Sidebar inside Mockup */}
                  <div className="col-span-3 bg-white border border-slate-200/80 rounded-xl p-2 flex flex-col gap-1.5">
                    <div className="bg-slate-50 rounded-lg p-1.5 flex items-center gap-1.5 border border-slate-200">
                      <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center"><Activity className="w-2.5 h-2.5 text-blue-600" /></div>
                      <div>
                        <div className="font-bold text-[8px]">Campus Central</div>
                        <div className="text-[6px] text-slate-400">All Agents active</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 font-medium">Dashboard Overview</span>
                      <span className="px-2 py-1 rounded text-slate-500 hover:bg-slate-50">Attendance Forecast</span>
                      <span className="px-2 py-1 rounded text-slate-500 hover:bg-slate-50">Placement Pipeline</span>
                      <span className="px-2 py-1 rounded text-slate-500 hover:bg-slate-50">Hostel Health</span>
                      <span className="px-2 py-1 rounded text-slate-500 hover:bg-slate-50">Transport Utilization</span>
                      <span className="px-2 py-1 rounded text-slate-500 hover:bg-slate-50">AI Settings</span>
                    </div>
                  </div>

                  {/* Main contents inside Mockup */}
                  <div className="col-span-9 flex flex-col gap-3">
                    {/* Welcome Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-3 text-white flex justify-between items-center shadow-md">
                      <div>
                        <h4 className="font-bold text-xs">University Command Control</h4>
                        <p className="text-[8px] text-blue-100">AI engines processing student performance, hostel occupancy, and predictive workflows.</p>
                      </div>
                      <span className="text-[8px] font-bold bg-white/20 px-2 py-0.5 rounded-full border border-white/10">Active System</span>
                    </div>

                    {/* mini widgets */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
                        <span className="text-slate-400 block text-[7px] uppercase font-bold tracking-wider">Attendance Alert</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="font-bold text-base text-red-500">74.2%</span>
                          <span className="text-[6px] text-slate-400">Predicted Sem Drop</span>
                        </div>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
                        <span className="text-slate-400 block text-[7px] uppercase font-bold tracking-wider">Placement Score</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="font-bold text-base text-blue-600">88.5%</span>
                          <span className="text-[6px] text-green-500">Top 5% ready</span>
                        </div>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
                        <span className="text-slate-400 block text-[7px] uppercase font-bold tracking-wider">Hostel Analytics</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="font-bold text-base text-indigo-600">96%</span>
                          <span className="text-[6px] text-slate-400">Demand spike alert</span>
                        </div>
                      </div>
                    </div>

                    {/* Chart preview */}
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex-1 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[8px]">Student Placement readiness trends</span>
                        <span className="text-[6px] text-blue-600 font-bold bg-blue-50 px-1 py-0.5 rounded border border-blue-100">Live Forecast Model</span>
                      </div>
                      <div className="flex-1 flex items-end gap-1.5 pt-1.5 h-16">
                        <div className="w-full bg-slate-100 rounded-t h-[40%] flex justify-center text-[5px] text-slate-400 items-start pt-1">2023</div>
                        <div className="w-full bg-slate-100 rounded-t h-[60%] flex justify-center text-[5px] text-slate-400 items-start pt-1">2024</div>
                        <div className="w-full bg-blue-500 rounded-t h-[80%] flex justify-center text-[5px] text-white items-start pt-1 font-bold">2025</div>
                        <div className="w-full bg-gradient-to-t from-blue-600 to-indigo-600 rounded-t h-[95%] flex justify-center text-[5px] text-white items-start pt-1 font-bold">2026</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Keyboard hinge details */}
            <div className="absolute inset-x-0 bottom-1 h-3 bg-slate-800 rounded-b-md mx-6 border-t border-slate-700" />
            <div className="absolute bottom-0 inset-x-0 h-1.5 bg-slate-900 rounded-b-[12px] flex justify-center">
              <span className="w-16 h-1 bg-slate-700 rounded-full block -mt-[1px]" />
            </div>
          </div>

          {/* Floating Prediction Cards surrounding the laptop */}
          {/* Card 1: Attendance prediction */}
          <div className="absolute -left-12 top-10 md:top-20 glass-panel-light p-4 rounded-[20px] shadow-xl border border-slate-200 max-w-[200px] animate-float-subtle-delayed z-20 hover:scale-105 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Attendance Alert</span>
            </div>
            <p className="text-xs font-semibold text-slate-800 mb-1">Student ID #9204 attendance drops to <span className="text-red-500 font-bold">71.8%</span> next week.</p>
            <span className="text-[9px] text-slate-400">Academic Agent: Triggering waiver draft...</span>
          </div>

          {/* Card 2: Placement recommendation */}
          <div className="absolute -right-16 top-4 md:top-12 glass-panel-light p-4 rounded-[20px] shadow-xl border border-slate-200 max-w-[220px] animate-float-subtle z-20 hover:scale-105 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-md bg-blue-100 text-blue-600"><Sparkles className="w-3.5 h-3.5" /></div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 font-bold">AI Recommendation</span>
            </div>
            <p className="text-xs font-semibold text-slate-800 mb-2">91% Placement match for TCS drives. Ready for resume push.</p>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">Confidence: 94%</span>
            </div>
          </div>

          {/* Card 3: Campus health alert */}
          <div className="absolute -bottom-8 left-4 md:-left-8 glass-panel-light p-4 rounded-[20px] shadow-xl border border-slate-200 max-w-[210px] animate-float z-20 hover:scale-105 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded bg-indigo-50 text-indigo-600"><TrendingUp className="w-3.5 h-3.5" /></div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Campus Health</span>
            </div>
            <p className="text-xs font-semibold text-slate-800 mb-1">Hostel Mess D: Food waste predicted to drop by <span className="text-green-600 font-bold">24%</span> using demand models.</p>
            <span className="text-[9px] text-slate-400">Automation: Optimized food prep logs</span>
          </div>

          {/* Card 4: Agent Active log */}
          <div className="absolute -bottom-10 right-4 md:-right-8 glass-panel-light p-4 rounded-[20px] shadow-xl border border-slate-200 max-w-[200px] animate-float-delayed z-20 hover:scale-105 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded bg-emerald-50 text-emerald-600"><Activity className="w-3.5 h-3.5" /></div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Knowledge Search</span>
            </div>
            <p className="text-xs font-semibold text-slate-800 mb-1">Retrieval Augmented Policy matches found in Clause 12.A</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-600 uppercase">Agent Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-white border-y border-slate-200/80 py-20 px-6 relative z-30 shadow-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 text-center divide-x divide-slate-100">
          <div className="flex flex-col items-center">
            <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
              {stats.universities}+
            </h3>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Institutions Supported</p>
          </div>
          <div className="flex flex-col items-center pt-4 md:pt-0">
            <h3 className="text-4xl md:text-5xl font-extrabold text-blue-600 tracking-tight mb-2">
              {stats.students}K+
            </h3>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Students Managed</p>
          </div>
          <div className="flex flex-col items-center pt-4 md:pt-0">
            <h3 className="text-4xl md:text-5xl font-extrabold text-indigo-600 tracking-tight mb-2">
              {stats.modules}+
            </h3>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Microservices</p>
          </div>
          <div className="flex flex-col items-center pt-4 md:pt-0">
            <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
              {stats.automation}%
            </h3>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Logistics Automation</p>
          </div>
          <div className="flex flex-col items-center pt-4 md:pt-0">
            <h3 className="text-4xl md:text-5xl font-extrabold text-emerald-600 tracking-tight mb-2">
              {stats.accuracy}%
            </h3>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prediction Accuracy</p>
          </div>
        </div>
      </section>

      {/* Feature Section: Bento Grid */}
      <section id="features" className="py-24 md:py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Unified Intelligent Campus <span className="gradient-text-blue">Bento Suite</span>
          </h2>
          <p className="text-base text-slate-500 font-normal leading-relaxed">
            One core campus operating system integrating all functional wings of university life with machine learning, RAG, and automated pipelines.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: AI Student Success */}
          <div className="md:col-span-8 glass-card-light rounded-[20px] p-8 flex flex-col justify-between overflow-hidden relative group">
            <div className="max-w-md relative z-10">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-6 border border-blue-100">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">AI Student Success Suite</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Automated risk assessment algorithms monitor academic performance, attendance, and exam marks. Predict dropouts before they happen and dispatch automated support alerts.
              </p>
            </div>
            {/* Simple Graphic */}
            <div className="flex gap-2 self-start bg-slate-100/80 p-2.5 rounded-xl border border-slate-200/40 mt-4 text-xs font-semibold relative z-10">
              <span className="text-blue-600 font-bold bg-white px-2 py-1 rounded shadow-sm border border-slate-200/50">Predictive GPA</span>
              <span className="text-slate-500 px-2 py-1">Risk Models Active</span>
              <span className="text-slate-500 px-2 py-1">RAG Support Active</span>
            </div>
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
          </div>

          {/* Card 2: Academic Intelligence */}
          <div className="md:col-span-4 glass-card-light rounded-[20px] p-8 flex flex-col justify-between overflow-hidden relative group">
            <div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-6 border border-indigo-100">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Academic Intelligence</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Smart curriculum generation, automated grading, syllabus compliance audits, and AI lesson planner integrations.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Card 3: Hostel Intelligence */}
          <div className="md:col-span-4 glass-card-light rounded-[20px] p-8 flex flex-col justify-between overflow-hidden relative group">
            <div>
              <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl w-fit mb-6 border border-sky-100">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Hostel Intelligence</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Occupancy optimization, room allotment modeling, maintenance predictive triggers, and water/waste monitoring.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Card 4: Placement AI */}
          <div className="md:col-span-8 glass-card-light rounded-[20px] p-8 flex flex-col justify-between overflow-hidden relative group">
            <div className="max-w-md relative z-10">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-6 border border-emerald-100">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Placement AI & Prep Engine</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Direct resume parsing and parsing vectors, matching students with hiring drives, scheduling automated interviews, and evaluating score maps dynamically against recruiters criteria.
              </p>
            </div>
            <div className="flex gap-2 self-start bg-slate-100/80 p-2.5 rounded-xl border border-slate-200/40 mt-4 text-xs font-semibold relative z-10">
              <span className="text-emerald-600 font-bold bg-white px-2 py-1 rounded shadow-sm border border-slate-200/50">92% Prep Match</span>
              <span className="text-slate-500 px-2 py-1">Resume Vectorized</span>
              <span className="text-slate-500 px-2 py-1">Mock Interview Rated</span>
            </div>
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
          </div>

          {/* Card 5: Library AI */}
          <div className="md:col-span-4 glass-card-light rounded-[20px] p-8 flex flex-col justify-between overflow-hidden relative group">
            <div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-6 border border-amber-100">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Library AI</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                RAG search vectors indexing university paper vaults. Recommendation systems predicting textbook requirements and issue logs.
              </p>
            </div>
          </div>

          {/* Card 6: Finance AI */}
          <div className="md:col-span-4 glass-card-light rounded-[20px] p-8 flex flex-col justify-between overflow-hidden relative group">
            <div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit mb-6 border border-purple-100">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Finance AI</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Automated student fee collection projections, budget forecasts, scholarship matching engines, and billing reconciliation pipelines.
              </p>
            </div>
          </div>

          {/* Card 7: Transport AI */}
          <div className="md:col-span-4 glass-card-light rounded-[20px] p-8 flex flex-col justify-between overflow-hidden relative group">
            <div>
              <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl w-fit mb-6 border border-sky-100">
                <Bus className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Transport AI</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Smart shuttle routing, predictive demand logging, bus occupancy sensors, and dynamic scheduling based on real-time class timetables.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Agents Section */}
      <section id="agents" className="bg-slate-100/60 border-y border-slate-200/80 py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3.5 py-1.5 rounded-full border border-blue-200/60 uppercase tracking-widest mb-4 inline-block shadow-sm">Autonomous Systems</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Autonomous AI Agent Fleet
            </h2>
            <p className="text-base text-slate-500 font-normal leading-relaxed">
              Every department features dedicated autonomous AI Agents performing backend workflows, compliance checks, and optimization loops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Agent Cards */}
            {[
              { name: 'Student Success Agent', status: 'Running', health: '99.4%', confidence: '98%', tasks: '1,424/day', last: '2s ago', color: 'border-blue-200' },
              { name: 'Academic Auditor Agent', status: 'Running', health: '98.7%', confidence: '99%', tasks: '852/day', last: '12s ago', color: 'border-indigo-200' },
              { name: 'Hostel Mess Optimizer', status: 'Running', health: '97.2%', confidence: '94%', tasks: '24/day', last: '1m ago', color: 'border-sky-200' },
              { name: 'Placement Matcher Agent', status: 'Running', health: '99.1%', confidence: '96%', tasks: '4,102/day', last: '5s ago', color: 'border-emerald-200' },
              { name: 'Library RAG Searcher', status: 'Running', health: '100%', confidence: '97%', tasks: '12,410/day', last: '1s ago', color: 'border-slate-200' },
              { name: 'Transport Dispatcher Agent', status: 'Running', health: '95.6%', confidence: '91%', tasks: '312/day', last: '42s ago', color: 'border-orange-200' },
              { name: 'Finance Reconciliation Agent', status: 'Running', health: '99.9%', confidence: '99.8%', tasks: '562/day', last: '10s ago', color: 'border-purple-200' },
              { name: 'Knowledge Graph Agent', status: 'Running', health: '99.5%', confidence: '98.5%', tasks: '3,842/day', last: '3s ago', color: 'border-cyan-200' }
            ].map((agent, i) => (
              <div key={i} className={`glass-card-light rounded-2xl p-6 border ${agent.color} relative overflow-hidden flex flex-col justify-between h-64 group shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-base text-slate-800 max-w-[140px] leading-tight">{agent.name}</h3>
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block animate-pulse" />
                      {agent.status}
                    </span>
                  </div>

                  <div className="space-y-2 mt-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Health Score</span>
                      <span className="font-semibold text-slate-700">{agent.health}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Model Confidence</span>
                      <span className="font-semibold text-slate-700">{agent.confidence}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tasks Executed</span>
                      <span className="font-semibold text-slate-700">{agent.tasks}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Last activity</span>
                  <span className="font-semibold text-slate-500 font-mono">{agent.last}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Campus Intelligence Dashboard / Charts */}
      <section id="intelligence" className="py-24 md:py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200/60 uppercase tracking-widest mb-4 inline-block">Predictive Engine</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Campus Intelligence & Analytics
          </h2>
          <p className="text-base text-slate-500 font-normal leading-relaxed">
            Real-time data visualization showing forecast models generated by CampusOS machine learning microservices.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Chart 1: Attendance prediction */}
          <div className="lg:col-span-8 glass-card-light rounded-[20px] p-6 flex flex-col justify-between h-[380px]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Student Attendance Prediction</h3>
                  <p className="text-xs text-slate-400">Predicted versus actual attendance vectors showing upcoming midterm eligibility drops.</p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">Live Forecast</span>
              </div>
            </div>
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} domain={[60, 90]} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, borderColor: '#e2e8f0' }} />
                  <Area type="monotone" dataKey="actual" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorActual)" name="Actual Attendance" />
                  <Area type="monotone" dataKey="predicted" stroke="#4F46E5" strokeDasharray="5 5" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPredicted)" name="ML Forecast Model" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Resource Utilization Pie chart */}
          <div className="lg:col-span-4 glass-card-light rounded-[20px] p-6 flex flex-col justify-between h-[380px]">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Resource Utilization Index</h3>
              <p className="text-xs text-slate-400">Current active campus utility weights.</p>
            </div>
            <div className="flex-1 flex justify-center items-center relative">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={utilizationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {utilizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-slate-800">80.4%</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Avg Utility</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-4">
              {utilizationData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-500">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 3: Food demand Bar Chart */}
          <div className="lg:col-span-6 glass-card-light rounded-[20px] p-6 flex flex-col justify-between h-[320px]">
            <div>
              <h3 className="font-bold text-base text-slate-800">Hostel Mess D - Food Demand Curve</h3>
              <p className="text-xs text-slate-400">Hourly food servings logs mapped to predict optimal buffer waste.</p>
            </div>
            <div className="flex-1 min-h-[180px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={foodDemandData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  <Bar dataKey="demand" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Servings Demanded" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Placement Readiness timeline */}
          <div className="lg:col-span-6 glass-card-light rounded-[20px] p-6 flex flex-col justify-between h-[320px]">
            <div>
              <h3 className="font-bold text-base text-slate-800">Placement Success Forecast</h3>
              <p className="text-xs text-slate-400">Timeline metric matching student portfolio readiness to hiring thresholds.</p>
            </div>
            <div className="flex-1 min-h-[180px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={placementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="year" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} domain={[80, 100]} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  <Line type="monotone" dataKey="placement" stroke="#4F46E5" strokeWidth={3} activeDot={{ r: 6 }} name="Placement Success %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* AI Copilot Section (Microsoft Copilot Clone Interface) */}
      <section id="copilot" className="bg-white border-y border-slate-200/80 py-24 md:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200/60 uppercase tracking-widest mb-4 inline-block">University Copilot</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Interactive AI Copilot
            </h2>
            <p className="text-base text-slate-500 font-normal leading-relaxed">
              Experience the core generative AI assistant. Ask policies, request logistics modifications, or draft academic summaries.
            </p>
          </div>

          {/* Chat Container Mockup */}
          <div className="bg-slate-50 border border-slate-200 rounded-[24px] shadow-xl overflow-hidden flex flex-col h-[550px] relative max-w-4xl mx-auto">
            {/* Copilot Header */}
            <div className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/10">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">CampusOS AI Copilot</h3>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block animate-pulse" />
                    RAG-indexed to current course manuals
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 font-mono">GPT-4 / Claude-3.5 API</span>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-xl rounded-[20px] p-4 text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-800 shadow-sm'}`}>
                    <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                    
                    {/* Render advisory details if response contains them */}
                    {msg.details && (
                      <div className="mt-4 border-t border-slate-100 pt-3 space-y-3 text-xs text-slate-700">
                        <div className="flex items-center gap-1.5 text-blue-600 font-bold uppercase tracking-wider text-[10px]">
                          <Shield className="w-3.5 h-3.5" />
                          {msg.details.title}
                        </div>
                        <div>
                          <strong className="block text-slate-900 mb-0.5">Prediction Advisory:</strong>
                          <span>{msg.details.prediction}</span>
                        </div>
                        <div>
                          <strong className="block text-slate-900 mb-0.5">Policy Check:</strong>
                          <span className="italic">{msg.details.policy}</span>
                        </div>
                        <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                          <div>
                            <strong className="block text-slate-900 text-[9px]">NEXT ACTION</strong>
                            <span>{msg.details.action}</span>
                          </div>
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                            Confidence: {msg.details.confidence}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-[20px] px-4 py-3 shadow-sm flex items-center gap-1 text-slate-400">
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Presets / Prompts suggestions */}
            <div className="px-6 pb-2 pt-1 flex flex-wrap gap-2 justify-center">
              {presetQueries.map((query, i) => (
                <button
                  key={i}
                  onClick={() => handleCopilotSubmit(query)}
                  className="bg-white hover:bg-slate-100 hover:border-slate-300 text-slate-600 border border-slate-200 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-all"
                >
                  {query}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask CampusOS Copilot (e.g. My attendance is 71%, can I write exams?)..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCopilotSubmit(chatInput)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all outline-none"
              />
              <button
                onClick={() => handleCopilotSubmit(chatInput)}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/15 transition-all flex items-center justify-center"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Previews Section */}
      <section className="py-24 md:py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold bg-sky-100 text-sky-700 px-3 py-1 rounded-full border border-sky-200/60 uppercase tracking-widest mb-4 inline-block">Portals Preview</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Tailored Role Dashboards
          </h2>
          <p className="text-base text-slate-500 font-normal leading-relaxed">
            CampusOS adapts its layout to suit whichever role is logging in. Toggle between profiles to inspect interface configurations.
          </p>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { id: 'student', label: 'Student Portal' },
            { id: 'faculty', label: 'Faculty Portal' },
            { id: 'admin', label: 'Admin Command Control' },
            { id: 'placement', label: 'Placement Cell Hub' },
            { id: 'hostel', label: 'Hostel warden panel' },
            { id: 'finance', label: 'Bursar & Finance Desk' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDashboardTab(tab.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                activeDashboardTab === tab.id
                  ? 'bg-blue-600 text-white shadow-blue-500/10'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Browser Mockup container showing active dashboard */}
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-2xl overflow-hidden aspect-[16/10] w-full max-w-4xl mx-auto">
          {/* Browser Header */}
          <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400 block" />
              <span className="w-3 h-3 rounded-full bg-yellow-400 block" />
              <span className="w-3 h-3 rounded-full bg-green-400 block" />
              <span className="h-4 w-px bg-slate-200 ml-2" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Live Sandbox Mockup</span>
            </div>
            <div className="bg-white border border-slate-200 text-[10px] text-slate-500 rounded px-4 py-1 flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-slate-400" />
              <span>https://{activeDashboardTab}.campusos.ai/dashboard</span>
            </div>
            <div className="w-16" />
          </div>

          {/* Browser content rendering based on active tab */}
          <div className="p-6 bg-slate-50 h-full overflow-y-auto text-xs">
            {activeDashboardTab === 'student' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Student Portal Dashboard</h3>
                    <p className="text-xs text-slate-400">Welcome, John Doe (Sem V, Computer Science)</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">Active Attendance: 87.5%</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">PLACEMENT READINESS</h4>
                    <p className="text-2xl font-extrabold text-blue-600">78.5%</p>
                    <span className="text-[9px] text-slate-400 block mt-2">Resume optimization active</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">LIBRARY BOOK DUE</h4>
                    <p className="text-2xl font-extrabold text-slate-800">0 Books</p>
                    <span className="text-[9px] text-green-600 block mt-2">Zero fines pending</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">HOSTEL COMPLAINTS</h4>
                    <p className="text-2xl font-extrabold text-amber-500">1 Open</p>
                    <span className="text-[9px] text-slate-400 block mt-2">Warden processing priority</span>
                  </div>
                </div>
              </div>
            )}

            {activeDashboardTab === 'faculty' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Faculty Advisory Command</h3>
                    <p className="text-xs text-slate-400">Welcome back, Dr. Sarah Jenkins (Professor, CS Dept)</p>
                  </div>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">Syllabus compliance: 94%</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">STUDENTS AT RISK</h4>
                    <p className="text-2xl font-extrabold text-red-500">12 Students</p>
                    <span className="text-[9px] text-slate-400 block mt-2">Predicted attendance failure alerts</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">QUIZZES GENERATED</h4>
                    <p className="text-2xl font-extrabold text-indigo-600">4 Active</p>
                    <span className="text-[9px] text-slate-400 block mt-2">Auto assessment models active</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">RESEARCH GRANTS STATUS</h4>
                    <p className="text-2xl font-extrabold text-emerald-600">2 Approved</p>
                    <span className="text-[9px] text-slate-400 block mt-2">RAG mapping match found</span>
                  </div>
                </div>
              </div>
            )}

            {activeDashboardTab === 'admin' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">University Admin Command Control</h3>
                    <p className="text-xs text-slate-400">Super Administrator dashboard (Unified Campus System)</p>
                  </div>
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold">Total active API load: 2.1M logs</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm col-span-2">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">TOTAL DATA INGESTION</h4>
                    <p className="text-2xl font-extrabold text-slate-800">4,124 GB / week</p>
                    <span className="text-[9px] text-slate-400 block mt-2">Realtime ingestion queues functioning</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">ACTIVE AI AGENTS</h4>
                    <p className="text-2xl font-extrabold text-blue-600">8 running</p>
                    <span className="text-[9px] text-emerald-600 block mt-2">100% Agent health logs</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">API ERRORS</h4>
                    <p className="text-2xl font-extrabold text-green-600">0%</p>
                    <span className="text-[9px] text-slate-400 block mt-2">Last occurrence: 3d ago</span>
                  </div>
                </div>
              </div>
            )}

            {activeDashboardTab === 'placement' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Placement Cell Dashboard</h3>
                    <p className="text-xs text-slate-400">Coordinators Hub – Placement Season 2026</p>
                  </div>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">95% Placement Clearance Ratio</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">COMPANIES COMMITTED</h4>
                    <p className="text-2xl font-extrabold text-slate-800">42 Brands</p>
                    <span className="text-[9px] text-slate-400 block mt-2">TCS, Microsoft, Stripe onboarding</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">STUDENTS VERIFIED</h4>
                    <p className="text-2xl font-extrabold text-emerald-600">482 / 500</p>
                    <span className="text-[9px] text-slate-400 block mt-2">Eligibility policies automated</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">INTERVIEWS SCHEDULED</h4>
                    <p className="text-2xl font-extrabold text-indigo-600">120 Today</p>
                    <span className="text-[9px] text-slate-400 block mt-2">Mock score matching feedback</span>
                  </div>
                </div>
              </div>
            )}

            {activeDashboardTab === 'hostel' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Hostel & Mess Warden Desk</h3>
                    <p className="text-xs text-slate-400">Warden Operations (Hostel Blocks A-E)</p>
                  </div>
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold">Mess Occupancy: 84% peak</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">MAINTENANCE TICKETS</h4>
                    <p className="text-2xl font-extrabold text-red-500">4 Pending</p>
                    <span className="text-[9px] text-slate-400 block mt-2">AI allocated plumber dispatch</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">MESS WASTE FORECAST</h4>
                    <p className="text-2xl font-extrabold text-green-600">-24% Buffer</p>
                    <span className="text-[9px] text-slate-400 block mt-2">Food savings active this week</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">ROOM ALLOTMENT UTILIZATION</h4>
                    <p className="text-2xl font-extrabold text-blue-600">98.2%</p>
                    <span className="text-[9px] text-slate-400 block mt-2">Vacancy auto reconciled</span>
                  </div>
                </div>
              </div>
            )}

            {activeDashboardTab === 'finance' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Finance & Bursar Desk</h3>
                    <p className="text-xs text-slate-400">University Financial reconciliation</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">Dues Cleared: 99.1%</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">OUTSTANDING TUITION DUES</h4>
                    <p className="text-2xl font-extrabold text-slate-800">$14,240</p>
                    <span className="text-[9px] text-slate-400 block mt-2">Automatic alerts drafted</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">SCHOLARSHIP FUNDS ALLOCATED</h4>
                    <p className="text-2xl font-extrabold text-emerald-600">$120,400</p>
                    <span className="text-[9px] text-slate-400 block mt-2">Auto portfolio validation matches</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">SALARY BURSARY LOG</h4>
                    <p className="text-2xl font-extrabold text-indigo-600">Reconciled</p>
                    <span className="text-[9px] text-slate-400 block mt-2">All checks cleared v2.0</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Workflow Section (Node workflow diagram) */}
      <section className="bg-slate-100/50 border-y border-slate-200/80 py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200/60 uppercase tracking-widest mb-4 inline-block">Workflow Automation</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Decentralized Agent Workflow
            </h2>
            <p className="text-base text-slate-500 font-normal leading-relaxed">
              How CampusOS processes a complex query in the background. Node connections demonstrate how specialized neural agents communicate to output decisions.
            </p>
          </div>

          {/* Workflow Diagram */}
          <div className="relative border border-slate-200 bg-white rounded-[24px] p-8 md:p-12 shadow-lg overflow-x-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 min-w-[800px]">
              {workflowNodes.map((node, i) => (
                <div key={node.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center text-center relative z-10 w-full">
                    {/* Node Circle */}
                    <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-600 flex items-center justify-center font-bold text-blue-600 shadow-md shadow-blue-500/10 mb-3 animate-pulse-ring">
                      {i + 1}
                    </div>
                    {/* Label */}
                    <h4 className="font-bold text-xs text-slate-800 mb-1 leading-tight">{node.label}</h4>
                    {/* Subtext */}
                    <p className="text-[10px] text-slate-400 max-w-[120px] leading-relaxed">{node.desc}</p>
                  </div>

                  {/* Flow Arrow (except last) */}
                  {i < workflowNodes.length - 1 && (
                    <div className="hidden md:block flex-1 h-[2px] bg-gradient-to-r from-blue-500 to-blue-200/20 relative mx-2">
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t-2 border-r-2 border-blue-400 rotate-45 transform" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 md:py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Loved by Academic Leaders
          </h2>
          <p className="text-base text-slate-500 font-normal leading-relaxed">
            Leading Vice Chancellors, Bursars, and academic coordinators report immediate operational savings and grade optimization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote: "Implementing CampusOS AI slashed mess wastage by 24% and allowed us to predict exam dropouts, saving 200+ students from failing this semester alone.",
              author: "Dr. Sarah Jenkins",
              role: "Dean of Academic Affairs, Faculty of Science",
              rating: 5,
              photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"
            },
            {
              quote: "The automated placement readiness engine vectorizes profiles and mocks interviews. Our placement percentage rose from 84% to 94% in a single season.",
              author: "Prof. Alan Vance",
              role: "Placement Director, Department of Engineering",
              rating: 5,
              photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120"
            },
            {
              quote: "Bursar operations are now hands-free. The AI Reconciliation Agent handles billing and coordinates tuition installment requests autonomously.",
              author: "Emily Stone",
              role: "Chief Financial Officer, University Administration",
              rating: 5,
              photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120"
            }
          ].map((test, i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative hover:-translate-y-1">
              <div>
                {/* Stars */}
                <div className="flex gap-1 mb-6 text-amber-400">
                  {Array.from({ length: test.rating }).map((_, s) => (
                    <span key={s}>★</span>
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-8 italic">"{test.quote}"</p>
              </div>
              <div className="flex items-center gap-4 border-t border-slate-100 pt-6">
                <img src={test.photo} alt={test.author} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">{test.author}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">{test.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-slate-100/50 border-y border-slate-200/80 py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200/60 uppercase tracking-widest mb-4 inline-block">Simple Pricing</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Flexible Tiers for Every Campus
            </h2>
            <p className="text-base text-slate-500 font-normal leading-relaxed">
              Deploy modular AI setups to scale campus management control with ease.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                name: 'Starter Edition',
                desc: 'Perfect for local vocational centers and single academies.',
                price: '$499',
                period: '/month',
                features: ['AI Student Success (Up to 500 profiles)', 'Library AI Indexer', '2 Autonomous AI Agents', 'Standard dashboard interface', 'Email Support'],
                btn: 'Start Free Sandbox',
                popular: false
              },
              {
                name: 'Professional',
                desc: 'Built for standard colleges demanding optimization.',
                price: '$1,499',
                period: '/month',
                features: ['AI Student Success (Up to 5k profiles)', 'Hostel Mess & Bus dispatcher', '6 Autonomous AI Agents', 'Live Copilot integration', '24/7 Priority Support'],
                btn: 'Deploy to Campus',
                popular: true
              },
              {
                name: 'Enterprise Hub',
                desc: 'Tailored for major multi-campus university networks.',
                price: '$3,999',
                period: '/month',
                features: ['Unlimited Student Profiles', 'Full Bento suite modules', 'All 8 AI Agents + custom model building', 'Dedicated Account Manager', 'Custom on-prem LLM setup'],
                btn: 'Contact sales desk',
                popular: false
              },
              {
                name: 'University Edition',
                desc: 'Fully managed campus deployment with hardware node mapping.',
                price: 'Custom',
                period: ' annual licensing',
                features: ['Custom on-premise cloud infrastructure', 'IoT hardware nodes integration', 'Autonomous bus camera API control', 'Unlimited active agents mapping', 'SLA guaranteed deployment audits'],
                btn: 'Schedule Campus Audit',
                popular: false
              }
            ].map((tier, i) => (
              <div
                key={i}
                className={`bg-white border rounded-2xl p-7 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  tier.popular
                    ? 'border-2 border-blue-600 shadow-xl shadow-blue-500/10'
                    : 'border-slate-200/80'
                }`}
              >
                {tier.popular && (
                  <span className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl border-l border-b border-blue-700 shadow-sm">
                    Recommended
                  </span>
                )}
                <div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">{tier.name}</h3>
                  <p className="text-slate-400 text-xs mb-6">{tier.desc}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-extrabold text-slate-900">{tier.price}</span>
                    <span className="text-slate-400 text-xs font-semibold">{tier.period}</span>
                  </div>
                  <hr className="border-slate-100 mb-6" />
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feat, f) => (
                      <li key={f} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to="/dashboard"
                  className={`w-full text-center py-3 rounded-full text-xs font-semibold transition-all shadow-sm ${
                    tier.popular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {tier.btn}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 md:py-32 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-slate-500 font-normal leading-relaxed">
            All you need to know about setting up CampusOS AI on your local university systems.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Does this replace our existing Student ERP (e.g. Banner, PeopleSoft)?",
              a: "No. CampusOS AI functions as an intelligent wrapper operating on top of your existing database schemas. It connects via standard database ports or secure REST APIs, pulling profiles and updating forecast records without requiring a painful ERP migration."
            },
            {
              q: "How secure is the student data processing pipeline?",
              a: "We are SOC-2 Type II certified. All ML forecasting runs inside sandboxed virtual machines. No student record leaves your host networks unless explicitly requested through external models. We support complete on-premise local server hosting for high-security campus deployments."
            },
            {
              q: "What is the typical integration timeframe?",
              a: "A baseline integration linking your student registry and course catalogs takes under 7 business days. Custom agent workflow scripting and setting up transport schedules maps within 2 to 3 weeks."
            },
            {
              q: "How accurate are mess demand and bus optimization models?",
              a: "Typically, mess food waste models hit a 92% confidence score within 14 days of active log ingest. Shuttles reach 95% routing optimization index metrics after parsing one semesters worth of transit timetables."
            }
          ].map((faq, i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-[20px] shadow-sm overflow-hidden">
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full text-left px-6 py-5 flex items-center justify-between font-bold text-slate-800 text-sm md:text-base focus:outline-none"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${faqOpen === i ? 'rotate-180' : ''}`} />
              </button>
              {faqOpen === i && (
                <div className="px-6 pb-6 pt-1 text-slate-500 text-xs md:text-sm leading-relaxed border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 px-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[32px] p-8 md:p-16 text-white text-center flex flex-col items-center relative overflow-hidden shadow-2xl">
          {/* Subtle design elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none -z-10" />

          <span className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest mb-6 inline-block">Ready to deploy?</span>
          
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mb-6">
            Ready to Transform Your University with AI?
          </h2>
          <p className="text-base text-blue-100 max-w-xl mb-10 leading-relaxed">
            Deploy CampusOS AI core microservices to start reducing food waste, enhancing placement performance, and predicting course completion anomalies.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <Link
              to="/dashboard"
              className="px-8 py-4 bg-white hover:bg-slate-50 text-blue-600 font-bold rounded-full shadow-lg hover:shadow-xl transition-all text-base flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#faq"
              className="px-8 py-4 bg-blue-700/50 hover:bg-blue-700 text-white font-semibold rounded-full border border-blue-500/20 shadow-md transition-all text-base flex items-center justify-center gap-2"
            >
              Read Docs
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-16 px-6 relative z-30">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="font-bold text-xl tracking-tight text-slate-950">
                CampusOS <span className="text-blue-600 font-extrabold">AI</span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
              World class campus optimization control wrapper utilizing distributed machine learning, automated RAG pipelines, and agent workflows.
            </p>
          </div>

          {/* Links columns */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2 text-xs text-slate-500 font-medium">
              <li><a href="#features" className="hover:text-blue-600">Bento Features</a></li>
              <li><a href="#agents" className="hover:text-blue-600">Autonomous Agents</a></li>
              <li><a href="#intelligence" className="hover:text-blue-600">Analytics Suite</a></li>
              <li><a href="#copilot" className="hover:text-blue-600">Interactive Copilot</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">Developers</h4>
            <ul className="space-y-2 text-xs text-slate-500 font-medium">
              <li><a href="#" className="hover:text-blue-600">API Documentation</a></li>
              <li><a href="#" className="hover:text-blue-600">System Logs Core</a></li>
              <li><a href="#" className="hover:text-blue-600">Security VM Schema</a></li>
              <li><a href="#" className="hover:text-blue-600">GitHub Repository</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">Connect</h4>
            <ul className="space-y-2 text-xs text-slate-500 font-medium">
              <li><a href="#" className="hover:text-blue-600">University Blog</a></li>
              <li><a href="#" className="hover:text-blue-600">LinkedIn</a></li>
              <li><a href="#" className="hover:text-blue-600">Vercel Showcase</a></li>
              <li><a href="#" className="hover:text-blue-600">Support Desk</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-400 font-medium gap-4">
          <span>&copy; {new Date().getFullYear()} CampusOS AI Platform. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600">Terms of Service</a>
            <a href="#" className="hover:text-blue-600">Compliance audits (SOC-2)</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
