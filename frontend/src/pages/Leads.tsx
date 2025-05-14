import { useEffect, useState } from "react";
import EntityCard from "@/components/ui/EntityCard";
import { Mail, Phone, MapPin, Flag, User, StickyNote } from "lucide-react";
import { useAuth } from "@/authContext";
import { Link } from "react-router-dom";
import ClientForm from "@/components/ClientForm";
import { Lead } from "@/types";

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

  const { token } = useAuth();

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch("/api/leads/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setLeads(data);
      } catch (err) {
        setError("Failed to load leads");
      }
    };

    fetchLeads();
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
    const url = creating ? "/api/leads/" : `/api/leads/${currentlyEditingId}`;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) return alert("Failed to save lead");

    const updatedRes = await fetch("/api/leads/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const fullData = await updatedRes.json();
    setLeads(fullData);

    handleCancel();
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/leads/${id}`, {
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
            editForm={<ClientForm form={form} setForm={setForm} />}
          />
        )}

        {leads.map((lead) => (
          <EntityCard
            key={lead.id}
            title={<Link to={`/leads/${lead.id}`} className="hover:underline">{lead.name}</Link>}
            editing={currentlyEditingId === lead.id}
            onEdit={() => handleEdit(lead)}
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={() => handleDelete(lead.id)}
            editForm={<ClientForm form={form} setForm={setForm} />}
            details={
              <ul className="text-sm text-gray-600 space-y-1">
                {lead.contact_person && (
                  <li className="flex items-center gap-2"><User size={14} /> {lead.contact_person}</li>
                )}
                {lead.email && (
                  <li className="flex items-center gap-2"><Mail size={14} /> {lead.email}</li>
                )}
                {lead.phone && (
                  <li className="flex items-center gap-2"><Phone size={14} /> {lead.phone}</li>
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
                  <li className="flex items-center gap-2"><Flag size={14} /> {lead.status}</li>
                )}
                {lead.notes && (
                  <li className="flex items-start gap-2">
                    <StickyNote size={14} className="mt-[2px]" />
                    <div>{lead.notes}</div>
                  </li>
                )}
              </ul>
            }
          />
        ))}
      </ul>
    </div>
  );
}
