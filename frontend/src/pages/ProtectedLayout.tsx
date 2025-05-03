import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/authContext";
import { Button } from "@/components/ui/button";

export default function ProtectedLayout() {
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col w-full min-h-screen">
      <header className="flex justify-between items-center bg-gray-200 px-4 py-2 shadow">
        <h1 className="text-xl font-semibold">PathSix CRM</h1>
        <Button variant="destructive" onClick={logout}>
          Logout
        </Button>
      </header>

      <main className="flex-grow p-4">
        <Outlet />
      </main>
    </div>
  );
}

