import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import { apiFetch } from "@/lib/api";
import { Link, useSearchParams } from "react-router-dom";
import CompanyForm from "@/components/ui/CompanyForm";
import PaginationControls from "@/components/ui/PaginationControls";
import { usePagination } from "@/hooks/usePreferences";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { Wrench } from "lucide-react";

interface AdminClient {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  contact_title?: string;
  assigned_to_name?: string;
  created_by_name?: string;
  created_at?: string;
  type?: string;
}

interface User {
  id: number;
  email: string;
  is_active: boolean;
}

export default function AdminClientsPage() {
  const { token } = useAuth();
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState<Partial<AdminClient>>({});

  const selectedEmail = searchParams.get("user") || "";

  // Use pagination hook with admin-specific key
  const {
    perPage,
    sortOrder,
    currentPage,
    setCurrentPage,
    updatePerPage,
    updateSortOrder,
  } = usePagination('admin_clients');

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

  // Load clients when user selection or pagination changes
  useEffect(() => {
    const fetchClients = async () => {
      if (!selectedEmail) {
        setClients([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const clientRes = await apiFetch(
          `/clients/all?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}&user_email=${encodeURIComponent(selectedEmail)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const clientsData = await clientRes.json();
        setClients(clientsData.clients);
        setTotal(clientsData.total);
        setError("");
      } catch {
        setError("Failed to load clients");
        setClients([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
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
      <h1 className="text-2xl font-bold text-blue-800">Admin: Accounts Overview</h1>
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
            entityName="accounts"
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
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Contact</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Phone</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Assigned To</th>
                    <th className="px-4 py-2 text-left">Created</th>
                    <th className="px-4 py-2 text-left">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-t hover:bg-gray-50 transition">
                      <td className="px-4 py-2">
                        <Link
                          to={`/clients/${client.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {client.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        <div>
                          {client.contact_person ?? "—"}
                          {client.contact_title && (
                            <div className="text-xs text-gray-500">{client.contact_title}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2">{client.email ?? "—"}</td>
                      <td className="px-4 py-2">{client.phone ? formatPhoneNumber(client.phone) : "—"}</td>
                      <td className="px-4 py-2">{client.type ?? "—"}</td>
                      <td className="px-4 py-2">{client.assigned_to_name ?? "—"}</td>
                      <td className="px-4 py-2">
                        {client.created_at 
                          ? new Date(client.created_at).toLocaleDateString()
                          : "—"
                        }
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => {
                            setEditingClientId(client.id);
                            setForm(client);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:underline"
                          title="Edit Client"
                        >
                          <Wrench size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {clients.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                        No accounts found for this user.
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
              entityName="accounts"
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
                <h2 className="text-lg font-semibold">Edit Client</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingClientId(null);
                    setForm({});
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <CompanyForm
                form={form}
                setForm={setForm}
                onSave={async () => {
                  try {
                    const res = await apiFetch(`/clients/${editingClientId}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(form),
                    });

                    if (res.ok) {
                      // refresh current page of clients
                      setShowEditModal(false);
                      setEditingClientId(null);
                      setForm({});
                      // manually trigger data reload
                      const clientRes = await apiFetch(
                        `/clients/all?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}&user_email=${encodeURIComponent(selectedEmail)}`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        }
                      );
                      const updated = await clientRes.json();
                      setClients(updated.clients);
                    } else {
                      alert("Failed to update client");
                    }
                  } catch {
                    alert("Failed to update client");
                  }
                }}
                onCancel={() => {
                  setShowEditModal(false);
                  setEditingClientId(null);
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