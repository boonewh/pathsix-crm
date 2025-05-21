import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Mail, Phone, MapPin, StickyNote, User, CalendarPlus, MoreVertical } from "lucide-react";
import { useAuth } from "@/authContext";
import { Lead, Interaction } from "@/types";
import { apiFetch } from "@/lib/api";

export default function LeadDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [interactionForm, setInteractionForm] = useState<Omit<Interaction, "id">>({
    contact_date: "",
    summary: "",
    outcome: "",
    notes: "",
    follow_up: ""
  });
  const [showNoteMenu, setShowNoteMenu] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
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

  const handleInteractionSubmit = async () => {
    const res = await apiFetch("/interactions/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...interactionForm, lead_id: Number(id) }),
    });

    if (res.ok) {
      const newInteraction = await res.json();
      setInteractions((prev) => [...prev, newInteraction]);
      setInteractionForm({ contact_date: "", summary: "", outcome: "", notes: "", follow_up: "" });
      setShowInteractionForm(false);
    } else {
      alert("Failed to save interaction");
    }
  };

  const handleConvertToClient = async () => {
    if (!lead) return;

    const confirmed = confirm(
      `Convert "${lead.name}" to a Client? This will delete the lead.`
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
        {lead.contact_person && <li className="flex items-center gap-2"><User size={14} /> {lead.contact_person}</li>}
        {lead.email && <li className="flex items-center gap-2"><Mail size={14} /> <a href={`mailto:${lead.email}`} className="text-blue-600 underline">{lead.email}</a></li>}
        {lead.phone && <li className="flex items-center gap-2"><Phone size={14} /> <a href={`tel:${lead.phone}`} className="text-blue-600 underline">{lead.phone}</a></li>}
        <li className="flex items-start gap-2">
          <MapPin size={14} className="mt-[2px]" />
          <div className="leading-tight">
            {lead.address && <div>{lead.address}</div>}
            <div>{[lead.city, lead.state].filter(Boolean).join(", ")} {lead.zip}</div>
          </div>
        </li>
      </ul>

      {/* Notes Section */}
      <details className="bg-white rounded shadow-sm border">
        <summary className="cursor-pointer px-4 py-2 font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-t flex items-center gap-2">
          <StickyNote size={16} /> Notes
        </summary>
        <div className="p-4">
          {!lead.notes && !isEditingNote ? (
            <div className="space-y-2">
              <button
                onClick={() => setIsEditingNote(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Note
              </button>
            </div>
          ) : isEditingNote ? (
            <div className="space-y-2">
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={4}
                className="w-full border rounded px-2 py-1 text-sm"
                placeholder="Enter notes here"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveNote}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingNote(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="relative border border-gray-200 rounded p-4 bg-white shadow-sm">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{lead.notes}</p>
              <div className="absolute top-2 right-2" ref={menuRef}>
                <button onClick={() => setShowNoteMenu(prev => !prev)} className="text-gray-500 hover:text-gray-700">
                  <MoreVertical size={16} />
                </button>
                {showNoteMenu && (
                  <div className="absolute right-0 mt-2 w-24 bg-white border rounded shadow-md z-10">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => {
                        setIsEditingNote(true);
                        setShowNoteMenu(false);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      onClick={deleteNote}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </details>

      {/* Interactions Section */}
      <details className="bg-white rounded shadow-sm border">
        <summary className="cursor-pointer px-4 py-2 font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-t flex items-center gap-2">
          <CalendarPlus size={16} /> Interactions
        </summary>
        <div className="p-4 space-y-4">
          {showInteractionForm && (
            <div className="space-y-2 mb-4">
              <input
                type="datetime-local"
                value={interactionForm.contact_date}
                onChange={(e) => setInteractionForm({ ...interactionForm, contact_date: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
                placeholder="Contact Date"
              />
              <input
                placeholder="Summary"
                value={interactionForm.summary}
                onChange={(e) => setInteractionForm({ ...interactionForm, summary: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
              <input
                placeholder="Outcome"
                value={interactionForm.outcome}
                onChange={(e) => setInteractionForm({ ...interactionForm, outcome: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
              <textarea
                placeholder="Notes"
                value={interactionForm.notes}
                onChange={(e) => setInteractionForm({ ...interactionForm, notes: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
                rows={3}
              />
              <input
                type="datetime-local"
                value={interactionForm.follow_up}
                onChange={(e) => setInteractionForm({ ...interactionForm, follow_up: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
                placeholder="Follow-up Date"
              />
              <button
                onClick={handleInteractionSubmit}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save Interaction
              </button>
            </div>
          )}

          <button
            onClick={() => setShowInteractionForm((prev) => !prev)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showInteractionForm ? "Cancel" : "Add Interaction"}
          </button>

          <ul className="space-y-2">
            {interactions.map((i) => (
              <li key={i.id} className="border border-gray-300 p-4 rounded bg-white shadow-sm">
                <p className="text-sm text-gray-700"><strong>{new Date(i.contact_date).toLocaleString()}</strong></p>
                <p className="text-sm">{i.summary}</p>
                {i.follow_up && (
                  <p className="text-xs text-blue-600">Follow-up: {new Date(i.follow_up).toLocaleDateString()}</p>
                )}
                {i.notes && <p className="text-xs text-gray-500 mt-1">{i.notes}</p>}
              </li>
            ))}
          </ul>
        </div>
      </details>

      <button
        onClick={handleConvertToClient}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Convert to Client
      </button>
    </div>
  );
}
