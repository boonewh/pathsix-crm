import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  User,
  FolderKanban,
  Wrench,
} from "lucide-react";
import { useAuth, userHasRole } from "@/authContext";
import { Client, Interaction, Account } from "@/types";
import { apiFetch } from "@/lib/api";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import CompanyNotes from "@/components/ui/CompanyNotes";
import CompanyInteractions from "@/components/ui/CompanyInteractions";
import CompanyContacts from "@/components/ui/CompanyContacts";

export default function ClientDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [_accounts, setAccounts] = useState<Account[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState("");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<{ id: number; email: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(client?.contact_title || "");

  const [projects, setProjects] = useState<any[]>([]);

  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const loadClient = async () => {
      try {
        const res = await apiFetch(`/clients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Client not found");
        const data = await res.json();
        setClient(data);
        setNewTitle(data.contact_title || "");
        setAccounts(data.accounts || []);
      } catch (err: any) {
        setLoadError(err.message || "Failed to load account");
      }
    };

    const loadInteractions = async () => {
      try {
        const res = await apiFetch(`/interactions/?client_id=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setInteractions(data);
      } catch {
        // Optional: handle interaction error here too
      }
    };

    loadClient();
    loadInteractions();

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
  }, [id, token]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Future menu behavior
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    apiFetch(`/projects/by-client/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setProjects)
      .catch(() => setProjects([]));
  }, [id, token]);

  if (loadError) return <p className="p-6 text-red-600">{loadError}</p>;
  if (!client) return <p className="p-6">Loading...</p>;

  return (
    <>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">{client.name}</h1>

        <ul className="text-sm text-gray-700 space-y-1">
    {client.type && (
      <li className="flex items-center gap-2">
        <Wrench size={14} className="text-gray-500" />
        <span className="text-gray-500 font-medium">Type:</span> {client.type}
      </li>
    )}
    {client.contact_person && (
      <li className="flex items-start gap-2">
        <User size={14} className="mt-[2px]" />
        <div className="leading-tight">
          <div>{client.contact_person}</div>
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
                  const res = await apiFetch(`/clients/${id}`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ contact_title: newTitle }),
                  });
                  if (res.ok) {
                    setClient((prev) => prev && { ...prev, contact_title: newTitle });
                    setEditingTitle(false);
                  } else {
                    alert("Failed to update title.");
                  }
                }}
              >
                Save
              </button>
              <button
                className="text-gray-500 text-sm"
                onClick={() => {
                  setNewTitle(client.contact_title || "");
                  setEditingTitle(false);
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            client.contact_title && (
              <div
                className="text-gray-500 text-sm italic hover:underline cursor-pointer"
                onClick={() => setEditingTitle(true)}
              >
                {client.contact_title}
              </div>
            )
          )}
        </div>
      </li>
    )}

          {client.email && (
            <li className="flex items-center gap-2">
              <Mail size={14} />
              <a href={`mailto:${client.email}`} className="text-blue-600 underline">
                {client.email}
              </a>
            </li>
          )}

          {client.phone && (
            <li className="flex items-start gap-2">
              <Phone size={14} className="mt-[2px]" />
              <div className="leading-tight">
                <div>
                  <a href={`tel:${client.phone}`} className="text-blue-600 underline">
                    {formatPhoneNumber(client.phone)}
                  </a>
                  {client.phone_label && (
                    <span className="text-muted-foreground text-sm ml-1">
                      ({client.phone_label})
                    </span>
                  )}
                </div>
                {client.secondary_phone && (
                  <div>
                    
                    <a href={`tel:${client.secondary_phone}`}
                    className="text-blue-600 underline"
                    >
                      {formatPhoneNumber(client.secondary_phone)}
                    </a>
                    {client.secondary_phone_label && (
                      <span className="text-muted-foreground text-sm ml-1">
                        ({client.secondary_phone_label})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </li>
          )}

          <li className="flex items-start gap-2">
            <MapPin size={14} className="mt-[2px]" />
            <div className="leading-tight">
              {client.address && <div>{client.address}</div>}
              <div>{[client.city, client.state].filter(Boolean).join(", ")} {client.zip}</div>
            </div>
          </li>
        </ul>

        <CompanyInteractions
          token={token!}
          entityType="client"
          entityId={client.id}
          initialInteractions={interactions}
        />

        <CompanyNotes
          notes={client.notes || ""}
          onSave={async (newNotes) => {
            const res = await apiFetch(`/clients/${id}`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
              body: JSON.stringify({ notes: newNotes }),
            });
            if (res.ok) {
              setClient((prev) => prev && { ...prev, notes: newNotes });
            } else {
              alert("Failed to save notes.");
            }
          }}
        />

        <CompanyContacts
          token={token!}
          entityType="client"
          entityId={client.id}
        />

        {/* Projects Section */}
        <details className="bg-white rounded shadow-sm border">
          <summary className="cursor-pointer px-4 py-2 font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-t flex items-center gap-2">
            <FolderKanban size={16} /> Projects ({projects.length})
          </summary>

          <div className="p-4 space-y-4">
            {projects.length === 0 ? (
              <p className="text-sm text-gray-500">
                No projects found for this account. Create new projects on the{" "}
                <Link to="/projects" className="text-blue-600 hover:underline">
                  Projects page
                </Link>.
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-gray-800">
                {projects.map((p) => (
                  <li key={p.id} className="border-b pb-2">
                    <div className="font-medium text-blue-700">{p.project_name}</div>
                    <div className="text-gray-600 italic">{p.project_status}</div>

                    {p.project_description && (
                      <div className="text-gray-700">{p.project_description}</div>
                    )}

                    <div className="text-gray-500 text-xs">
                      Created: {new Date(p.created_at).toLocaleDateString()}
                    </div>

                    {p.project_start && (
                      <div className="text-gray-500 text-xs">
                        Start: {new Date(p.project_start).toLocaleDateString()}
                      </div>
                    )}

                    {p.project_end && (
                      <div className="text-gray-500 text-xs">
                        End: {new Date(p.project_end).toLocaleDateString()}
                      </div>
                    )}

                    {p.project_worth !== undefined && p.project_worth !== null && (
                      <div className="text-gray-500 text-xs">
                        Worth: ${p.project_worth.toLocaleString()}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>

        {userHasRole(user, "admin") && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Assign Account
          </button>
        )}
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Assign Account</h2>

            <select
              value={selectedUserId || ""}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 mb-4"
            >
              <option value="">Select a user</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                disabled={!selectedUserId || isAssigning}
                onClick={async () => {
                  setIsAssigning(true);
                  const res = await apiFetch(`/clients/${id}/assign`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ assigned_to: selectedUserId }),
                  });

                  if (res.ok) {
                    setShowAssignModal(false);
                    window.location.reload();
                  } else {
                    alert("Failed to assign account.");
                  }
                  setIsAssigning(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isAssigning ? "Assigning…" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
