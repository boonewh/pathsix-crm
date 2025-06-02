import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Client } from "@/types";

interface ClientFormProps {
  form: Partial<Client>
  setForm: React.Dispatch<React.SetStateAction<Partial<Client>>>;
}

export default function ClientForm({ form, setForm }: ClientFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Company Name</Label>
        <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact_person">Contact Person</Label>
        <Input id="contact_person" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact_title">Title</Label>
        <Input id="contact_title" value={form.contact_title} onChange={(e) => setForm({ ...form, contact_title: e.target.value })} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Primary Phone</Label>
        <div className="grid grid-cols-3 gap-2">
          <Input
            id="phone"
            value={form.phone || ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="(123) 456-7890"
            className="col-span-2"
          />
          <select
            id="phone_label"
            value={form.phone_label || "work"}
            onChange={(e) => setForm({ ...form, phone_label: e.target.value as "work" | "mobile" })}
            className="border border-input bg-background text-sm rounded-md px-2 py-1"
          >
            <option value="work">Work</option>
            <option value="mobile">Mobile</option>
          </select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="secondary_phone">Secondary Phone <span className="text-muted-foreground text-sm">(optional)</span></Label>
        <div className="grid grid-cols-3 gap-2">
          <Input
            id="secondary_phone"
            value={form.secondary_phone || ""}
            onChange={(e) => setForm({ ...form, secondary_phone: e.target.value })}
            placeholder="(123) 555-6789"
            className="col-span-2"
          />
          <select
            id="secondary_phone_label"
            value={form.secondary_phone_label || "mobile"}
            onChange={(e) => setForm({ ...form, secondary_phone_label: e.target.value as "work" | "mobile" })}
            className="border border-input bg-background text-sm rounded-md px-2 py-1"
          >
            <option value="mobile">Mobile</option>
            <option value="work">Work</option>
          </select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="zip">Zip</Label>
          <Input id="zip" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
    </div>
  );
}
