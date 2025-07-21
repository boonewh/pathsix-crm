import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/authContext";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

interface TrashItem {
  id: number;
  name: string;
  deleted_at: string;
  deleted_by: number | null;
}

export default function TrashPage() {
  const { token } = useAuth();
  const [clients, setClients] = useState<TrashItem[]>([]);
  const [leads, setLeads] = useState<TrashItem[]>([]);
  const [projects, setProjects] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const [clientRes, leadRes, projectRes] = await Promise.all([
        apiFetch("/clients/trash", { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch("/leads/trash", { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch("/projects/trash", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setClients(await clientRes.json());
      setLeads(await leadRes.json());
      setProjects(await projectRes.json());
    } catch (err) {
      setError("Failed to load trash.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (type: "client" | "lead" | "project", id: number) => {
    const res = await apiFetch(`/${type}s/${id}/restore`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      if (type === "client") {
        setClients((prev) => prev.filter((c) => c.id !== id));
      } else if (type === "lead") {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      } else {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } else {
      alert("Failed to restore.");
    }
  };

  const handlePurge = async (type: "client" | "lead" | "project", id: number) => {
    const confirmed = confirm("Are you sure you want to permanently delete this item? This cannot be undone.");
    if (!confirmed) return;

    const res = await apiFetch(`/${type}s/${id}/purge`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      if (type === "client") {
        setClients((prev) => prev.filter((c) => c.id !== id));
      } else if (type === "lead") {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      } else {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } else {
      alert("Failed to permanently delete.");
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [token]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Trash</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p>Loading deleted items...</p>
      ) : (
        <div className="space-y-8">

          {/* Clients */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Deleted Accounts</h2>
            {clients.length === 0 ? (
              <p className="text-gray-500">No deleted accounts.</p>
            ) : (
              <table className="w-full text-sm border">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Deleted</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-t">
                      <td className="p-2">{client.name}</td>
                      <td className="p-2 text-gray-500">
                        {formatDistanceToNow(new Date(client.deleted_at), { addSuffix: true })}
                      </td>
                      <td className="p-2 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => handleRestore("client", client.id)}>
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handlePurge("client", client.id)}
                        >
                          Delete Permanently
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Leads */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Deleted Leads</h2>
            {leads.length === 0 ? (
              <p className="text-gray-500">No deleted leads.</p>
            ) : (
              <table className="w-full text-sm border">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Deleted</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-t">
                      <td className="p-2">{lead.name}</td>
                      <td className="p-2 text-gray-500">
                        {formatDistanceToNow(new Date(lead.deleted_at), { addSuffix: true })}
                      </td>
                      <td className="p-2 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => handleRestore("lead", lead.id)}>
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handlePurge("lead", lead.id)}
                        >
                          Delete Permanently
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Projects */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Deleted Projects</h2>
            {projects.length === 0 ? (
              <p className="text-gray-500">No deleted projects.</p>
            ) : (
              <table className="w-full text-sm border">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Deleted</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-t">
                      <td className="p-2">{project.name}</td>
                      <td className="p-2 text-gray-500">
                        {formatDistanceToNow(new Date(project.deleted_at), { addSuffix: true })}
                      </td>
                      <td className="p-2 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => handleRestore("project", project.id)}>
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handlePurge("project", project.id)}
                        >
                          Delete Permanently
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
