import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Project } from "@/types";

interface SelectableEntity {
  id: number;
  name: string;
}

interface ProjectFormProps {
  form: Partial<Project>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Project>>>;
  clients: SelectableEntity[];
  leads: SelectableEntity[];
}

export default function ProjectForm({
  form,
  setForm,
  clients,
  leads,
}: ProjectFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="project_name">Project Name</Label>
        <Input
          id="project_name"
          value={form.project_name || ""}
          onChange={(e) => setForm({ ...form, project_name: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="project_description">Description</Label>
        <Textarea
          id="project_description"
          value={form.project_description || ""}
          onChange={(e) =>
            setForm({ ...form, project_description: e.target.value })
          }
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="project_status">Status</Label>
        <Input
          id="project_status"
          value={form.project_status || ""}
          onChange={(e) => setForm({ ...form, project_status: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="project_start">Start Date</Label>
          <Input
            id="project_start"
            type="datetime-local"
            value={form.project_start || ""}
            onChange={(e) =>
              setForm({ ...form, project_start: e.target.value })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="project_end">End Date</Label>
          <Input
            id="project_end"
            type="datetime-local"
            value={form.project_end || ""}
            onChange={(e) =>
              setForm({ ...form, project_end: e.target.value })
            }
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="project_worth">Worth ($)</Label>
        <Input
          id="project_worth"
          type="number"
          value={form.project_worth || ""}
          onChange={(e) =>
            setForm({
              ...form,
              project_worth: parseFloat(e.target.value) || 0,
            })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor="lead_id">Lead</Label>
          <select
            id="lead_id"
            value={form.lead_id || ""}
            onChange={(e) =>
              setForm({
                ...form,
                lead_id: parseInt(e.target.value) || undefined,
              })
            }
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">-- Select Lead --</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

