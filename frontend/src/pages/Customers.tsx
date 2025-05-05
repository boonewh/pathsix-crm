import { useEffect, useState } from "react";
import ClientCard from "@/components/ClientCard";

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
}

export default function Customers() {
  const [clients, setClients] = useState<Client[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Client>>({});
  const [error, setError] = useState("");

  const token = localStorage.getItem("token") || "YOUR_TEST_JWT_HERE";

  useEffect(() => {
    fetch("/api/clients/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        console.log("Response status:", res.status);
        const text = await res.text();
        console.log("Raw response body:", text);

        try {
          const data = JSON.parse(text);
          console.log("Parsed data:", data);
          setClients(data);
        } catch (err) {
          console.error("JSON parse error:", err);
          setError("Invalid server response");
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Failed to load clients");
      });
  }, []);

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      setClients((prev) => prev.filter((client) => client.id !== id));
    } else {
      alert("Failed to delete client");
    }
  };

  const handleSave = async (id: number) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const updated = await res.json();
      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
    } else {
      alert("Failed to save changes.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Customers</h1>

      {error && <p className="text-red-500">{error}</p>}

      <ul className="space-y-4">
        {clients.map((client) => (
          <ClientCard
          key={client.id}
          client={client}
          editing={editingId === client.id}
          form={form}
          setForm={setForm}
          onEdit={() => {
            setEditingId(client.id);
            setForm(client);
          }}
          onCancel={() => setEditingId(null)}
          onSave={() => handleSave(client.id)}
          onDelete={() => handleDelete(client.id)}
        />
        
        ))}
      </ul>
    </div>
  );
}
