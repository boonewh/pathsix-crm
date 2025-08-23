import { Routes, Route, Navigate } from "react-router-dom";
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
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AdminLeadsPage from "./pages/AdminLeadsPage";
import AdminClientsPage from "./pages/AdminClientsPage";
import AdminInteractionsPage from "./pages/AdminInteractionsPage";
import AdminProjectsPage from "./pages/AdminProjectsPage";
import AdminImportPage from "./pages/AdminImportPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import TrashPage from "./pages/TrashPage";
import Vault from "./pages/Vault";

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

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
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/admin/leads" element={<AdminLeadsPage />} />
          <Route path="/admin/clients" element={<AdminClientsPage />} />
          <Route path="/admin/interactions" element={<AdminInteractionsPage />} />
          <Route path="/admin/projects" element={<AdminProjectsPage />} />
          <Route path="/admin/import" element={<AdminImportPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/trash" element={<TrashPage />} />
          <Route path="/vault" element={<Vault />} />
        </Route>
        {/* Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
