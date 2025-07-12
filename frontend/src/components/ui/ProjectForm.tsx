import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Project } from "@/types";
import PhoneInput from "@/components/ui/PhoneInput";

// TEMP: All Seasons Foam prefers "Accounts" instead of "Clients"
const USE_ACCOUNT_LABELS = true;

interface ProjectFormProps {
  form: Partial<Project>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Project>>>;
  clients: { id: number; name: string }[];
  leads: { id: number; name: string }[];
  onSave: () => void;
  onCancel: () => void;
}

export default function ProjectForm({ form, setForm, clients, leads, onSave, onCancel }: ProjectFormProps) {
  return (
    <div className="relative">
      <div className="space-y-4 pb-28">
        {/* Basic Project Information */}
        <div className="grid gap-2">
          <Label htmlFor="project_name">Project Name *</Label>
          <Input
            id="project_name"
            value={form.project_name || ""}
            onChange={(e) => setForm({ ...form, project_name: e.target.value })}
            required
          />
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
          <Label htmlFor="project_status">Status</Label>
          <select
            id="project_status"
            value={form.project_status || "pending"}
            onChange={(e) => setForm({ ...form, project_status: e.target.value })}
            className="border border-input bg-background text-sm rounded-md px-2 py-1"
          >
            <option value="pending">Pending</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        {/* Entity Assignment */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="client_id">{USE_ACCOUNT_LABELS ? "Account" : "Client"} (Optional)</Label>
            <select
              id="client_id"
              value={form.client_id || ""}
              onChange={(e) => {
                const clientId = e.target.value ? parseInt(e.target.value) : undefined;
                setForm({ ...form, client_id: clientId, lead_id: undefined });
              }}
              className="border border-input bg-background text-sm rounded-md px-2 py-1"
            >
              <option value="">-- No {USE_ACCOUNT_LABELS ? "Account" : "Client"} --</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lead_id">Lead (Optional)</Label>
            <select
              id="lead_id"
              value={form.lead_id || ""}
              onChange={(e) => {
                const leadId = e.target.value ? parseInt(e.target.value) : undefined;
                setForm({ ...form, lead_id: leadId, client_id: undefined });
              }}
              className="border border-input bg-background text-sm rounded-md px-2 py-1"
            >
              <option value="">-- No Lead --</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Primary Contact */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Primary Contact</h3>
          <p className="text-sm text-gray-600 mb-4">
            For standalone projects, add contact information. This will be used for interactions and follow-ups.
          </p>

          <div className="grid gap-2">
            <Label htmlFor="primary_contact_name">Contact Name</Label>
            <Input
              id="primary_contact_name"
              value={form.primary_contact_name || ""}
              onChange={(e) => setForm({ ...form, primary_contact_name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="primary_contact_title">Contact Title</Label>
            <Input
              id="primary_contact_title"
              value={form.primary_contact_title || ""}
              onChange={(e) => setForm({ ...form, primary_contact_title: e.target.value })}
              placeholder="Project Manager"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="primary_contact_email">Contact Email</Label>
            <Input
              id="primary_contact_email"
              type="email"
              value={form.primary_contact_email || ""}
              onChange={(e) => setForm({ ...form, primary_contact_email: e.target.value })}
              placeholder="john.doe@company.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="primary_contact_phone">Contact Phone</Label>
            <div className="flex gap-2">
              <PhoneInput
                value={form.primary_contact_phone || ""}
                onChange={(cleanedPhone) => setForm({ ...form, primary_contact_phone: cleanedPhone })}
                placeholder="(123) 456-7890"
                className="flex-1"
              />
              <select
                value={form.primary_contact_phone_label || "work"}
                onChange={(e) => setForm({ ...form, primary_contact_phone_label: e.target.value as "work" | "mobile" | "home" })}
                className="border border-input bg-background text-sm rounded-md px-2 py-1 w-20"
              >
                <option value="work">Work</option>
                <option value="mobile">Mobile</option>
                <option value="home">Home</option>
              </select>
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="grid gap-2">
          <Label htmlFor="project_description">Description</Label>
          <Textarea
            id="project_description"
            value={form.project_description || ""}
            onChange={(e) => setForm({ ...form, project_description: e.target.value })}
            placeholder="Project description..."
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="project_worth">Project Worth ($)</Label>
          <Input
            id="project_worth"
            type="number"
            min="0"
            step="0.01"
            value={form.project_worth || ""}
            onChange={(e) => setForm({ ...form, project_worth: parseFloat(e.target.value) || 0 })}
          />
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="project_start">Start Date</Label>
            <Input
              id="project_start"
              type="date"
              value={form.project_start ? form.project_start.split("T")[0] : ""}
              onChange={(e) => setForm({ ...form, project_start: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project_end">End Date</Label>
            <Input
              id="project_end"
              type="date"
              value={form.project_end ? form.project_end.split("T")[0] : ""}
              onChange={(e) => setForm({ ...form, project_end: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={form.notes || ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Additional notes..."
          />
        </div>

        {!form.client_id && !form.lead_id && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">⚠️</span>
              <p className="text-sm text-yellow-800">
                <strong>Standalone Project:</strong> This project is not linked to a {USE_ACCOUNT_LABELS ? "account" : "client"} or lead.
                Make sure to add contact information above for proper interaction tracking.
              </p>
            </div>
          </div>
        )}
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
