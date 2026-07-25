import { BrowserRouter, Routes, Route } from 'react-router-dom'

import LandingPage from './features/landing/LandingPage'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './features/dashboard/Dashboard'
import AIAssistant from './features/ai-assistant/AIAssistant'
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
  Research,
  AIInsights,
  Settings,
  Profile,
} from './features/placeholders'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Dashboard Application */}
        <Route
          path="/dashboard/*"
          element={
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
                <Route path="academics" element={<Academics />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="exams" element={<Exams />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="library" element={<Library />} />
                <Route path="hostel" element={<Hostel />} />
                <Route path="transport" element={<Transport />} />
                <Route path="placements" element={<Placements />} />
                <Route path="finance" element={<Finance />} />
                <Route path="events" element={<Events />} />
                <Route path="clubs" element={<Clubs />} />
                <Route path="notices" element={<Notices />} />
                <Route path="research" element={<Research />} />
                <Route path="ai-insights" element={<AIInsights />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
              </Routes>
            </DashboardLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

