import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import { apiFetch } from "@/lib/api";
import { Link, useSearchParams } from "react-router-dom";
import type { Lead } from "@/types";
import LeadForm from "@/components/ui/LeadForm";
import PaginationControls from "@/components/ui/PaginationControls";
import { usePagination } from "@/hooks/usePreferences";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { Wrench } from "lucide-react";

interface AdminLead extends Lead {
  assigned_to_name?: string;
  created_by_name?: string;
}

interface User {
  id: number;
  email: string;
  is_active: boolean;
}

export default function AdminLeadsPage() {
  const { token } = useAuth();
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState<Partial<AdminLead>>({
    phone_label: "work",
    secondary_phone_label: "mobile",
    lead_status: "open",
    type: "None",
  });

  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);

  const toggleLeadSelection = (id: number) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((leadId) => leadId !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedLeadIds([]);



  const selectedEmail = searchParams.get("user") || "";

  // Use pagination hook with admin-specific key
  const {
    perPage,
    sortOrder,
    currentPage,
    setCurrentPage,
    updatePerPage,
    updateSortOrder,
  } = usePagination('admin_leads');

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

  // Load leads when user selection or pagination changes
  useEffect(() => {
    const fetchLeads = async () => {
      if (!selectedEmail) {
        setLeads([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const leadRes = await apiFetch(
          `/leads/all?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}&user_email=${encodeURIComponent(selectedEmail)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const leadsData = await leadRes.json();
        setLeads(leadsData.leads);
        setTotal(leadsData.total);
        setError("");
      } catch {
        setError("Failed to load leads");
        setLeads([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
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
      <h1 className="text-2xl font-bold text-blue-800">Admin: Leads Overview</h1>
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
            entityName="leads"
            className="border-b pb-4"
          />

          {selectedLeadIds.length > 0 && (
            <div className="mb-4">
              <button
                onClick={async () => {
                  if (!confirm(`Delete ${selectedLeadIds.length} selected lead(s)?`)) return;

                  const res = await apiFetch("/leads/bulk-delete", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ lead_ids: selectedLeadIds }),
                  });

                  if (res.ok) {
                    const refreshed = await apiFetch(
                      `/leads/all?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}&user_email=${encodeURIComponent(selectedEmail)}`,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const data = await refreshed.json();
                    setLeads(data.leads);
                    setTotal(data.total);
                    clearSelection();
                  } else {
                    alert("Failed to delete selected leads");
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Delete Selected ({selectedLeadIds.length})
              </button>
            </div>
          )}


          {/* Content */}
          {loading ? (
            <div className="text-gray-500 text-center py-10">Loading...</div>
          ) : (
            <div className="overflow-auto border rounded shadow-sm">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Contact</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Phone</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Assigned To</th>
                    <th className="px-4 py-2 text-left">Created</th>
                    <th className="px-4 py-2 text-left">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-t hover:bg-gray-50 transition">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.includes(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                          className="form-checkbox"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {lead.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        <div>
                          {lead.contact_person ?? "—"}
                          {lead.contact_title && (
                            <div className="text-xs text-gray-500">{lead.contact_title}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2">{lead.email ?? "—"}</td>
                      <td className="px-4 py-2">{lead.phone ? formatPhoneNumber(lead.phone) : "—"}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          lead.lead_status === 'open' ? 'bg-green-100 text-green-800' :
                          lead.lead_status === 'converted' ? 'bg-blue-100 text-blue-800' :
                          lead.lead_status === 'lost' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {lead.lead_status ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2">{lead.type ?? "—"}</td>
                      <td className="px-4 py-2">{lead.assigned_to_name ?? "—"}</td>
                      <td className="px-4 py-2">
                        {lead.created_at 
                          ? new Date(lead.created_at).toLocaleDateString()
                          : "—"
                        }
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => {
                            setEditingLeadId(lead.id);
                            setForm(lead);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:underline"
                          title="Edit Lead"
                        >
                          <Wrench size={16} />
                        </button>
                      </td>

                    </tr>
                  ))}
                  {leads.length === 0 && !loading && (
                    <tr>
                      <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                        No leads found for this user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls at bottom */}
          {total > 0 && (
            <>
              <PaginationControls
                currentPage={currentPage}
                perPage={perPage}
                total={total}
                sortOrder={sortOrder}
                onPageChange={setCurrentPage}
                onPerPageChange={updatePerPage}
                onSortOrderChange={updateSortOrder}
                entityName="leads"
                className="border-t pt-4"
              />

              {selectedLeadIds.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete ${selectedLeadIds.length} selected lead(s)?`)) return;

                      const res = await apiFetch("/leads/bulk-delete", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ lead_ids: selectedLeadIds }),
                      });

                      if (res.ok) {
                        const refreshed = await apiFetch(
                          `/leads/all?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}&user_email=${encodeURIComponent(selectedEmail)}`,
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        const data = await refreshed.json();
                        setLeads(data.leads);
                        setTotal(data.total);
                        clearSelection();
                      } else {
                        alert("Failed to delete selected leads");
                      }
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Delete Selected ({selectedLeadIds.length})
                  </button>
                </div>
              )}
            </>
          )}


      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Edit Lead</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingLeadId(null);
                    setForm({});
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <LeadForm
                form={form}
                setForm={setForm}
                onSave={async () => {
                  try {
                    const res = await apiFetch(`/leads/${editingLeadId}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(form),
                    });

                    if (res.ok) {
                      const leadRes = await apiFetch(
                        `/leads/all?page=${currentPage}&per_page=${perPage}&sort=${sortOrder}&user_email=${encodeURIComponent(selectedEmail)}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      const updated = await leadRes.json();
                      setLeads(updated.leads);
                      setShowEditModal(false);
                      setEditingLeadId(null);
                      setForm({});
                    } else {
                      alert("Failed to update lead");
                    }
                  } catch {
                    alert("Failed to update lead");
                  }
                }}

                onCancel={() => {
                  setShowEditModal(false);
                  setEditingLeadId(null);
                  setForm({});
                }}
              />
              
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}