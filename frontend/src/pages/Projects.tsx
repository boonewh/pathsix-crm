import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import EntityCard from "@/components/ui/EntityCard";
import { Project } from "@/types";
import ProjectForm from "@/components/ui/ProjectForm";
import { FormWrapper } from "@/components/ui/FormWrapper";
import { apiFetch } from "@/lib/api";

// TEMP: All Seasons Foam prefers "Accounts" instead of "Clients"
const USE_ACCOUNT_LABELS = true;

export default function Projects() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<Partial<Project>>({});
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [leads, setLeads] = useState<{ id: number; name: string }[]>([]);

  // Fetch all projects
  useEffect(() => {
    apiFetch("/projects/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setProjects);
  }, [token]);

  // Fetch clients and leads for dropdowns
  useEffect(() => {
    apiFetch("/clients/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) =>
        setClients(data.map((c: any) => ({ id: c.id, name: c.name })))
      );

    apiFetch("/leads/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) =>
        setLeads(data.map((l: any) => ({ id: l.id, name: l.name })))
      );
  }, [token]);

  const resetForm = () => {
    setForm({});
    setCreating(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    const method = creating ? "POST" : "PUT";
    const url = creating
      ? "/projects/"
      : `/projects/${editingId}`;

    const res = await apiFetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const updated = await apiFetch("/projects/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await updated.json();
      setProjects(data);
      resetForm();
    } else {
      alert("Failed to save project");
    }
  };

  const handleDelete = async (id: number) => {
    const res = await apiFetch(`/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert("Failed to delete project");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>

      <button
        onClick={() => {
          setCreating(true);
          setForm({});
        }}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + New Project
      </button>

      <ul className="space-y-4">
        {creating && (
          <EntityCard
            title="New Project"
            editing
            onSave={handleSave}
            onCancel={resetForm}
            editForm={
              <FormWrapper>
                <ProjectForm
                  form={form}
                  setForm={setForm}
                  clients={clients}
                  leads={leads}
                />
              </FormWrapper>
            }
          />
        )}

        {projects.map((project) => (
          <EntityCard
            key={project.id}
            title={project.project_name}
            editing={editingId === project.id}
            onEdit={() => {
              setEditingId(project.id);
              setForm(project);
            }}
            onCancel={resetForm}
            onSave={handleSave}
            onDelete={() => handleDelete(project.id)}
            editForm={
              <FormWrapper>
                <ProjectForm
                  form={form}
                  setForm={setForm}
                  clients={clients}
                  leads={leads}
                />
              </FormWrapper>
            }
            details={
              <ul className="text-sm text-gray-700 space-y-1">
                {project.project_description && <li>{project.project_description}</li>}
                {project.project_status && <li>Status: {project.project_status}</li>}
                {project.project_start && <li>Start: {new Date(project.project_start).toLocaleString()}</li>}
                {project.project_end && <li>End: {new Date(project.project_end).toLocaleString()}</li>}
                {project.project_worth && <li>Worth: ${project.project_worth}</li>}
                {project.client_id && (
                  <li>{USE_ACCOUNT_LABELS ? "Account ID" : "Client ID"}: {project.client_id}</li>
                )}
                {project.lead_id && <li>Lead ID: {project.lead_id}</li>}
              </ul>
            }
          />
        ))}
      </ul>
    </div>
  );
}
