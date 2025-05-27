import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  StickyNote,
  User,
} from "lucide-react";
import { useAuth, userHasRole } from "@/authContext";
import { Lead, Interaction } from "@/types";
import { apiFetch } from "@/lib/api";
import CompanyNotes from "@/components/ui/CompanyNotes";
import CompanyInteractions from "@/components/ui/CompanyInteractions";

// TEMP: All Seasons Foam prefers "Accounts" instead of "Clients"
const USE_ACCOUNT_LABELS = true;

export default function LeadDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [showNoteMenu, setShowNoteMenu] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<{ id: number; email: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch(`/leads/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setLead(data);
        setNoteDraft(data.notes || "");
      });

    apiFetch(`/interactions/?lead_id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setInteractions);

    if (userHasRole(user, "admin")) {
      fetch("/api/users/", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setAvailableUsers(data.filter((u: any) => u.is_active)));
    }
  }, [id, token]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowNoteMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveNote = async () => {
    const res = await apiFetch(`/leads/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: noteDraft }),
    });
    if (res.ok) {
      setLead((prev) => prev && { ...prev, notes: noteDraft });
      setIsEditingNote(false);
    } else {
      alert("Failed to save notes");
    }
  };

  const deleteNote = async () => {
    const res = await apiFetch(`/leads/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: "" }),
    });
    if (res.ok) {
      setLead((prev) => prev && { ...prev, notes: "" });
      setNoteDraft("");
      setIsEditingNote(false);
    } else {
      alert("Failed to delete notes");
    }
  };

  const handleConvertToClient = async () => {
    if (!lead) return;

    const confirmed = confirm(
      `Convert "${lead.name}" to a ${USE_ACCOUNT_LABELS ? "Account" : "Client"}? This will delete the lead.`
    );

    if (!confirmed) return;

    const res = await apiFetch("/clients/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        contact_person: lead.contact_person,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        notes: lead.notes,
      }),
    });

    if (res.ok) {
      const newClient = await res.json();

      await apiFetch("/interactions/transfer", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          from_lead_id: lead.id,
          to_client_id: newClient.id,
        }),
      });

      await apiFetch(`/leads/${lead.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      window.location.href = `/clients/${newClient.id}`;
    } else {
      alert("Failed to convert lead to client");
    }
  };

  if (!lead) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{lead.name}</h1>

      <ul className="text-sm text-gray-700 space-y-1">
        {lead.contact_person && (
          <li className="flex items-center gap-2">
            <User size={14} /> {lead.contact_person}
          </li>
        )}
        {lead.email && (
          <li className="flex items-center gap-2">
            <Mail size={14} />
            <a href={`mailto:${lead.email}`} className="text-blue-600 underline">
              {lead.email}
            </a>
          </li>
        )}
        {lead.phone && (
          <li className="flex items-center gap-2">
            <Phone size={14} />
            <a href={`tel:${lead.phone}`} className="text-blue-600 underline">
              {lead.phone}
            </a>
          </li>
        )}
        <li className="flex items-start gap-2">
          <MapPin size={14} className="mt-[2px]" />
          <div className="leading-tight">
            {lead.address && <div>{lead.address}</div>}
            <div>{[lead.city, lead.state].filter(Boolean).join(", ")} {lead.zip}</div>
          </div>
        </li>
      </ul>

      <CompanyInteractions
        token={token!}
        entityType="lead"
        entityId={lead.id}
        initialInteractions={interactions}
      />

      <CompanyNotes
        notes={noteDraft}
        onSave={saveNote}
        isEditing={isEditingNote}
        setIsEditing={setIsEditingNote}
        onDelete={deleteNote}
        menuRef={menuRef}
        showMenu={showNoteMenu}
        setShowMenu={setShowNoteMenu}
        setNoteDraft={setNoteDraft}
      />

      <button
        onClick={handleConvertToClient}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {`Convert to ${USE_ACCOUNT_LABELS ? "Account" : "Client"}`}
      </button>

      {userHasRole(user, "admin") && (
        <button
          onClick={() => setShowAssignModal(true)}
          className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
        >
          Assign Lead
        </button>
      )}

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
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                disabled={!selectedUserId}
                onClick={async () => {
                  const res = await apiFetch(`/leads/${id}/assign`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ assigned_to: selectedUserId }),
                  });

                  if (res.ok) {
                    setShowAssignModal(false);
                    window.location.reload();
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
