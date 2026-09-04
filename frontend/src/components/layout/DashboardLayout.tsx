import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  CalendarCheck,
  FileText,
  FileEdit,
  Library,
  Users,
  Bell,
  Search,
  Settings,
  User,
  Menu,
  X,
  Sparkles,
  LogOut,
  Briefcase,
  DollarSign,
  Calendar,
  GraduationCap,
  GitFork,
  Mic,
} from 'lucide-react';

import { useAuth } from '../../auth/hooks/useAuth';
import { notificationService } from '../../services/notificationService';
import { supabase } from '../../services/supabaseClient';
import { UserRole } from '../../types';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const role = profile?.role || 'student';
  const fullName = profile?.full_name || 'User';

  useEffect(() => {
    let isMounted = true;

    async function loadNotifs() {
      if (profile?.id) {
        try {
          const list = await notificationService.getNotifications(profile.id);
          if (isMounted) setNotifs(list);
        } catch (e) {
          console.warn('Failed to load notifications:', e);
        }
      }
    }

    loadNotifs();

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          if (profile?.id && payload.new.recipient_id === profile.id) {
            setNotifs((prev) => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  const markAllNotificationsRead = async () => {
    try {
      await Promise.all(notifs.map((n) => notificationService.markAsRead(n.id)));
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.warn('Mark read error:', e);
    }
  };

  const getRoleLabel = (r: UserRole | string) => {
    switch (r) {
      case 'student': return 'Student';
      case 'faculty': return 'Faculty Member';
      case 'admin': return 'Administrator';
      case 'placement_officer': return 'Placement Officer';
      case 'super_admin': return 'Super Admin';
      default: return 'User';
    }
  };

  const getSidebarItems = (userRole: UserRole | string) => {
    const studentItems = [
      { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
      { name: 'AI Voice Mock Interview', path: '/student/mock-interview', icon: Mic },
      { name: 'RepoDNA Intelligence', path: '/student/repodna', icon: GitFork },
      { name: 'AI Exam Prep', path: '/student/exam-prep', icon: GraduationCap },
      { name: 'AI Assistant', path: '/student/ai-assistant', icon: MessageSquare },
      { name: 'Academics', path: '/student/academics', icon: BookOpen },
      { name: 'Attendance', path: '/student/attendance', icon: CalendarCheck },
      { name: 'Exams', path: '/student/exams', icon: FileText },
      { name: 'Assignments', path: '/student/assignments', icon: FileEdit },
      { name: 'Library', path: '/student/library', icon: Library },
      { name: 'Clubs', path: '/student/clubs', icon: Users },
      { name: 'AI Insights', path: '/student/ai-insights', icon: Sparkles },
      { name: 'Settings', path: '/student/settings', icon: Settings },
      { name: 'Profile', path: '/student/profile', icon: User },
    ];


    const facultyItems = [
      { name: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
      { name: 'AI Assistant', path: '/faculty/ai-assistant', icon: MessageSquare },
      { name: 'Academics', path: '/faculty/academics', icon: BookOpen },
      { name: 'Attendance', path: '/faculty/attendance', icon: CalendarCheck },
      { name: 'Exams', path: '/faculty/exams', icon: FileText },
      { name: 'Assignments', path: '/faculty/assignments', icon: FileEdit },
      { name: 'Settings', path: '/faculty/settings', icon: Settings },
      { name: 'Profile', path: '/faculty/profile', icon: User },
    ];

    const adminItems = [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'User Management', path: '/admin/users', icon: Users },
      { name: 'Library Management', path: '/admin/library', icon: Library },
      { name: 'AI Assistant', path: '/admin/ai-assistant', icon: MessageSquare },
      { name: 'Finance', path: '/admin/finance', icon: DollarSign },
      { name: 'Events', path: '/admin/events', icon: Calendar },
      { name: 'Notice Board', path: '/admin/notices', icon: Bell },
      { name: 'Student Clubs', path: '/admin/clubs', icon: Users },
      { name: 'Settings', path: '/admin/settings', icon: Settings },
      { name: 'Profile', path: '/admin/profile', icon: User },
    ];

    const superAdminItems = [
      { name: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
      { name: 'User & Role Control', path: '/super-admin/users', icon: Users },
      { name: 'Library Management', path: '/super-admin/library', icon: Library },
      { name: 'Student Clubs', path: '/super-admin/clubs', icon: Users },
      { name: 'AI Assistant', path: '/super-admin/ai-assistant', icon: MessageSquare },
      { name: 'Audit Logs', path: '/super-admin/audit-logs', icon: FileText },
      { name: 'Settings', path: '/super-admin/settings', icon: Settings },
      { name: 'Profile', path: '/super-admin/profile', icon: User },
    ];

    const placementItems = [
      { name: 'Dashboard', path: '/placement/dashboard', icon: LayoutDashboard },
      { name: 'AI Voice Mock Interview', path: '/placement/mock-interview', icon: Mic },
      { name: 'AI Assistant', path: '/placement/ai-assistant', icon: MessageSquare },
      { name: 'Placements', path: '/placement/placements', icon: Briefcase },
      { name: 'Settings', path: '/placement/settings', icon: Settings },
      { name: 'Profile', path: '/placement/profile', icon: User },
    ];


    switch (userRole) {
      case 'faculty': return facultyItems;
      case 'admin': return adminItems;
      case 'super_admin': return superAdminItems;
      case 'placement_officer': return placementItems;
      case 'student':
      default:
        return studentItems;
    }
  };

  const sidebarItems = getSidebarItems(role);
  const homePath = `/${role === 'placement_officer' ? 'placement' : role === 'super_admin' ? 'super-admin' : role}/dashboard`;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF7F2] text-[#1C211F] font-sans">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-[#EAE3D8] bg-white shadow-[1px_0_15px_rgba(28,33,31,0.02)] transition-transform duration-300 md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#F3ECE2]">
          <Link to={homePath} className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-[#C85A32] to-[#B44E27] text-white shadow-md shadow-[#C85A32]/20">
              <Sparkles className="w-5 h-5 animate-pulse text-white" />
            </span>
            <span className="font-extrabold text-xl tracking-tight text-[#1C211F]">
              CampusOS <span className="text-[#C85A32] font-extrabold">AI</span>
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded-md text-[#8E9893] hover:text-[#1C211F] md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-[#FDF2ED] text-[#C85A32] font-extrabold border border-[rgba(200,90,50,0.3)] shadow-xs'
                    : 'text-[#5E6763] hover:text-[#1C211F] hover:bg-[#F4EFEA] font-medium border border-transparent'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#C85A32]' : 'text-[#8E9893] group-hover:text-[#5E6763]'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#F3ECE2] bg-[#FDFBF8]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#C85A32] to-[#B44E27] flex items-center justify-center text-xs font-bold text-white shadow-md shadow-[#C85A32]/20 shrink-0">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1C211F] truncate">{fullName}</p>
                <p className="text-[11px] text-[#5E6763] font-medium truncate">{getRoleLabel(role)}</p>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 rounded-xl hover:bg-[#FDF2ED] text-[#8E9893] hover:text-[#C85A32] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 border-b border-[#EAE3D8] bg-white/90 backdrop-blur-xl shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-xl text-[#5E6763] hover:bg-[#F4EFEA] md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#8E9893]">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Ask CampusOS anything..."
                className="w-80 pl-9 pr-4 py-2 text-xs sm:text-sm rounded-2xl border border-[#EAE3D8] bg-[#F4EFEA]/80 text-[#1C211F] placeholder-[#8E9893] focus:bg-white focus:outline-none focus:border-[#C85A32] focus:ring-2 focus:ring-[rgba(200,90,50,0.16)] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-2xl border border-[#EAE3D8] bg-[#F4EFEA]/80 text-[#5E6763] hover:bg-[#EFE8DF] transition-colors"
              >
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[9px] font-extrabold bg-[#C85A32] text-white rounded-full ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
                <Bell className="w-4.5 h-4.5" />
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-[#EAE3D8] rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-[#F3ECE2] pb-2">
                    <h3 className="text-xs font-extrabold text-[#1C211F] uppercase tracking-wider flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-[#C85A32]" /> Notifications ({notifs.length})
                    </h3>
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-bold text-[#C85A32] hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2.5 custom-scrollbar">
                    {notifs.length > 0 ? (
                      notifs.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border text-xs transition-colors ${
                            n.is_read ? 'bg-[#FDFBF8] border-[#F3ECE2] text-[#5E6763]' : 'bg-[#FDF2ED] border-[#EAE3D8] text-[#1C211F] font-medium'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-[#1C211F]">{n.title}</p>
                            <span className="text-[10px] text-[#8E9893] font-mono">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[#5E6763] mt-1 leading-snug">{n.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#8E9893] py-4 text-center font-medium">No notifications yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="h-6 w-px bg-[#EAE3D8]"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C85A32] via-[#B44E27] to-[#D9822B] p-0.5 shadow-xs">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs font-extrabold text-[#C85A32]">
                  {fullName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#FAF7F2] p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
