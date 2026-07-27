import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/context/AuthContext';
import { useAuth } from './auth/hooks/useAuth';
import ProtectedRoute from './auth/components/ProtectedRoute';

import LandingPage from './features/landing/LandingPage';
import LoginPage from './auth/pages/LoginPage';
import RegisterPage from './auth/pages/RegisterPage';
import UnauthorizedPage from './auth/pages/UnauthorizedPage';

import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './features/dashboard/Dashboard';
import AIAssistant from './features/ai-assistant/AIAssistant';
import {
  Academics,
  Attendance,
  Exams,
  Assignments,
  Library,
  Hostel,
  Transport,
  Placements,
  Finance,
  Events,
  Clubs,
  Notices,
  AIInsights,
  Settings,
  Profile,
} from './features/placeholders';

// Automatically routes users to their role-specific home dashboard
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
          <p className="text-sm font-semibold tracking-wide text-indigo-400">Verifying session...</p>
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
    hostel_warden: '/hostel/dashboard',
    placement_officer: '/placement/dashboard',
  };

  return <Navigate to={dashboardRoutes[role] || '/login'} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Authentication */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Fallback Legacy Dashboard routes redirect automatically */}
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/dashboard/*" element={<DashboardRedirect />} />

          {/* STUDENT DASHBOARD ROUTES */}
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

          {/* FACULTY DASHBOARD ROUTES */}
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

          {/* ADMIN DASHBOARD ROUTES */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
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

          {/* HOSTEL WARDEN DASHBOARD ROUTES */}
          <Route
            path="/hostel/*"
            element={
              <ProtectedRoute allowedRoles={['hostel_warden']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="ai-assistant" element={<AIAssistant />} />
                    <Route path="hostel" element={<Hostel />} />
                    <Route path="notices" element={<Notices />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* PLACEMENT OFFICER DASHBOARD ROUTES */}
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

          {/* Global Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
