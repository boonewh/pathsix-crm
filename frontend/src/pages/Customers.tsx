import { useEffect, useState } from "react";

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
  const [error, setError] = useState("");

  // Replace with your real JWT token later
  const token = localStorage.getItem("token") || "YOUR_TEST_JWT_HERE";

  useEffect(() => {
    fetch("/api/clients/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setClients)
      .catch(() => setError("Failed to load clients"));
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Customers</h1>

      {error && <p className="text-red-500">{error}</p>}

      <ul className="space-y-2">
        {clients.map((client) => (
          <li key={client.id} className="border p-4 rounded shadow">
            <div className="flex justify-between">
              <div>
                <p><strong>{client.name}</strong></p>
                <p>{client.email}</p>
                <p>{client.phone}</p>
                <p className="text-sm text-gray-500">{client.address}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-yellow-400 px-3 py-1 rounded"
                  onClick={() => alert("TODO: Edit form")}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded"
                  onClick={() => handleDelete(client.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
