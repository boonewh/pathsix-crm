import { Link } from "react-router-dom";
import { useAuth } from "@/authContext";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Account</h2>

        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <span className="text-gray-700 text-sm">{user?.email}</span>
        </div>

        <Link
          to="/change-password"
          className="text-sm text-blue-600 hover:underline"
        >
          Change Password
        </Link>
      </div>
    </div>
  );
}
