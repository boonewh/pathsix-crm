import { useEffect, useState } from "react";
import EntityCard from "@/components/ui/EntityCard";

type Project = {
  id: number;
  title: string;
  status: string;
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentlyEditingId, setCurrentlyEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Project>>({ title: "" });

  useEffect(() => {
    const fetchProjects = async () => {
      const res = await fetch("/api/projects/", {
        headers: {
          Authorization: "Bearer your-token-here",
        },
      });
      const data = await res.json();
      setProjects(data);
    };

    fetchProjects();
  }, []);

  const handleEdit = (project: Project) => {
    setCurrentlyEditingId(project.id);
    setForm({ title: project.title });
  };

  const handleCancel = () => {
    setCurrentlyEditingId(null);
    setForm({ title: "" });
  };

  const handleSave = () => {
    console.log("Saving project:", currentlyEditingId, form);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === currentlyEditingId ? { ...p, ...form } : p
      )
    );
    handleCancel();
  };

  return (
    <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <EntityCard
          key={project.id}
          title={project.title}
          details={
            <p className="text-sm text-gray-500">Status: {project.status}</p>
          }
          editing={currentlyEditingId === project.id}
          editForm={
            <input
              type="text"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          }
          onEdit={() => handleEdit(project)}
          onDelete={() => console.log("delete", project.id)}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ))}
    </div>
  );
}
