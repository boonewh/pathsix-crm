import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/authContext";

import {
  LayoutDashboard,
  Users,
  UserPlus,
  Briefcase,
  FolderKanban,
  FileText,
  Settings,
  Calendar as CalendarIcon,
  ChevronLeft,
  X,
} from "lucide-react";

interface SidebarNavProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
  isMobileOpen: boolean;
  closeMobile: () => void;
}


function SidebarContent({
  collapsed,
  closeMobile,
  toggleCollapsed,
}: Pick<SidebarNavProps, "collapsed" | "closeMobile" | "toggleCollapsed">) {
  const location = useLocation();
  const { user } = useAuth(); // ✅ Add this line here

  const navSections = [
    {
      section: "Main",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Leads", path: "/leads", icon: UserPlus },
        { label: "Clients", path: "/clients", icon: Users },
        { label: "Calendar", path: "/calendar", icon: CalendarIcon },
      ],
    },
    {
      section: "Accounts",
      items: [{ label: "Accounts", path: "/accounts", icon: Briefcase }],
    },
    {
      section: "Projects",
      items: [{ label: "Projects", path: "/projects", icon: FolderKanban }],
    },
    {
      section: "Reports",
      items: [{ label: "Reports", path: "/reports", icon: FileText }],
    },
    {
      section: "Settings",
      items: [
        { label: "Settings", path: "/settings", icon: Settings },
      ],
    },
    ...(user?.roles.includes("admin")
      ? [
          {
            section: "Admin",
            items: [
              { label: "Users", path: "/admin/users", icon: Users },
            ],
          },
        ]
      : []),
  ];

  return (
    <div
      className={`flex flex-col bg-neutral shadow-md border-r p-4 h-full transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex justify-center mb-4">
        {collapsed ? (
          <img src="/logo-all-seasons-foam.png" alt="PS" className="w-8 h-auto" />
        ) : (
          <img
            src="/logo-all-seasons-foam.png"
            alt="PathSix CRM"
            className="max-w-[180px] h-auto"
          />
        )}
      </div>

      <button
        onClick={toggleCollapsed}
        className="self-end mb-4 text-muted-foreground hover:text-foreground transition-transform duration-300"
      >
        <span
          className={`inline-block transition-transform duration-300 ${
            collapsed ? "rotate-180" : ""
          }`}
        >
          <ChevronLeft size={20} />
        </span>
      </button>

      <nav className="border border-border rounded-md bg-neutral px-3 py-4">
        {navSections.map((group) => (
          <div key={group.section}>
            {navSections.length > 1 && !collapsed && (
              <p className="text-xs text-primary font-semibold px-4 pt-0.5 pb-0.25 uppercase tracking-wide">
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
                    index !== group.items.length - 1 ? "border-b border-muted" : ""
                  }`}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center gap-4 px-5 py-4 w-full text-sm font-medium leading-none transition-colors duration-200 rounded-md
                      ${
                        isActive
                          ? "bg-primary/10 text-primary border-l-4 border-primary"
                          : "bg-muted text-secondary hover:bg-accent hover:text-white"
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
          <div className="relative z-10 w-64 h-screen overflow-y-auto bg-neutral shadow-lg transform transition-transform duration-300 translate-x-0">
            <button
              onClick={closeMobile}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
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
