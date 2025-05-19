import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/authContext";
import { useState, useEffect, useRef } from "react";
import SidebarNav from "@/components/SidebarNav";

export default function ProtectedLayout() {
  const { isAuthenticated, logout, token } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (search.trim().length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      fetch(`/api/search/?q=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setResults(data);
          setShowResults(true);
        });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, token]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <header className="flex justify-between items-center bg-primary text-primary-foreground px-6 py-4 shadow-sm gap-4 flex-wrap relative">
          <button
            className="lg:hidden text-primary-foreground hover:opacity-80"
            onClick={() => setIsMobileOpen(true)}
          >
            ☰
          </button>

          <span className="text-lg font-bold tracking-tight whitespace-nowrap">PathSix CRM</span>

          <div className="relative w-full max-w-sm flex-1" ref={searchRef}>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-white/30 bg-primary-foreground text-primary px-3 py-1 rounded-md text-sm placeholder:text-primary/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />

            {showResults && results.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow-lg z-50 max-h-64 overflow-y-auto text-sm">
                {results.map((r) => (
                  <a
                    key={`${r.type}-${r.id}`}
                    href={r.link}
                    className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                    onClick={() => setShowResults(false)}
                  >
                    <span className="font-medium capitalize">{r.type}</span>: {r.name}
                  </a>
                ))}
              </div>
            )}
          </div>

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
