import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/authContext";
import { useState } from "react";
import SidebarNav from "@/components/SidebarNav";

export default function ProtectedLayout() {
  const { isAuthenticated, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

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
        <header className="flex justify-between items-center bg-primary text-primary-foreground px-6 py-4 shadow-sm gap-4 flex-wrap">
          {/* Mobile toggle */}
          <button
            className="lg:hidden text-primary-foreground hover:opacity-80"
            onClick={() => setIsMobileOpen(true)}
          >
            ☰
          </button>

          <span className="text-lg font-bold tracking-tight whitespace-nowrap">PathSix CRM</span>

          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-sm border border-white/30 bg-primary-foreground text-primary px-3 py-1 rounded-md text-sm placeholder:text-primary/60 focus:outline-none focus:ring-2 focus:ring-accent"
          />

          <button
            onClick={logout}
            className="bg-accent text-accent-foreground hover:bg-accent/80 px-4 py-2 rounded-md text-sm transition-colors whitespace-nowrap"
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
