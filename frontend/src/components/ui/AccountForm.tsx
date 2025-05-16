import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Account } from "@/types";

interface SelectableEntity {
  id: number;
  name: string;
}

interface AccountFormProps {
  form: Partial<Account> | undefined;
  setForm: React.Dispatch<React.SetStateAction<Partial<Account>>>;
  clients: SelectableEntity[];
}

export default function AccountForm({ form, setForm, clients }: AccountFormProps) {
  if (!form) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="account_number">Account Number</Label>
        <Input
          id="account_number"
          value={form.account_number || ""}
          onChange={(e) =>
            setForm({ ...form, account_number: e.target.value })
          }
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="account_name">Account Name</Label>
        <Input
          id="account_name"
          value={form.account_name || ""}
          onChange={(e) =>
            setForm({ ...form, account_name: e.target.value })
          }
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <Input
          id="status"
          value={form.status || ""}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="opened_on">Opened On</Label>
        <Input
          id="opened_on"
          type="datetime-local"
          value={form.opened_on || ""}
          onChange={(e) => setForm({ ...form, opened_on: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="client_id">Client</Label>
        <select
          id="client_id"
          value={form.client_id || ""}
          onChange={(e) =>
            setForm({
              ...form,
              client_id: parseInt(e.target.value) || undefined,
            })
          }
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">-- Select Client --</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={form.notes || ""}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
    </div>
  );
}