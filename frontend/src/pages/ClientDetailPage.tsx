import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  User,
} from "lucide-react";
import { useAuth } from "@/authContext";
import { Client, Interaction, Account } from "@/types";
import { apiFetch } from "@/lib/api";
import CompanyNotes from "@/components/ui/CompanyNotes";
import CompanyInteractions from "@/components/ui/CompanyInteractions";

export default function ClientDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [_accounts, setAccounts] = useState<Account[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch(`/clients/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setClient(data);
        setAccounts(data.accounts || []);
      });

    apiFetch(`/interactions/?client_id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setInteractions);
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

  if (!client) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{client.name}</h1>

      <ul className="text-sm text-gray-700 space-y-1">
        {client.contact_person && (
          <li className="flex items-center gap-2">
            <User size={14} /> {client.contact_person}
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
          <li className="flex items-center gap-2">
            <Phone size={14} />
            <a href={`tel:${client.phone}`} className="text-blue-600 underline">
              {client.phone}
            </a>
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
    </div>
  );
}
