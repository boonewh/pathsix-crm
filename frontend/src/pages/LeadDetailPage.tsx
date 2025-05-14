import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Mail, Phone, MapPin, StickyNote, User, CalendarPlus } from "lucide-react";
import { useAuth } from "@/authContext";
import { Lead, Interaction } from "@/types";

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

  useEffect(() => {
    fetch(`/api/leads/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setLead);

    fetch(`/api/interactions/?lead_id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setInteractions);
  }, [id, token]);

  const handleInteractionSubmit = async () => {
    const res = await fetch("/api/interactions/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...interactionForm, lead_id: id }),
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
        {lead.notes && <li className="flex items-start gap-2"><StickyNote size={14} className="mt-[2px]" /> <div>{lead.notes}</div></li>}
      </ul>

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
    </div>
  );
}
