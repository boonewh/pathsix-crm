import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/authContext";
import { useState } from "react";
import SidebarNav from "@/components/SidebarNav";

export default function ProtectedLayout() {
  const { isAuthenticated, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-muted">
      <SidebarNav
        collapsed={collapsed}
        toggleCollapsed={() => setCollapsed(!collapsed)}
        isMobileOpen={isMobileOpen}
        closeMobile={() => setIsMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col">
        <header className="flex justify-between items-center bg-primary text-primary-foreground px-6 py-4 shadow-sm">
          {/* Mobile toggle */}
          <button
            className="lg:hidden text-primary-foreground hover:opacity-80"
            onClick={() => setIsMobileOpen(true)}
          >
            ☰
          </button>

          <span className="text-lg font-bold tracking-tight">PathSix CRM</span>

          <button
            onClick={logout}
            className="bg-accent text-accent-foreground hover:bg-accent/80 px-4 py-2 rounded-md text-sm transition-colors"
          >
            Logout
          </button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
