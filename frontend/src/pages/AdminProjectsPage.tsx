import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import { apiFetch } from "@/lib/api";
import { Link, useSearchParams } from "react-router-dom";
import ProjectForm from "@/components/ui/ProjectForm";
import PaginationControls from "@/components/ui/PaginationControls";
import { usePagination } from "@/hooks/usePreferences";
import { Wrench } from "lucide-react";


interface AdminProject {
  id: number;
  project_name: string;
  type?: string;
  project_status?: string;
  project_description?: string;
  project_start?: string;
  project_end?: string;
  project_worth?: number;
  client_name?: string;
  lead_name?: string;
  assigned_to_email?: string;
  created_at?: string;
  client_id?: number;
  lead_id?: number;
}

interface User {
  id: number;
  email: string;
  is_active: boolean;
}

export default function AdminProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState<Partial<AdminProject>>({});
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [leads, setLeads] = useState<{ id: number; name: string }[]>([]);

  const selectedEmail = searchParams.get("user") || "";

  // Use pagination hook with admin-specific key
  const {
    perPage,
    sortOrder,
    currentPage,
    setCurrentPage,
    updatePerPage,
    updateSortOrder,
  } = usePagination('admin_projects');

  // Load users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userRes = await apiFetch("/users/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = await userRes.json();
        setUsers(usersData.filter((u: User) => u.is_active));
      } catch {
        setError("Failed to load users");
      }
    };

    fetchUsers();
  }, [token]);

  // Load projects when user selection or pagination changes
  useEffect(() => {
    const fetchProjects = async () => {
      if (!selectedEmail) {
        setProjects([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [projectRes, clientRes, leadRes] = await Promise.all([
          apiFetch(
            `/projects/all?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}&user_email=${encodeURIComponent(selectedEmail)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          apiFetch("/clients/", { headers: { Authorization: `Bearer ${token}` } }),
          apiFetch("/leads/", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const projectData = await projectRes.json();
        const clientData = await clientRes.json();
        const leadData = await leadRes.json();

        setProjects(projectData.projects);
        setTotal(projectData.total);
        setClients((clientData.clients || clientData).map((c: any) => ({ id: c.id, name: c.name })));
        setLeads((leadData.leads || leadData).map((l: any) => ({ id: l.id, name: l.name })));
        setError("");
      } catch {
        setError("Failed to load projects");
        setProjects([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

      fetchProjects();
    }, [token, selectedEmail, currentPage, perPage, sortOrder]);



  // Reset to page 1 when user selection changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEmail, setCurrentPage]);

  const handleUserChange = (email: string) => {
    setSearchParams(email ? { user: email } : {});
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-blue-800">Admin: Projects Overview</h1>
      {error && <p className="text-red-500">{error}</p>}

      <div className="max-w-sm">
        <label htmlFor="user-select" className="block font-medium mb-2">
          Filter by user:
        </label>
        <select
          id="user-select"
          value={selectedEmail}
          onChange={(e) => handleUserChange(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="">— Select a user —</option>
          {users.map((u) => (
            <option key={u.id} value={u.email}>
              {u.email}
            </option>
          ))}
        </select>
      </div>

      {selectedEmail && (
        <>
          {/* Pagination Controls at top */}
          <PaginationControls
            currentPage={currentPage}
            perPage={perPage}
            total={total}
            sortOrder={sortOrder}
            onPageChange={setCurrentPage}
            onPerPageChange={updatePerPage}
            onSortOrderChange={updateSortOrder}
            entityName="projects"
            className="border-b pb-4"
          />

          {/* Content */}
          {loading ? (
            <div className="text-gray-500 text-center py-10">Loading...</div>
          ) : (
            <div className="overflow-auto border rounded shadow-sm">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Project Name</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Associated With</th>
                    <th className="px-4 py-2 text-left">Worth</th>
                    <th className="px-4 py-2 text-left">Start Date</th>
                    <th className="px-4 py-2 text-left">End Date</th>
                    <th className="px-4 py-2 text-left">Assigned To</th>
                    <th className="px-4 py-2 text-left">Created</th>
                    <th className="px-4 py-2 text-left">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-t hover:bg-gray-50 transition">
                      <td className="px-4 py-2">
                        <div className="font-medium">{project.project_name}</div>
                        {project.project_description && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            {project.project_description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          project.project_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          project.project_status === 'won' ? 'bg-green-100 text-green-800' :
                          project.project_status === 'lost' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.project_status ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2">{project.type ?? "—"}</td>
                      <td className="px-4 py-2">
                        {project.client_name && (
                          <div className="text-sm">
                            <span className="text-blue-600">Account:</span>{" "}
                            <Link 
                              to={`/clients/${project.client_id}`} 
                              className="text-blue-600 hover:underline"
                            >
                              {project.client_name}
                            </Link>
                          </div>
                        )}
                        {project.lead_name && (
                          <div className="text-sm">
                            <span className="text-green-600">Lead:</span>{" "}
                            <Link 
                              to={`/leads/${project.lead_id}`} 
                              className="text-green-600 hover:underline"
                            >
                              {project.lead_name}
                            </Link>
                          </div>
                        )}
                        {!project.client_name && !project.lead_name && (
                          <span className="text-yellow-600 text-xs">⚠️ Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {project.project_worth !== undefined && project.project_worth !== null
                          ? `$${project.project_worth.toLocaleString()}`
                          : "—"
                        }
                      </td>
                      <td className="px-4 py-2">
                        {project.project_start 
                          ? new Date(project.project_start).toLocaleDateString()
                          : "—"
                        }
                      </td>
                      <td className="px-4 py-2">
                        {project.project_end 
                          ? new Date(project.project_end).toLocaleDateString()
                          : "—"
                        }
                      </td>
                      <td className="px-4 py-2">{project.assigned_to_email ?? "—"}</td>
                      <td className="px-4 py-2">
                        {project.created_at 
                          ? new Date(project.created_at).toLocaleDateString()
                          : "—"
                        }
                      </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => {
                              setEditingProjectId(project.id);
                              setForm(project);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit Project"
                          >
                            <Wrench size={16} />
                          </button>
                        </td>
                    </tr>
                  ))}
                  {projects.length === 0 && !loading && (
                    <tr>
                      <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                        No projects found for this user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls at bottom */}
          {total > 0 && (
            <PaginationControls
              currentPage={currentPage}
              perPage={perPage}
              total={total}
              sortOrder={sortOrder}
              onPageChange={setCurrentPage}
              onPerPageChange={updatePerPage}
              onSortOrderChange={updateSortOrder}
              entityName="projects"
              className="border-t pt-4"
            />
          )}
        </>
      )}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Edit Project</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProjectId(null);
                    setForm({});
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <ProjectForm
                form={form}
                setForm={setForm}
                clients={clients}
                leads={leads}
                onSave={async () => {
                  try {
                    const res = await apiFetch(`/projects/${editingProjectId}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(form),
                    });

                    if (res.ok) {
                      const projectRes = await apiFetch(
                        `/projects/all?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}&user_email=${encodeURIComponent(selectedEmail)}`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        }
                      );
                      const data = await projectRes.json();
                      setProjects(data.projects);
                      setShowEditModal(false);
                      setEditingProjectId(null);
                      setForm({});
                    } else {
                      alert("Failed to update project");
                    }
                  } catch {
                    alert("Failed to update project");
                  }
                }}
                onCancel={() => {
                  setShowEditModal(false);
                  setEditingProjectId(null);
                  setForm({});
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}