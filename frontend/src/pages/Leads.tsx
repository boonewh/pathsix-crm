import { useEffect, useState } from "react";
import EntityCard from "@/components/ui/EntityCard";
import { Mail, Phone, MapPin, Flag, User, StickyNote } from "lucide-react";
import { useAuth } from "@/authContext";
import { Link } from "react-router-dom";


interface Lead {
  id: number;
  name: string;
  contact_person?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  status: string;
  notes?: string;
  created_at: string;
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentlyEditingId, setCurrentlyEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
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
      const res = await fetch("/api/leads/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setLeads(data);
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

    if (!res.ok) return alert("Failed to save");

    const saved = await res.json();
    if (creating) setLeads((prev) => [saved, ...prev]);
    else setLeads((prev) => prev.map((l) => (l.id === saved.id ? saved : l)));

    handleCancel();
  };

  return (
    <div className="p-6">
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

      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(creating ? [
          <EntityCard
            key="new"
            title="New Lead"
            editing
            editForm={
              <div className="space-y-2">
                <input placeholder="Company Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                <input placeholder="Contact Person" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                <input placeholder="Zip" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                <input placeholder="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" rows={3} />
              </div>
            }
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ] : []).concat(
          leads.map((lead) => (
            <EntityCard
              key={lead.id}
              title={<Link to={`/leads/${lead.id}`} className="hover:underline">{lead.name}</Link>}
              editing={currentlyEditingId === lead.id}
              editForm={
                <div className="space-y-2">
                  <input placeholder="Company Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                  <input placeholder="Contact Person" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                  <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                  <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                  <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                  <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                  <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                  <input placeholder="Zip" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                  <input placeholder="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                  <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" rows={3} />
                </div>
              }
              onEdit={() => handleEdit(lead)}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={() => console.log("delete", lead.id)}
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
          ))
        )}
      </ul>
    </div>
  );
}
