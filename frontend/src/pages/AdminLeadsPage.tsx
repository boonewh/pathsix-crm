import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import { Lead } from "@/types";
import { apiFetch } from "@/lib/api";
import { Link } from "react-router-dom";

export default function AdminLeadsPage() {
  const { token } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await apiFetch("/leads/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setLeads(data);
      } catch (err) {
        setError("Failed to load leads");
      }
    };

    fetchLeads();
  }, [token]);

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold text-blue-800">Admin: Leads Overview</h1>
      {error && <p className="text-red-500">{error}</p>}

      <div>
        <div className="overflow-auto border rounded shadow-sm">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Contact</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-4 py-2">
                    <Link to={`/leads/${lead.id}`} className="text-blue-600 hover:underline">
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{lead.contact_person ?? "—"}</td>
                  <td className="px-4 py-2">{lead.email ?? "—"}</td>
                  <td className="px-4 py-2">{lead.assigned_to_name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
