import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/authContext";
import InteractionForm from "@/components/ui/InteractionForm";
import InteractionCard from "@/components/ui/InteractionCard";

interface Client {
  id: number;
  name: string;
  contact_person?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  created_at: string;
}

interface Interaction {
  id: number;
  contact_date: string;
  outcome: string;
  notes: string;
  follow_up?: string;
  client_id?: number;
  lead_id?: number;
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [form, setForm] = useState<Partial<Interaction>>({});
  const [currentlyEditingId, setCurrentlyEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/clients/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((c: Client) => c.id === Number(id));
        setClient(found);
      });

    fetch(`/api/interactions/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setInteractions(data.filter((i: Interaction) => i.client_id === Number(id)));
      });
  }, [id, token]);

  const handleSave = async () => {
    const res = await fetch("/api/interactions/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        client_id: Number(id),
        contact_date: form.contact_date,
        outcome: form.outcome,
        notes: form.notes,
        follow_up: form.follow_up,
      }),
    });

    if (res.ok) {
      const newItem = await res.json();
      setInteractions((prev) => [newItem, ...prev]);
      setForm({});
    } else {
      alert("Failed to save interaction");
    }
  };

  const handleEdit = (interaction: Interaction) => {
    setCurrentlyEditingId(interaction.id);
    setForm({
      contact_date: interaction.contact_date,
      outcome: interaction.outcome,
      notes: interaction.notes,
      follow_up: interaction.follow_up,
    });
  };

  const handleCancelEdit = () => {
    setCurrentlyEditingId(null);
    setForm({});
  };

  const handleUpdate = async () => {
    const res = await fetch(`/api/interactions/${currentlyEditingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const updated = await res.json();
      setInteractions((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      );
      setCurrentlyEditingId(null);
      setForm({});
    } else {
      alert("Failed to update interaction");
    }
  };

  const handleDelete = async (interactionId: number) => {
    if (!window.confirm("Are you sure you want to delete this interaction?")) return;

    const res = await fetch(`/api/interactions/${interactionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      setInteractions((prev) => prev.filter((i) => i.id !== interactionId));
    } else {
      alert("Failed to delete interaction");
    }
  };

  if (!client) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{client.name}</h1>
      <div className="text-gray-700">
        <p><strong>Contact:</strong> {client.contact_person}</p>
        <p><strong>Email:</strong> {client.email}</p>
        <p><strong>Phone:</strong> {client.phone}</p>
        <p><strong>Address:</strong> {client.address}, {client.city}, {client.state} {client.zip}</p>
        <p><strong>Notes:</strong> {client.notes}</p>
      </div>

      {currentlyEditingId === null ? (
        <InteractionForm form={form} setForm={setForm} onSave={handleSave} />
      ) : (
        <InteractionForm form={form} setForm={setForm} onSave={handleUpdate} />
      )}

      {currentlyEditingId !== null && (
        <button
          onClick={handleCancelEdit}
          className="text-sm text-gray-500 underline ml-4"
        >
          Cancel Edit
        </button>
      )}

      <div className="pt-4 border-t">
        <h2 className="text-xl font-semibold mb-2">Past Interactions</h2>
        <ul className="space-y-2">
          {interactions.map((i) => (
            <InteractionCard
              key={i.id}
              interaction={i}
              onEdit={() => handleEdit(i)}
              onDelete={() => handleDelete(i.id)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
