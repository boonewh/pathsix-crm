import { useEffect, useState } from "react";
import EntityCard from "@/components/ui/EntityCard";
import { useAuth } from "@/authContext";
import { Mail, Phone, MapPin, User, StickyNote } from "lucide-react";
import { Link } from "react-router-dom";
import CompanyForm from "@/components/ui/CompanyForm";
import { Client } from "@/types";
import { apiFetch } from "@/lib/api";

// TEMP: All Seasons Foam prefers "Accounts" instead of "Clients"
const USE_ACCOUNT_LABELS = true;

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
    apiFetch("/clients/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setClients)
      .catch(() => setError("Failed to load clients"));
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    const res = await apiFetch(`/clients/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setClients((prev) => prev.filter((c) => c.id !== id));
    } else {
      alert("Failed to delete client");
    }
  };

  const handleSave = async () => {
    try {
      const method = creating ? "POST" : "PUT";
      const url = creating ? "/clients/" : `/clients/${editingId}`;

      const res = await apiFetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save client");

      const updatedRes = await apiFetch("/clients/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fullData = await updatedRes.json();
      setClients(fullData);
      handleCancel();
    } catch (err: any) {
      setError(err.message || "Failed to save client");
    }
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
      <h1 className="text-2xl font-bold mb-4">
        {USE_ACCOUNT_LABELS ? "Accounts" : "Clients"}
      </h1>

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
        {`+ New ${USE_ACCOUNT_LABELS ? "Account" : "Client"}`}
      </button>

      <ul className="space-y-4">
        {creating && (
          <EntityCard
            title={USE_ACCOUNT_LABELS ? "New Account" : "New Client"}
            editing
            onSave={handleSave}
            onCancel={handleCancel}
            editForm={<CompanyForm form={form} setForm={setForm} />}
          />
        )}

        {clients.map((client) => (
          <EntityCard
            key={client.id}
            title={
              <Link to={`/clients/${client.id}`} className="hover:underline">
                {client.name}
              </Link>
            }
            editing={editingId === client.id}
            onEdit={() => {
              setEditingId(client.id);
              setForm(client);
            }}
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={() => handleDelete(client.id)}
            editForm={<CompanyForm form={form} setForm={setForm} />}
            details={
              <ul className="text-sm text-gray-600 space-y-1">
                {client.contact_person && (
                  <li className="flex items-start gap-2">
                    <User size={14} className="mt-[2px]" />
                    <div className="leading-tight">
                      <div>{client.contact_person}</div>
                      {client.contact_title && (
                        <div className="text-gray-500 text-sm italic">{client.contact_title}</div>
                      )}
                    </div>
                  </li>
                )}
                {client.email && (
                  <li className="flex items-center gap-2">
                    <Mail size={14} /> {client.email}
                  </li>
                )}
                {client.phone && (
                  <li className="flex items-center gap-2">
                    <Phone size={14} /> {client.phone}
                  </li>
                )}
                {(client.address || client.city || client.state || client.zip) && (
                  <li className="flex items-start gap-2">
                    <MapPin size={14} className="mt-[2px]" />
                    <div className="leading-tight">
                      {client.address && <div>{client.address}</div>}
                      <div>
                        {[client.city, client.state].filter(Boolean).join(", ")}
                        {client.zip ? ` ${client.zip}` : ""}
                      </div>
                    </div>
                  </li>
                )}
                {client.notes && (
                  <li className="flex items-start gap-2">
                    <StickyNote size={14} className="mt-[2px]" />{" "}
                    <div>{client.notes}</div>
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
