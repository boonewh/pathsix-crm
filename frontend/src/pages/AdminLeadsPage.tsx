import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import { Lead } from "@/types";
import { apiFetch } from "@/lib/api";
import { Link } from "react-router-dom";

export default function AdminLeadsPage() {
  const { token } = useAuth();
  const [assignedLeads, setAssignedLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAssigned = async () => {
      try {
        const res = await apiFetch("/leads/assigned", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAssignedLeads(data);
      } catch (err) {
        setError("Failed to load assigned leads");
      }
    };

    const fetchAll = async () => {
      try {
        const res = await apiFetch("/leads/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAllLeads(data);
      } catch (err) {
        setError("Failed to load all leads");
      }
    };

    fetchAssigned();
    fetchAll();
  }, [token]);

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold text-blue-800">Admin: Leads Overview</h1>
      {error && <p className="text-red-500">{error}</p>}

      {/* Assigned Leads */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Assigned Leads</h2>
        <div className="overflow-auto border rounded shadow-sm">
          <table className="min-w-full table-auto">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Contact</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {assignedLeads.map((lead) => (
                <tr key={lead.id} className="border-t">
                  <td className="px-4 py-2">
                    <Link to={`/leads/${lead.id}`} className="text-blue-600 hover:underline">
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{lead.contact_person}</td>
                  <td className="px-4 py-2">{lead.email}</td>
                  <td className="px-4 py-2">
                    {lead.assigned_to_name || lead.created_by_name || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Leads */}
      <div>
        <h2 className="text-xl font-semibold mb-2">All Leads</h2>
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
              {allLeads.map((lead) => (
                <tr key={lead.id} className="border-t">
                  <td className="px-4 py-2">
                    <Link to={`/leads/${lead.id}`} className="text-blue-600 hover:underline">
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{lead.contact_person}</td>
                  <td className="px-4 py-2">{lead.email}</td>
                  <td className="px-4 py-2">
                    {lead.assigned_to_name || lead.created_by_name || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
