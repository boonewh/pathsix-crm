import { Project } from "@/types";
import ProjectForm from "./ProjectForm";

interface ProjectEditModalProps {
  form: Partial<Project>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Project>>>;
  clients: { id: number; name: string }[];
  leads: { id: number; name: string }[];
  onSave: () => void;
  onCancel: () => void;
  onClose: () => void; // ✅ Add this line
}


export default function ProjectEditModal({
  form,
  setForm,
  clients,
  leads,
  onSave,
  onCancel,
}: ProjectEditModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-full overflow-y-auto p-6 relative">
        <h2 className="text-xl font-semibold mb-4">Edit Project</h2>
        <ProjectForm
          form={form}
          setForm={setForm}
          clients={clients}
          leads={leads}
          onSave={onSave}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}
