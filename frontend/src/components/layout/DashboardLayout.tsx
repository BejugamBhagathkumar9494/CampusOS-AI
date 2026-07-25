import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  CalendarCheck,
  FileText,
  FileEdit,
  Library,
  Home,
  Bus,
  Briefcase,
  DollarSign,
  Calendar,
  Users,
  Bell,
  Search,
  SearchCode,
  Settings,
  User,
  Menu,
  X,
  Sparkles,
} from 'lucide-react'

interface SidebarItem {
  name: string
  path: string
  icon: React.ComponentType<any>
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const location = useLocation()

  const sidebarItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'AI Assistant', path: '/ai-assistant', icon: MessageSquare },
    { name: 'Academics', path: '/academics', icon: BookOpen },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { name: 'Exams', path: '/exams', icon: FileText },
    { name: 'Assignments', path: '/assignments', icon: FileEdit },
    { name: 'Library', path: '/library', icon: Library },
    { name: 'Hostel', path: '/hostel', icon: Home },
    { name: 'Transport', path: '/transport', icon: Bus },
    { name: 'Placements', path: '/placements', icon: Briefcase },
    { name: 'Finance', path: '/finance', icon: DollarSign },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Clubs', path: '/clubs', icon: Users },
    { name: 'Notices', path: '/notices', icon: Bell },
    { name: 'Research', path: '/research', icon: SearchCode },
    { name: 'AI Insights', path: '/ai-insights', icon: Sparkles },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Profile', path: '/profile', icon: User },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur-xl transition-transform duration-300 md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-6 h-6" />
            </span>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              CampusOS <span className="text-indigo-500">AI</span>
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <User className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">John Doe</p>
              <p className="text-[10px] text-slate-500">Student • Sem V</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between h-16 px-6 border-b border-slate-800 bg-slate-900/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 rounded-md text-slate-400 hover:text-white md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Ask CampusOS anything..."
                className="w-80 pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-800 bg-slate-950/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-1.5 rounded-lg border border-slate-800 bg-slate-950/30 text-slate-400 hover:text-white hover:border-slate-700 transition-colors">
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
              <Bell className="w-4 h-4" />
            </button>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                Active User
              </span>
            </div>
          </div>
        </header>

        {/* Content viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-950/30 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
