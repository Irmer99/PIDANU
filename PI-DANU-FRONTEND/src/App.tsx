import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "./store/appStore";

import AppLayout from "./components/layout/AppLayout";
import DemoLayout from "./components/demo/DemoLayout";
import CitizenLayout from "./components/citizen/CitizenLayout";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import RequestsPage from "./pages/RequestsPage";
import CitizensPage from "./pages/CitizensPage";
import ResourcesPage from "./pages/ResourcesPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import VoiceLogsPage from "./pages/admin/VoiceLogsPage";
import VoiceSimulatorPage from "./pages/admin/VoiceSimulatorPage";

import DemoUssdPage from "./pages/demo/DemoUssdPage";
import DemoVoicePage from "./pages/demo/DemoVoicePage";

import CitizenLoginPage from "./pages/citizen/CitizenLoginPage";
import CitizenRegisterPage from "./pages/citizen/CitizenRegisterPage";
import CitizenHomePage from "./pages/citizen/CitizenHomePage";
import CitizenSubmitRequestPage from "./pages/citizen/CitizenSubmitRequestPage";
import CitizenMyRequestsPage from "./pages/citizen/CitizenMyRequestsPage";
import CitizenProfilePage from "./pages/citizen/CitizenProfilePage";

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ──── Public Demo Routes (no auth) ──── */}
        <Route element={<DemoLayout />}>
          <Route path="/demo/ussd" element={<DemoUssdPage />} />
          <Route path="/demo/voice" element={<DemoVoicePage />} />
        </Route>

        {/* ──── Citizen App Routes ──── */}
        <Route path="/citizen/login" element={<CitizenLoginPage />} />
        <Route path="/citizen/register" element={<CitizenRegisterPage />} />
        <Route element={<CitizenLayout />}>
          <Route path="/citizen/home" element={<CitizenHomePage />} />
          <Route path="/citizen/submit" element={<CitizenSubmitRequestPage />} />
          <Route path="/citizen/requests" element={<CitizenMyRequestsPage />} />
          <Route path="/citizen/profile" element={<CitizenProfilePage />} />
        </Route>

        {/* ──── Admin Login ──── */}
        <Route path="/login" element={<LoginPage />} />

        {/* ──── Admin Dashboard (protected) ──── */}
        <Route
          element={
            <AdminProtectedRoute>
              <AppLayout />
            </AdminProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/citizens" element={<CitizensPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/admin/voice-logs" element={<VoiceLogsPage />} />
          <Route path="/admin/voice-simulator" element={<VoiceSimulatorPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* ──── Default Redirects ──── */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
