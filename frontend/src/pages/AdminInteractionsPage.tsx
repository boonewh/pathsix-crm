import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import { apiFetch } from "@/lib/api";
import { Link } from "react-router-dom";

interface AdminInteraction {
  id: number;
  contact_date: string;
  summary: string;
  outcome?: string;
  follow_up?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  client_name?: string;
  lead_name?: string;
  followup_status?: string;
  profile_link?: string;
  assigned_to_name?: string;
}

function InteractionTable({ title, interactions }: { title: string; interactions: AdminInteraction[] }) {
  if (interactions.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold text-blue-700">{title}</h2>
      <div className="overflow-auto border rounded shadow-sm">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Assigned To</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Contact</th>
              <th className="px-4 py-2 text-left">Summary</th>
              <th className="px-4 py-2 text-left">Next Step</th>
              <th className="px-4 py-2 text-left">Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {interactions.map((i) => (
              <tr key={i.id} className="border-t hover:bg-gray-50 transition">
                <td className="px-4 py-2">{i.assigned_to_name || "—"}</td>
                <td className="px-4 py-2">{new Date(i.contact_date).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <Link to={i.profile_link || "#"} className="text-blue-600 hover:underline">
                    {i.client_name || i.lead_name || "—"}
                  </Link>
                </td>
                <td className="px-4 py-2">{i.contact_person?.trim() || "—"}</td>
                <td className="px-4 py-2">{i.summary}</td>
                <td className="px-4 py-2">{i.outcome || "—"}</td>
                <td className="px-4 py-2">
                  {i.follow_up ? new Date(i.follow_up).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminInteractionsPage() {
  const { token } = useAuth();
  const [interactions, setInteractions] = useState<AdminInteraction[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        const res = await apiFetch("/interactions/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setInteractions(data);
      } catch (err) {
        setError("Failed to load interactions");
      }
    };

    fetchInteractions();
  }, [token]);

  const today = new Date().toISOString().slice(0, 10);

  const overdue: AdminInteraction[] = [];
  const todayDue: AdminInteraction[] = [];
  const upcoming: AdminInteraction[] = [];
  const completed: AdminInteraction[] = [];

  interactions.forEach((i) => {
    const isCompleted = i.followup_status === "completed";
    const followUp = i.follow_up ? i.follow_up.slice(0, 10) : null;

    if (isCompleted) {
      completed.push(i);
    } else if (followUp && followUp < today) {
      overdue.push(i);
    } else if (followUp === today) {
      todayDue.push(i);
    } else {
      upcoming.push(i);
    }
  });

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold text-blue-800">Admin: All Interactions</h1>
      {error && <p className="text-red-500">{error}</p>}
      <InteractionTable title="Overdue" interactions={overdue} />
      <InteractionTable title="Today" interactions={todayDue} />
      <InteractionTable title="Upcoming" interactions={upcoming} />
      <InteractionTable title="Completed" interactions={completed} />
    </div>
  );
}
