import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Client } from "@/types";
import PhoneInput from "@/components/ui/PhoneInput";

interface ClientFormProps {
  form: Partial<Client>
  setForm: React.Dispatch<React.SetStateAction<Partial<Client>>>;
  onSave: () => void;
  onCancel: () => void;
}

export default function ClientForm({ form, setForm, onSave, onCancel }: ClientFormProps) {
  return (
    <div className="relative">
      <div className="space-y-4 pb-28">
        <div className="grid gap-2">
          <Label htmlFor="name">Company Name</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            value={form.type || "None"}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="border border-input bg-background text-sm rounded-md px-2 py-1"
          >
            <option value="None">None</option>
            <option value="Oil & Gas">Oil & Gas</option>
            <option value="Secondary Containment">Secondary Containment</option>
            <option value="Tanks">Tanks</option>
            <option value="Pipe">Pipe</option>
            <option value="Rental">Rental</option>
            <option value="Food and Beverage">Food and Beverage</option>
            <option value="Bridge">Bridge</option>
            <option value="Culvert">Culvert</option>
          </select>
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
          <Label htmlFor="phone">Phone</Label>
          <div className="grid grid-cols-3 gap-2">
            <PhoneInput
              value={form.phone || ""}
              onChange={(cleanedPhone) => setForm({ ...form, phone: cleanedPhone })}
              placeholder="(123) 456-7890"
              className="col-span-2"
            />
            <select
              value={form.phone_label || "work"}
              onChange={(e) => setForm({ ...form, phone_label: e.target.value as "work" | "mobile" })}
              className="border border-input bg-background text-sm rounded-md px-2 py-1"
            >
              <option value="work">Work</option>
              <option value="mobile">Mobile</option>
              <option value="home">Home</option>
              <option value="fax">Fax</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="secondary_phone">Secondary Phone</Label>
          <div className="grid grid-cols-3 gap-2">
            <PhoneInput
              value={form.secondary_phone || ""}
              onChange={(cleanedPhone) => setForm({ ...form, secondary_phone: cleanedPhone })}
              placeholder="(123) 555-6789"
              className="col-span-2"
            />
            <select
              value={form.secondary_phone_label || "mobile"}
              onChange={(e) => setForm({ ...form, secondary_phone_label: e.target.value as "work" | "mobile" })}
              className="border border-input bg-background text-sm rounded-md px-2 py-1"
            >
              <option value="mobile">Mobile</option>
              <option value="work">Work</option>
              <option value="home">Home</option>
              <option value="fax">Fax</option>
              <option value="other">Other</option>
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

      {/* Sticky Save/Cancel Footer */}
      <div className="sticky bottom-0 bg-white pt-4 border-t flex justify-end gap-2 z-10">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}
