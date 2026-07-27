import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Settings,
  User,
  Menu,
  X,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const role = profile?.role || 'student';
  const fullName = profile?.full_name || 'User Name';

  // Format role label nicely
  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'student': return 'Student';
      case 'faculty': return 'Faculty Member';
      case 'admin': return 'Administrator';
      case 'hostel_warden': return 'Hostel Warden';
      case 'placement_officer': return 'Placement Officer';
      default: return 'User';
    }
  };

  // Define sidebar lists per role
  const getSidebarItems = (userRole: string): SidebarItem[] => {
    const studentItems: SidebarItem[] = [
      { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
      { name: 'AI Assistant', path: '/student/ai-assistant', icon: MessageSquare },
      { name: 'Academics', path: '/student/academics', icon: BookOpen },
      { name: 'Attendance', path: '/student/attendance', icon: CalendarCheck },
      { name: 'Exams', path: '/student/exams', icon: FileText },
      { name: 'Assignments', path: '/student/assignments', icon: FileEdit },
      { name: 'Library', path: '/student/library', icon: Library },
      { name: 'Transport', path: '/student/transport', icon: Bus },
      { name: 'Finance', path: '/student/finance', icon: DollarSign },
      { name: 'Clubs', path: '/student/clubs', icon: Users },
      { name: 'AI Insights', path: '/student/ai-insights', icon: Sparkles },
      { name: 'Settings', path: '/student/settings', icon: Settings },
      { name: 'Profile', path: '/student/profile', icon: User },
    ];

    const facultyItems: SidebarItem[] = [
      { name: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
      { name: 'AI Assistant', path: '/faculty/ai-assistant', icon: MessageSquare },
      { name: 'Academics', path: '/faculty/academics', icon: BookOpen },
      { name: 'Attendance', path: '/faculty/attendance', icon: CalendarCheck },
      { name: 'Exams', path: '/faculty/exams', icon: FileText },
      { name: 'Assignments', path: '/faculty/assignments', icon: FileEdit },
      { name: 'Settings', path: '/faculty/settings', icon: Settings },
      { name: 'Profile', path: '/faculty/profile', icon: User },
    ];

    const adminItems: SidebarItem[] = [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'AI Assistant', path: '/admin/ai-assistant', icon: MessageSquare },
      { name: 'Finance', path: '/admin/finance', icon: DollarSign },
      { name: 'Events', path: '/admin/events', icon: Calendar },
      { name: 'Notice Board', path: '/admin/notices', icon: Bell },
      { name: 'Student Clubs', path: '/admin/clubs', icon: Users },
      { name: 'Settings', path: '/admin/settings', icon: Settings },
      { name: 'Profile', path: '/admin/profile', icon: User },
    ];

    const wardenItems: SidebarItem[] = [
      { name: 'Dashboard', path: '/hostel/dashboard', icon: LayoutDashboard },
      { name: 'AI Assistant', path: '/hostel/ai-assistant', icon: MessageSquare },
      { name: 'Hostel Hub', path: '/hostel/hostel', icon: Home },
      { name: 'Notice Board', path: '/hostel/notices', icon: Bell },
      { name: 'Settings', path: '/hostel/settings', icon: Settings },
      { name: 'Profile', path: '/hostel/profile', icon: User },
    ];

    const placementItems: SidebarItem[] = [
      { name: 'Dashboard', path: '/placement/dashboard', icon: LayoutDashboard },
      { name: 'AI Assistant', path: '/placement/ai-assistant', icon: MessageSquare },
      { name: 'Placements', path: '/placement/placements', icon: Briefcase },
      { name: 'Settings', path: '/placement/settings', icon: Settings },
      { name: 'Profile', path: '/placement/profile', icon: User },
    ];

    switch (userRole) {
      case 'faculty': return facultyItems;
      case 'admin': return adminItems;
      case 'hostel_warden': return wardenItems;
      case 'placement_officer': return placementItems;
      case 'student':
      default:
        return studentItems;
    }
  };

  const sidebarItems = getSidebarItems(role);
  const homePath = `/${role === 'hostel_warden' ? 'hostel' : role === 'placement_officer' ? 'placement' : role}/dashboard`;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur-xl transition-transform duration-300 md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <Link to={homePath} className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </span>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              CampusOS <span className="text-indigo-500 font-extrabold">AI</span>
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
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-xs font-bold text-white shrink-0">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{fullName}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate">{getRoleLabel(role)}</p>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between h-16 px-6 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 rounded-md text-slate-400 hover:text-white md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Ask CampusOS anything..."
                className="w-80 pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-1.5 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-300 hover:text-white hover:border-slate-700 transition-colors">
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
              <Bell className="w-4 h-4" />
            </button>
            <div className="h-7 w-px bg-slate-800"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[10px]">
                {role}
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
  );
}
