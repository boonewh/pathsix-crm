import { useEffect, useState } from "react";
import EntityCard from "@/components/ui/EntityCard";

type Project = {
  id: number;
  project_name: string;
  project_status: string;
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    project_name: "",
    project_status: "pending",
    project_description: "",
    project_worth: "",
    project_start: "",
    project_end: "",
    lead_id: "",
    client_id: "",
  });

  const fetchProjects = async () => {
    const res = await fetch("/api/projects/", {
      headers: {
        Authorization: "Bearer your-token-here",
      },
    });
    const data = await res.json();
    setProjects(data);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateProject = async () => {
    const res = await fetch("/api/projects/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer your-token-here",
      },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const newProject = await res.json();
      setProjects((prev) => [...prev, newProject]);
      setFormData({
        project_name: "",
        project_status: "pending",
        project_description: "",
        project_worth: "",
        project_start: "",
        project_end: "",
        lead_id: "",
        client_id: "",
      });
    } else {
      console.error("Failed to create project");
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="project_name"
            placeholder="Project Name"
            value={formData.project_name}
            onChange={handleFormChange}
            className="border p-2 rounded"
          />
          <select
            name="project_status"
            value={formData.project_status}
            onChange={handleFormChange}
            className="border p-2 rounded"
          >
            <option value="pending">Pending</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
          <input
            name="project_worth"
            type="number"
            placeholder="Project Worth"
            value={formData.project_worth}
            onChange={handleFormChange}
            className="border p-2 rounded"
          />
          <input
            name="project_start"
            type="date"
            value={formData.project_start}
            onChange={handleFormChange}
            className="border p-2 rounded"
          />
          <input
            name="project_end"
            type="date"
            value={formData.project_end}
            onChange={handleFormChange}
            className="border p-2 rounded"
          />
          <input
            name="lead_id"
            type="number"
            placeholder="Lead ID (optional)"
            value={formData.lead_id}
            onChange={handleFormChange}
            className="border p-2 rounded"
          />
          <input
            name="client_id"
            type="number"
            placeholder="Client ID (optional)"
            value={formData.client_id}
            onChange={handleFormChange}
            className="border p-2 rounded"
          />
          <textarea
            name="project_description"
            placeholder="Description"
            value={formData.project_description}
            onChange={handleFormChange}
            className="border p-2 rounded md:col-span-2"
          />
        </div>
        <button
          onClick={handleCreateProject}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Project
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <EntityCard
            key={project.id}
            title={project.project_name}
            details={
              <p className="text-sm text-gray-500">
                Status: {project.project_status}
              </p>
            }
            onEdit={() => console.log("Edit", project.id)}
            onDelete={() => console.log("Delete", project.id)}
          />
        ))}
      </div>
    </div>
  );
}
