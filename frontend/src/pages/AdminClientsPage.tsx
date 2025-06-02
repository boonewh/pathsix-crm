import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import { apiFetch } from "@/lib/api";
import { Link } from "react-router-dom";

interface AdminClient {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  assigned_to_name?: string;
  created_by_name?: string;
}

export default function AdminClientsPage() {
  const { token } = useAuth();
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await apiFetch("/clients/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setClients(data);
      } catch (err) {
        setError("Failed to load clients");
      }
    };

    fetchClients();
  }, [token]);

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold text-blue-800">Admin: Clients Overview</h1>
      {error && <p className="text-red-500">{error}</p>}

      <div className="overflow-auto border rounded shadow-sm">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Contact</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Phone</th>
              <th className="px-4 py-2 text-left">Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-t hover:bg-gray-50 transition">
                <td className="px-4 py-2">
                  <Link to={`/clients/${client.id}`} className="text-blue-600 hover:underline">
                    {client.name}
                  </Link>
                </td>
                <td className="px-4 py-2">{client.contact_person ?? "—"}</td>
                <td className="px-4 py-2">{client.email ?? "—"}</td>
                <td className="px-4 py-2">{client.phone ?? "—"}</td>
                <td className="px-4 py-2">{client.assigned_to_name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}