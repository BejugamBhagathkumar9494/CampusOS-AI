import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/context/AuthContext';
import { useAuth } from './auth/hooks/useAuth';
import ProtectedRoute from './auth/components/ProtectedRoute';

import LandingPage from './features/landing/LandingPage';
import LoginPage from './auth/pages/LoginPage';
import RegisterPage from './auth/pages/RegisterPage';
import ForgotPasswordPage from './auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './auth/pages/ResetPasswordPage';
import UnauthorizedPage from './auth/pages/UnauthorizedPage';

import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './features/dashboard/Dashboard';
import AIAssistant from './features/ai-assistant/AIAssistant';
import UserManagementPage from './features/admin/UserManagementPage';
import Academics from './features/academics/AcademicsPage';
import Attendance from './features/attendance/AttendancePage';
import Exams from './features/exams/ExamsPage';
import Assignments from './features/assignments/AssignmentsPage';
import Library from './features/library/LibraryPage';
import Transport from './features/transport/TransportPage';
import Placements from './features/placements/PlacementsPage';
import Finance from './features/finance/FinancePage';
import Events from './features/events/EventsPage';
import Clubs from './features/clubs/ClubsPage';
import Notices from './features/notices/NoticesPage';
import AIInsights from './features/ai-insights/AIInsightsPage';
import Settings from './features/settings/SettingsPage';
import Profile from './features/profile/ProfilePage';

// Automatically routes users to their trusted role-specific home dashboard
const DashboardRedirect = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
          <p className="text-sm font-semibold tracking-wide text-indigo-400">Verifying session identity...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }

  const dashboardRoutes = {
    student: '/student/dashboard',
    faculty: '/faculty/dashboard',
    admin: '/admin/dashboard',
    placement_officer: '/placement/dashboard',
    super_admin: '/super-admin/dashboard',
  };

  return <Navigate to={dashboardRoutes[role] || '/login'} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/dashboard/*" element={<DashboardRedirect />} />

          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="ai-assistant" element={<AIAssistant />} />
                    <Route path="academics" element={<Academics />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="exams" element={<Exams />} />
                    <Route path="assignments" element={<Assignments />} />
                    <Route path="library" element={<Library />} />
                    <Route path="transport" element={<Transport />} />
                    <Route path="finance" element={<Finance />} />
                    <Route path="clubs" element={<Clubs />} />
                    <Route path="ai-insights" element={<AIInsights />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/faculty/*"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="ai-assistant" element={<AIAssistant />} />
                    <Route path="academics" element={<Academics />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="exams" element={<Exams />} />
                    <Route path="assignments" element={<Assignments />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="users" element={<UserManagementPage />} />
                    <Route path="ai-assistant" element={<AIAssistant />} />
                    <Route path="finance" element={<Finance />} />
                    <Route path="events" element={<Events />} />
                    <Route path="notices" element={<Notices />} />
                    <Route path="clubs" element={<Clubs />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin/*"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="users" element={<UserManagementPage />} />
                    <Route path="audit-logs" element={<UserManagementPage />} />
                    <Route path="ai-assistant" element={<AIAssistant />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/placement/*"
            element={
              <ProtectedRoute allowedRoles={['placement_officer']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="ai-assistant" element={<AIAssistant />} />
                    <Route path="placements" element={<Placements />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
