import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import { Account } from "@/types";
import AccountForm from "@/components/ui/AccountForm";
import EntityCard from "@/components/ui/EntityCard";
import { FormWrapper } from "@/components/ui/FormWrapper";
import { apiFetch } from "@/lib/api";

// TEMP: All Seasons Foam prefers "Accounts" instead of "Clients"
const USE_ACCOUNT_LABELS = true;

interface SelectableEntity {
  id: number;
  name: string;
}

export default function Accounts() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [clients, setClients] = useState<SelectableEntity[]>([]);
  const [form, setForm] = useState<Partial<Account>>({});
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Load accounts
  useEffect(() => {
    const loadAccounts = async () => {
      const res = await apiFetch("/accounts/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.error("Expected array from /accounts/, got:", data);
        return;
      }
      setAccounts(data);
    };
    loadAccounts();
  }, [token]);

  // Load clients for dropdown
  useEffect(() => {
    const loadClients = async () => {
      const res = await apiFetch("/clients/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClients(data.map((c: any) => ({ id: c.id, name: c.name })));
    };
    loadClients();
  }, [token]);

  const resetForm = () => {
    setForm({});
    setCreating(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    const method = creating ? "POST" : "PUT";
    const url = creating
      ? "/accounts/"
      : `/accounts/${editingId}`;

    const res = await apiFetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const updated = await apiFetch("/accounts/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await updated.json();
      setAccounts(data);
      resetForm();
    } else {
      alert("Failed to save account");
    }
  };

  const handleDelete = async (id: number) => {
    const res = await apiFetch(`/accounts/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert("Failed to delete account");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Accounts</h1>

      <button
        onClick={() => {
          setCreating(true);
          setForm({});
        }}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + New Account
      </button>

      <ul className="space-y-4">
        {creating && (
          <EntityCard
            title="New Account"
            editing
            onSave={handleSave}
            onCancel={resetForm}
            editForm={
              <FormWrapper>
                <AccountForm
                  form={form}
                  setForm={setForm}
                  clients={clients}
                />
              </FormWrapper>
            }
          />
        )}

        {accounts.map((account) => (
          <EntityCard
            key={account.id}
            title={account.account_number}
            editing={editingId === account.id}
            onEdit={() => {
              setEditingId(account.id);
              setForm(account);
            }}
            onCancel={resetForm}
            onSave={handleSave}
            onDelete={() => handleDelete(account.id)}
            editForm={
              <FormWrapper>
                <AccountForm
                  form={form}
                  setForm={setForm}
                  clients={clients}
                />
              </FormWrapper>
            }
            details={
              <ul className="text-sm text-gray-700 space-y-1">
                {account.account_name && <li>Name: {account.account_name}</li>}
                {account.status && <li>Status: {account.status}</li>}
                {account.opened_on && (
                  <li>Opened: {new Date(account.opened_on).toLocaleDateString()}</li>
                )}
                {account.client_id && (
                  <li>
                    {account.client_name
                      ? <li>{USE_ACCOUNT_LABELS ? "Owner" : "Client"}: {account.client_name}</li>
                      : <li>{USE_ACCOUNT_LABELS ? "Owner ID" : "Client ID"}: {account.client_id}</li>}
                  </li>
                )}
                {account.notes && <li>Notes: {account.notes}</li>}
              </ul>
            }
          />
        ))}
      </ul>
    </div>
  );
}
