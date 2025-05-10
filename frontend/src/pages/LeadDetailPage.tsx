import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/authContext";
import InteractionForm from "@/components/ui/InteractionForm";
import InteractionCard from "@/components/ui/InteractionCard";

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
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

export default function LeadDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [form, setForm] = useState<Partial<Interaction>>({});

  useEffect(() => {
    fetch(`/api/leads/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((l: Lead) => l.id === Number(id));
        setLead(found);
      });

    fetch(`/api/interactions/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setInteractions(data.filter((i: Interaction) => i.lead_id === Number(id)));
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
        lead_id: Number(id),
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

  if (!lead) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{lead.name}</h1>
      <div className="text-gray-700">
        <p><strong>Email:</strong> {lead.email}</p>
        <p><strong>Phone:</strong> {lead.phone}</p>
        <p><strong>Address:</strong> {lead.address}</p>
        <p><strong>Created:</strong> {new Date(lead.created_at).toLocaleDateString()}</p>
      </div>

      <InteractionForm form={form} setForm={setForm} onSave={handleSave} />

      <div className="pt-4 border-t">
        <h2 className="text-xl font-semibold mb-2">Past Interactions</h2>
        <ul className="space-y-2">
          {interactions.map((i) => (
            <InteractionCard key={i.id} interaction={i} />
          ))}
        </ul>
      </div>
    </div>
  );
}
