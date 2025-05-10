import { useEffect, useState } from "react";
import EntityCard from "@/components/ui/EntityCard";

type Account = {
  id: number;
  account_number: string;
  status: string;
};

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentlyEditingId, setCurrentlyEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Account>>({ account_number: "" });

  useEffect(() => {
    const fetchAccounts = async () => {
      const res = await fetch("/api/accounts/", {
        headers: {
          Authorization: "Bearer your-token-here",
        },
      });
      const data = await res.json();
      setAccounts(data);
    };

    fetchAccounts();
  }, []);

  const handleEdit = (account: Account) => {
    setCurrentlyEditingId(account.id);
    setForm({ account_number: account.account_number });
  };

  const handleCancel = () => {
    setCurrentlyEditingId(null);
    setForm({ account_number: "" });
  };

  const handleSave = () => {
    console.log("Saving account:", currentlyEditingId, form);
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === currentlyEditingId ? { ...a, ...form } : a
      )
    );
    handleCancel();
  };

  return (
    <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => (
        <EntityCard
          key={account.id}
          title={account.account_number}
          details={
            <p className="text-sm text-gray-500">Status: {account.status}</p>
          }
          editing={currentlyEditingId === account.id}
          editForm={
            <input
              type="text"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.account_number}
              onChange={(e) => setForm({ ...form, account_number: e.target.value })}
            />
          }
          onEdit={() => handleEdit(account)}
          onDelete={() => console.log("delete", account.id)}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ))}
    </div>
  );
}
