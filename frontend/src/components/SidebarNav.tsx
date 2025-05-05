import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  X,
  ChevronLeft,
} from "lucide-react";

interface SidebarNavProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
  isMobileOpen: boolean;
  closeMobile: () => void;
}

const navSections = [
  {
    section: "Main",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Customers", path: "/customers", icon: Users },
    ],
  },
  {
    section: "Reports",
    items: [{ label: "Reports", path: "/reports", icon: FileText }],
  },
  {
    section: "Settings",
    items: [{ label: "Settings", path: "/settings", icon: Settings }],
  },
];

function SidebarContent({
  collapsed,
  closeMobile,
  toggleCollapsed,
}: Pick<SidebarNavProps, "collapsed" | "closeMobile" | "toggleCollapsed">) {
  const location = useLocation();

  return (
    <div
      className={`flex flex-col bg-white border-r p-4 h-full transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex justify-center mb-4">
        {collapsed ? (
          <img src="/crm_rocket_logo.png" alt="PS" className="w-8 h-auto" />
        ) : (
          <img
            src="/pathsix_crm_logo.png"
            alt="PathSix CRM"
            className="max-w-[180px] h-auto"
          />
        )}
      </div>

      <button
        onClick={toggleCollapsed}
        className="self-end mb-4 text-gray-500 hover:text-gray-800 transition-transform duration-300"
        >
        <span
            className={`inline-block transition-transform duration-300 ${
            collapsed ? "rotate-180" : ""
            }`}
        >
            <ChevronLeft size={20} />
        </span>
        </button>


      <nav className="border border-border rounded-md bg-card px-3 py-4">
        {navSections.map((group) => (
          <div key={group.section}>
            {navSections.length > 1 && !collapsed && (
                <p className="text-xs text-muted-foreground font-semibold px-4 pt-0.5 pb-0.25 uppercase tracking-wide">
                    {group.section}
                </p>
            )}
            {group.items.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <div
                  key={item.path}
                  className={`my-[10px] ${
                    index !== group.items.length - 1
                      ? "border-b border-muted"
                      : ""
                  }`}
                >
                  <Link
                    to={item.path}
                    className={`block flex items-center gap-4 px-5 py-4 w-full text-sm font-medium leading-none transition-colors duration-200 rounded-md
                      ${
                        isActive
                          ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-black"
                      }`}
                    onClick={closeMobile}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </div>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}

export default function SidebarNav({
  collapsed,
  toggleCollapsed,
  isMobileOpen,
  closeMobile,
}: SidebarNavProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SidebarContent
          collapsed={collapsed}
          toggleCollapsed={toggleCollapsed}
          closeMobile={closeMobile}
        />
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity duration-300"
            onClick={closeMobile}
          ></div>

          {/* Sliding Sidebar */}
          <div className="relative z-10 w-64 bg-white shadow-lg transform transition-transform duration-300 translate-x-0">
            <button
              onClick={closeMobile}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              <X className="h-5 w-5" />
            </button>

            <SidebarContent
              collapsed={false}
              toggleCollapsed={toggleCollapsed}
              closeMobile={closeMobile}
            />
          </div>
        </div>
      )}
    </>
  );
}
