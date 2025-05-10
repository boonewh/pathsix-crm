import { useEffect, useState } from "react";
import EntityCard from "@/components/ui/EntityCard";

type Lead = {
  id: number;
  name: string;
};


export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentlyEditingId, setCurrentlyEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Lead>>({ name: "" });

  // Fetch leads on load
  useEffect(() => {
    const fetchLeads = async () => {
      const res = await fetch("/api/leads/", {
        headers: {
          Authorization: "Bearer your-token-here",
        },
      });
      const data = await res.json();
      setLeads(data);
    };

    fetchLeads();
  }, []);

  // Start editing a specific lead
  const handleEdit = (lead: any) => {
    setCurrentlyEditingId(lead.id);
    setForm({ name: lead.name }); // you can add more fields later
  };

  // Cancel editing
  const handleCancel = () => {
    setCurrentlyEditingId(null);
    setForm({ name: "" });
  };

  // Save changes (replace this with an API call later)
  const handleSave = () => {
    console.log("Saving lead:", currentlyEditingId, form);
    // Optional: update local state
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === currentlyEditingId ? { ...lead, ...form } : lead
      )
    );
    handleCancel();
  };

  return (
    <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {leads.map((lead: any) => (
        <EntityCard
          key={lead.id}
          title={lead.name}
          details={<p className="text-sm text-gray-500">ID: {lead.id}</p>}
          editing={currentlyEditingId === lead.id}
          editForm={
            <input
              type="text"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          }
          onEdit={() => handleEdit(lead)}
          onDelete={() => console.log("delete", lead.id)}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ))}
    </div>
  );
}
