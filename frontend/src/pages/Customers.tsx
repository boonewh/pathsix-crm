import { useEffect, useState } from "react";
import EntityCard from "@/components/ui/EntityCard";
import { useAuth } from "@/authContext";
import { Mail, Phone, MapPin, User, StickyNote } from "lucide-react";
import { Link } from "react-router-dom";


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

export default function Customers() {
  const [clients, setClients] = useState<Client[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const { token } = useAuth();

  useEffect(() => {
    fetch("/api/clients/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setClients)
      .catch(() => setError("Failed to load clients"));
  }, [token]);

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setClients((prev) => prev.filter((c) => c.id !== id));
    else alert("Failed to delete client");
  };

  const handleSave = async () => {
    const method = creating ? "POST" : "PUT";
    const url = creating ? "/api/clients/" : `/api/clients/${editingId}`;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) return alert("Failed to save client");

    const saved = await res.json();
    if (creating) setClients((prev) => [saved, ...prev]);
    else setClients((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
    handleCancel();
  };

  const handleCancel = () => {
    setEditingId(null);
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
      notes: "",
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Customers</h1>

      {error && <p className="text-red-500">{error}</p>}

      <button
        onClick={() => {
          setCreating(true);
          setEditingId(null);
          setForm({
            name: "",
            contact_person: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            zip: "",
            notes: "",
          });
        }}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + New Client
      </button>

      <ul className="space-y-4">
        {creating && (
          <EntityCard
            title="New Client"
            editing
            onSave={handleSave}
            onCancel={handleCancel}
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
                <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" rows={3} />
              </div>
            }
          />
        )}

        {clients.map((client) => (
          <EntityCard
            key={client.id}
            title={<Link to={`/clients/${client.id}`} className="hover:underline">{client.name}</Link>}
            editing={editingId === client.id}
            onEdit={() => {
              setEditingId(client.id);
              setForm(client);
            }}
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={() => handleDelete(client.id)}
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
                <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" rows={3} />
              </div>
            }
            details={
              <ul className="text-sm text-gray-600 space-y-1">
                {client.contact_person && <li className="flex items-center gap-2"><User size={14} /> {client.contact_person}</li>}
                {client.email && <li className="flex items-center gap-2"><Mail size={14} /> {client.email}</li>}
                {client.phone && <li className="flex items-center gap-2"><Phone size={14} /> {client.phone}</li>}
                {(client.address || client.city || client.state || client.zip) && (
                  <li className="flex items-start gap-2">
                    <MapPin size={14} className="mt-[2px]" />
                    <div className="leading-tight">
                      {client.address && <div>{client.address}</div>}
                      <div>{[client.city, client.state].filter(Boolean).join(", ")}{client.zip ? ` ${client.zip}` : ""}</div>
                    </div>
                  </li>
                )}
                {client.notes && <li className="flex items-start gap-2"><StickyNote size={14} className="mt-[2px]" /> <div>{client.notes}</div></li>}
              </ul>
            }
          />
        ))}
      </ul>
    </div>
  );
}
