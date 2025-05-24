import { useEffect, useState } from "react";
import EntityCard from "@/components/ui/EntityCard";
import { Mail, Phone, MapPin, Flag, User, StickyNote } from "lucide-react";
import { useAuth, userHasRole } from "@/authContext";
import { Link } from "react-router-dom";
import CompanyForm from "@/components/ui/CompanyForm";
import { Lead } from "@/types";
import { apiFetch } from "@/lib/api";

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentlyEditingId, setCurrentlyEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Partial<Lead>>({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    status: "",
    notes: "",
  });
  const { token, user } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [availableUsers, setAvailableUsers] = useState<{ id: number; email: string }[]>([]);


useEffect(() => {
  const fetchLeads = async () => {
    try {
      const res = await apiFetch("/leads/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      setError("Failed to load leads");
    }
  };

  fetchLeads();

  // ✅ Add this after fetchLeads()
  if (userHasRole(user, "admin")) {
    fetch("/api/users/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setAvailableUsers(data.filter((u: any) => u.is_active)));
  }
}, [token]);

  const handleEdit = (lead: Lead) => {
    setCurrentlyEditingId(lead.id);
    setForm({ ...lead });
  };

  const handleCancel = () => {
    setCurrentlyEditingId(null);
    setCreating(false);
    setForm({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      status: "",
      notes: "",
    });
  };

  const handleSave = async () => {
    const method = creating ? "POST" : "PATCH";
    const url = creating ? "/leads/" : `/leads/${currentlyEditingId}`;

    const res = await apiFetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });

    if (!res.ok) return alert("Failed to save lead");

    const updatedRes = await apiFetch("/leads/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const fullData = await updatedRes.json();
    setLeads(fullData);

    handleCancel();
  };

  const handleDelete = async (id: number) => {
    const res = await apiFetch(`/leads/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setLeads((prev) => prev.filter((l) => l.id !== id));
    else alert("Failed to delete lead");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Leads</h1>

      {error && <p className="text-red-500">{error}</p>}

      <button
        onClick={() => {
          setCreating(true);
          setCurrentlyEditingId(null);
          setForm({
            name: "",
            contact_person: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            zip: "",
            status: "",
            notes: "",
          });
        }}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + New Lead
      </button>

      <ul className="space-y-4">
        {creating && (
          <EntityCard
            title="New Lead"
            editing
            onSave={handleSave}
            onCancel={handleCancel}
            editForm={<CompanyForm form={form} setForm={setForm} />}
          />
        )}

        {leads.map((lead) => (
          <EntityCard
            key={lead.id}
            title={
              <Link to={`/leads/${lead.id}`} className="hover:underline">
                {lead.name}
              </Link>
            }
            editing={currentlyEditingId === lead.id}
            onEdit={() => handleEdit(lead)}
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={() => handleDelete(lead.id)}
            editForm={<CompanyForm form={form} setForm={setForm} />}
            details={
              <ul className="text-sm text-gray-600 space-y-1">
                {lead.contact_person && (
                  <li className="flex items-center gap-2">
                    <User size={14} /> {lead.contact_person}
                  </li>
                )}
                {lead.email && (
                  <li className="flex items-center gap-2">
                    <Mail size={14} /> {lead.email}
                  </li>
                )}
                {lead.phone && (
                  <li className="flex items-center gap-2">
                    <Phone size={14} /> {lead.phone}
                  </li>
                )}
                {(lead.address || lead.city || lead.state || lead.zip) && (
                  <li className="flex items-start gap-2">
                    <MapPin size={14} className="mt-[2px]" />
                    <div className="leading-tight">
                      {lead.address && <div>{lead.address}</div>}
                      <div>
                        {[lead.city, lead.state].filter(Boolean).join(", ")}
                        {lead.zip ? ` ${lead.zip}` : ""}
                      </div>
                    </div>
                  </li>
                )}
                {lead.status && (
                  <li className="flex items-center gap-2">
                    <Flag size={14} /> {lead.status}
                  </li>
                )}
                {lead.notes && (
                  <li className="flex items-start gap-2">
                    <StickyNote size={14} className="mt-[2px]" />
                    <div>{lead.notes}</div>
                  </li>
                )}
              </ul>
            }
            extraMenuItems={
              userHasRole(user, "admin") ? (
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  onClick={() => {
                    setSelectedLeadId(lead.id);
                    setShowAssignModal(true);
                  }}
                >
                  Assign
                </button>
              ) : null
            }
          />
        ))}
      </ul>
      
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Assign Lead</h2>

            <select
              value={selectedUserId || ""}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 mb-4"
            >
              <option value="">Select a user</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUserId(null);
                  setSelectedLeadId(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                disabled={!selectedUserId}
                onClick={async () => {
                  const res = await apiFetch(`/leads/${selectedLeadId}/assign`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ assigned_to: selectedUserId }),
                  });

                  if (res.ok) {
                    setShowAssignModal(false);
                    setSelectedUserId(null);
                    setSelectedLeadId(null);
                    const updatedRes = await apiFetch("/leads/", {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const fullData = await updatedRes.json();
                    setLeads(fullData);
                  } else {
                    alert("Failed to assign lead.");
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}