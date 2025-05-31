import { useEffect, useState } from "react";
import { CalendarPlus, MoreVertical } from "lucide-react";
import { InteractionFormData, Interaction } from "@/types";
import { apiFetch } from "@/lib/api";
import InteractionForm from "@/components/ui/InteractionsForm";
import InteractionModal from "@/components/ui/InteractionModal";
import { generateGoogleCalendarUrl } from "@/lib/calendarUtils";

const USE_ACCOUNT_LABELS = true;

type Props = {
  token: string;
  entityType: "lead" | "client";
  entityId: number;
  initialInteractions: Interaction[];
};

export default function CompanyInteractions({
  token,
  entityType,
  entityId,
  initialInteractions,
}: Props) {
  const [interactions, setInteractions] = useState(initialInteractions);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  const [form, setForm] = useState<InteractionFormData>({
    contact_date: "",
    summary: "",
    outcome: "",
    notes: "",
    follow_up: null,
  });

  const resetForm = () => {
    setForm({
      contact_date: "",
      summary: "",
      outcome: "",
      notes: "",
      follow_up: null,
    });
  };

  const fetchUpdatedInteractions = async () => {
    const res = await apiFetch(`/interactions/?${entityType}_id=${entityId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setInteractions(data);
    }
  };

  const handleSubmit = async () => {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/interactions/${editingId}` : "/interactions/";

    const res = await apiFetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        [`${entityType}_id`]: entityId,
      }),
    });

    if (res.ok) {
      const { id: createdId } = await res.json();

      const fetchRes = await apiFetch(`/interactions/?${entityType}_id=${entityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (fetchRes.ok) {
        const allInteractions = await fetchRes.json();
        setInteractions(allInteractions);

        const created = allInteractions.find((i: Interaction) => i.id === createdId);
        setSelectedInteraction(created || null);
      }

      resetForm();
      setShowForm(false);
      setEditingId(null);
    } else {
      alert("Failed to save interaction");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this interaction?")) return;

    const res = await apiFetch(`/interactions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      await fetchUpdatedInteractions();
    } else {
      alert("Failed to delete interaction.");
    }
  };

  useEffect(() => {
    setInteractions(initialInteractions);
  }, [initialInteractions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menu = document.getElementById("kabob-menu");
      if (menu && !menu.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <details className="bg-white rounded shadow-sm border">
      <summary className="cursor-pointer px-4 py-2 font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-t flex items-center gap-2">
        <CalendarPlus size={16} /> Interactions
      </summary>

      <div className="p-4 space-y-4">
        {showForm && (
          <InteractionForm
            form={form}
            updateForm={setForm}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
              resetForm();
            }}
            isEditing={editingId !== null}
          />
        )}

        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              resetForm();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Interaction
          </button>
        )}

        <ul className="space-y-2">
          {interactions.map((i) => (
            <li
              key={i.id}
              className="relative border border-gray-300 p-4 rounded bg-white shadow-sm cursor-pointer"
              onClick={() => setSelectedInteraction(i)}
            >
              <p className="text-sm text-gray-700">
                <strong>
                  {i.contact_date
                    ? new Date(i.contact_date).toLocaleString()
                    : "Missing date"}
                </strong>
              </p>

              <p className="text-sm">{i.summary}</p>

              {i.notes && <p className="text-xs text-gray-500 mt-1">{i.notes}</p>}

              {i.follow_up && (
                <p className="text-xs text-blue-600 mt-1">
                  Follow-up: {new Date(i.follow_up).toLocaleDateString()}
                </p>
              )}

              {i.outcome && (
                <p className="text-xs text-gray-700 mt-1">
                  <strong>Next Step:</strong> {i.outcome}
                </p>
              )}

              <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === i.id ? null : i.id);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <MoreVertical size={16} />
                </button>

                {openMenuId === i.id && (
                  <div id="kabob-menu" className="absolute right-0 mt-2 w-24 bg-white border rounded shadow-md z-50">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm({
                          contact_date: i.contact_date,
                          summary: i.summary,
                          outcome: i.outcome,
                          notes: i.notes,
                          follow_up: i.follow_up ?? null,
                        });
                        setShowForm(true);
                        setEditingId(i.id);
                        setOpenMenuId(null);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(i.id);
                        setOpenMenuId(null);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        {selectedInteraction && (
          <InteractionModal
            title={`${
              entityType === "client"
                ? USE_ACCOUNT_LABELS ? "Account" : "Client"
                : "Lead"
            } Interaction`}
            date={new Date(selectedInteraction.contact_date).toLocaleString()}
            outcome={selectedInteraction.outcome}
            summary={selectedInteraction.summary}
            notes={selectedInteraction.notes}
            contact_person={selectedInteraction.contact_person}
            email={selectedInteraction.email}
            phone={selectedInteraction.phone}
            profile_link={selectedInteraction.profile_link}
            onClose={() => setSelectedInteraction(null)}
            calendarLink={
              selectedInteraction.follow_up
                ? generateGoogleCalendarUrl(selectedInteraction)
                : undefined
            }
            icsLink={
              selectedInteraction.follow_up
                ? `/api/interactions/${selectedInteraction.id}/calendar.ics`
                : undefined
            }
          />
        )}
      </div>
    </details>
  );
}
