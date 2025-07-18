import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  User,
  CalendarDays,
  DollarSign,
  Wrench,
  Building,
} from "lucide-react";
import { useAuth, userHasRole } from "@/authContext";
import { Project, Interaction } from "@/types";
import { apiFetch } from "@/lib/api";
import CompanyNotes from "@/components/ui/CompanyNotes";
import CompanyInteractions from "@/components/ui/CompanyInteractions";
import { toast } from "react-hot-toast";

// TEMP: All Seasons Foam prefers "Accounts" instead of "Clients"
const USE_ACCOUNT_LABELS = true;

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [showNoteMenu, setShowNoteMenu] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<{ id: number; email: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(project?.primary_contact_title || "");

  const [loadError, setLoadError] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  
  useEffect(() => {
    if (!id) return;

    // Fetch project details
    apiFetch(`/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load project");
        return res.json();
      })
      .then((data) => {
        setProject(data);
        setNewTitle(data.primary_contact_title || "");
        setNoteDraft(data.notes || "");
        
        // 🆕 Log activity for "Recently Touched" - this happens automatically
        // when the backend project endpoint is called, similar to clients/leads
      })
      .catch((err) => {
        console.error("Error loading project:", err);
        setLoadError(err.message || "Failed to load project");
      });

    // Fetch interactions
    apiFetch(`/interactions/?project_id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load interactions");
        return res.json();
      })
      .then((data) => setInteractions(data.interactions || []))
      .catch((err) => {
        console.error("Error loading interactions:", err);
      });

    // Fetch assignable users if admin (future feature)
    if (userHasRole(user, "admin")) {
      apiFetch("/users/", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load users");
          return res.json();
        })
        .then((data) => {
          setAvailableUsers(data.filter((u: any) => u.is_active));
        })
        .catch((err) => {
          console.error("Error loading users:", err);
        });
    }
  }, [id, token, user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowNoteMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveNote = async () => {
    const res = await apiFetch(`/projects/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: noteDraft }),
    });
    if (res.ok) {
      setProject((prev) => prev && { ...prev, notes: noteDraft });
      setIsEditingNote(false);
    } else {
      toast.error("Failed to save notes");
    }
  };

  const deleteNote = async () => {
    const res = await apiFetch(`/projects/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: "" }),
    });
    if (res.ok) {
      setProject((prev) => prev && { ...prev, notes: "" });
      setNoteDraft("");
      setIsEditingNote(false);
    } else {
      toast.error("Failed to delete notes");
    }
  };

  const handleConvertToClient = async () => {
    if (!project) return;

    const confirmed = confirm(
      `Convert "${project.project_name}" to a ${USE_ACCOUNT_LABELS ? "Account" : "Client"}? This will create a new account and link this project to it.`
    );

    if (!confirmed) return;

    const clientData = {
      name: project.primary_contact_name ? 
        `${project.project_name} (${project.primary_contact_name})` : 
        project.project_name,
      email: project.primary_contact_email,
      phone: project.primary_contact_phone,
      phone_label: project.primary_contact_phone_label || "work",
      contact_person: project.primary_contact_name,
      contact_title: project.primary_contact_title,
      notes: `Converted from project: ${project.project_name}${project.notes ? '\n\nProject Notes:\n' + project.notes : ''}`,
      type: project.type || "None",
    };

    const res = await apiFetch("/clients/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(clientData),
    });

    if (res.ok) {
      const newClient = await res.json();

      // Update project to link to new client
      await apiFetch(`/projects/${project.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          client_id: newClient.id,
          // Clear standalone contact fields since they're now in the client
          primary_contact_name: null,
          primary_contact_title: null,
          primary_contact_email: null,
          primary_contact_phone: null,
          primary_contact_phone_label: null,
        }),
      });

      // Transfer interactions to the new client
      await apiFetch("/interactions/transfer", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          from_project_id: project.id,
          to_client_id: newClient.id,
        }),
      });

      window.location.href = `/clients/${newClient.id}`;
    } else {
      toast.error("Failed to convert project to account.");
    }
  };

  if (loadError) return <p className="p-6 text-red-600">{loadError}</p>;
  if (!id) return <p className="p-6 text-red-600">Invalid project ID.</p>;
  if (!project) return <p className="p-6">Loading...</p>;

  const handleAssignProject = async () => {
    if (!project || !selectedUserId) return;
    setIsAssigning(true);
    const res = await apiFetch(`/projects/${project.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ assigned_to: selectedUserId }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProject((prev) => prev && { ...prev, assigned_to: updated.assigned_to });
      setShowAssignModal(false);
      setSelectedUserId(null);
      toast.success("Project assigned");
    } else {
      toast.error("Failed to assign project");
    }
    setIsAssigning(false);
  };


  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{project.project_name}</h1>
      
      {/* Project Type */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
        <Wrench size={14} className="text-gray-500" />
        <span className="text-gray-500 font-medium">Type:</span>{" "}
        {project.type || "None"}
      </div>

      {/* Project Status and Value */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Building size={14} className="text-gray-500" />
          <span className="text-gray-500 font-medium">Status:</span>{" "}
          <span className={`px-2 py-1 text-xs rounded ${
            project.project_status === 'won' ? 'bg-green-100 text-green-800' :
            project.project_status === 'lost' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {project.project_status || 'pending'}
          </span>
        </div>
        
        {project.project_worth && (
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-gray-500" />
            <span className="text-gray-500 font-medium">Value:</span>{" "}
            ${project.project_worth.toLocaleString()}
          </div>
        )}
      </div>

      {/* Project Description */}
      {project.project_description && (
        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
          <strong>Description:</strong> {project.project_description}
        </div>
      )}

      {/* Project Timeline */}
      <ul className="text-sm text-gray-700 space-y-1">
        {(project.project_start || project.project_end) && (
          <li className="flex items-start gap-2">
            <CalendarDays size={14} className="mt-[2px]" />
            <div className="leading-tight">
              {project.project_start && (
                <div>Start: {new Date(project.project_start).toLocaleDateString()}</div>
              )}
              {project.project_end && (
                <div>End: {new Date(project.project_end).toLocaleDateString()}</div>
              )}
            </div>
          </li>
        )}
      </ul>

      {/* Contact Information - Only for standalone projects */}
      {!project.client_id && !project.lead_id && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Primary Contact</h2>
          <ul className="text-sm text-gray-700 space-y-1">
            {project.primary_contact_name && (
              <li className="flex items-start gap-2">
                <User size={14} className="mt-[2px]" />
                <div className="leading-tight">
                  <div>{project.primary_contact_name}</div>
                  {editingTitle ? (
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="text"
                        className="border px-2 py-1 rounded text-sm"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                      <button
                        className="text-blue-600 text-sm"
                        onClick={async () => {
                          const res = await apiFetch(`/projects/${id}`, {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ primary_contact_title: newTitle }),
                          });
                          if (res.ok) {
                            setProject((prev) => prev && { ...prev, primary_contact_title: newTitle });
                            setEditingTitle(false);
                          } else {
                            toast.error("Failed to update title.");
                          }
                        }}
                      >
                        Save
                      </button>
                      <button
                        className="text-gray-500 text-sm"
                        onClick={() => {
                          setNewTitle(project.primary_contact_title || "");
                          setEditingTitle(false);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    project.primary_contact_title && (
                      <div
                        className="text-gray-500 text-sm italic hover:underline cursor-pointer"
                        onClick={() => setEditingTitle(true)}
                      >
                        {project.primary_contact_title}
                      </div>
                    )
                  )}
                </div>
              </li>
            )}

            {project.primary_contact_email && (
              <li className="flex items-center gap-2">
                <Mail size={14} />
                <a href={`mailto:${project.primary_contact_email}`} className="text-blue-600 underline">
                  {project.primary_contact_email}
                </a>
              </li>
            )}

            {project.primary_contact_phone && (
              <li className="flex items-start gap-2">
                <Phone size={14} className="mt-[2px]" />
                <div className="leading-tight">
                  <div>
                    <a href={`tel:${project.primary_contact_phone}`} className="text-blue-600 underline">
                      {project.primary_contact_phone}
                    </a>
                    {project.primary_contact_phone_label && (
                      <span className="text-muted-foreground text-sm ml-1">
                        ({project.primary_contact_phone_label})
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )}
          </ul>
        </>
      )}

      {/* Linked Entity Information */}
      {(project.client_id || project.lead_id) && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Linked Entity</h2>
          <div className="text-sm text-gray-700">
            {project.client_id && project.client_name && (
              <p>
                <strong>{USE_ACCOUNT_LABELS ? "Account" : "Client"}:</strong>{" "}
                <a href={`/clients/${project.client_id}`} className="text-blue-600 hover:underline">
                  {project.client_name}
                </a>
              </p>
            )}
            {project.lead_id && project.lead_name && (
              <p>
                <strong>Lead:</strong>{" "}
                <a href={`/leads/${project.lead_id}`} className="text-blue-600 hover:underline">
                  {project.lead_name}
                </a>
              </p>
            )}
          </div>
        </>
      )}

      {project.assigned_to?.email && (
        <div className="text-sm text-gray-600">
          <strong>Assigned to:</strong> {project.assigned_to.email}
        </div>
      )}

      <CompanyInteractions
        token={token!}
        entityType="project"
        entityId={project.id}
        initialInteractions={interactions}
      />

      <CompanyNotes
        notes={noteDraft}
        onSave={saveNote}
        isEditing={isEditingNote}
        setIsEditing={setIsEditingNote}
        onDelete={deleteNote}
        menuRef={menuRef}
        showMenu={showNoteMenu}
        setShowMenu={setShowNoteMenu}
        setNoteDraft={setNoteDraft}
      />

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold mb-4">Assign Project</h2>

            <select
              value={selectedUserId ?? ""}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
            >
              <option value="">Select a user</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                disabled={!selectedUserId || isAssigning}
                onClick={handleAssignProject}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t">
        {!project.client_id && !project.lead_id && (
          <button
            onClick={handleConvertToClient}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {`Convert to ${USE_ACCOUNT_LABELS ? "Account" : "Client"}`}
          </button>
        )}

        {userHasRole(user, "admin") && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Assign Project
          </button>
        )}
      </div>
    </div>
  );
}