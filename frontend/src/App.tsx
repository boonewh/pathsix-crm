import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Accounts from "@/pages/Accounts";
import AdminUsersPage from "@/pages/AdminUsersPage";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Leads from "@/pages/Leads";
import Projects from "@/pages/Projects";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import LeadDetailPage from "@/pages/LeadDetailPage";
import ClientDetailPage from "@/pages/ClientDetailPage";
import CalendarPage from "@/pages/CalendarPage";
import ProtectedLayout from "@/pages/ProtectedLayout";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
      </Route>
      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
