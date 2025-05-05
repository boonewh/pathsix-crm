import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Customers", path: "/customers" },
    { label: "Reports", path: "/reports" },
    { label: "Settings", path: "/settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white border-b shadow-sm">
        <h1 className="text-2xl font-bold text-blue-600">PathSix CRM</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-white bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded-md"
        >
          Logout
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r p-4 space-y-4">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === item.path
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
