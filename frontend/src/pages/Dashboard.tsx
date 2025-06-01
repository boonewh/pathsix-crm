import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import { Interaction } from "@/types";
import { addDays, isBefore, isToday, isWithinInterval, parseISO, formatDistanceToNow } from "date-fns";
import InteractionModal from "@/components/ui/InteractionModal";
import { apiFetch } from "@/lib/api";

export default function Dashboard() {
  const { token } = useAuth();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);

  interface ActivityEntry {
    entity_type: string;
    entity_id: number;
    name: string;
    last_touched: string;
    profile_link: string;
  }

  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    apiFetch("/interactions/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setInteractions);
  }, [token]);

  useEffect(() => {
    apiFetch("/activity/recent", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setRecentActivity);
  }, [token]);


  const now = new Date();

  const parsedFollowUps = interactions
    .filter((i) => i.follow_up && i.followup_status !== "completed")
    .map((i) => ({
      ...i,
      parsedFollowUp: parseISO(i.follow_up!),
    }));

  const followUpsToday = parsedFollowUps
    .filter((i) => isToday(i.parsedFollowUp))
    .sort((a, b) => a.parsedFollowUp.getTime() - b.parsedFollowUp.getTime());

  const overdueFollowUps = parsedFollowUps
    .filter(
      (i) => isBefore(i.parsedFollowUp, now) && !isToday(i.parsedFollowUp)
    )
    .sort((a, b) => a.parsedFollowUp.getTime() - b.parsedFollowUp.getTime());

  const upcomingFollowUps = parsedFollowUps
    .filter(
      (i) =>
        isWithinInterval(i.parsedFollowUp, {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          end: addDays(now, 7),
        })
    )
    .sort((a, b) => a.parsedFollowUp.getTime() - b.parsedFollowUp.getTime());

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {followUpsToday.length > 0 && (
        <section className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <h2 className="font-semibold text-yellow-800 mb-2">📅 Follow-ups for Today</h2>
          <ul className="space-y-1 text-sm">
            {followUpsToday.map((i) => (
              <li
                key={i.id}
                className="text-gray-700 hover:bg-gray-100 px-2 py-1 rounded cursor-pointer"
                onClick={() => setSelectedInteraction(i)}
              >
                <span className="font-medium text-gray-800 mr-1">
                  {i.client_name || i.lead_name}
                </span>
                <strong>{i.summary}</strong> – {new Date(i.follow_up!).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        </section>
      )}

      {upcomingFollowUps.length > 0 && (
        <section className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <h2 className="font-semibold text-green-800 mb-2">🗓️ Upcoming in Next 7 Days</h2>
          <ul className="space-y-1 text-sm">
            {upcomingFollowUps.map((i) => (
              <li
                key={i.id}
                className="text-gray-700 hover:bg-gray-100 px-2 py-1 rounded cursor-pointer"
                onClick={() => setSelectedInteraction(i)}
              >
                <span className="font-medium text-gray-800 mr-1">
                  {i.client_name || i.lead_name}
                </span>
                <strong>{i.summary}</strong> – {new Date(i.follow_up!).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </section>
      )}

      {overdueFollowUps.length > 0 && (
        <section className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <h2 className="font-semibold text-red-800 mb-2">⚠️ Overdue Follow-ups</h2>
          <ul className="space-y-1 text-sm">
            {overdueFollowUps.map((i) => (
              <li
                key={i.id}
                className="text-gray-700 hover:bg-gray-100 px-2 py-1 rounded cursor-pointer"
                onClick={() => setSelectedInteraction(i)}
              >
                <span className="font-medium text-gray-800 mr-1">
                  {i.client_name || i.lead_name}
                </span>
                <strong>{i.summary}</strong> – {new Date(i.follow_up!).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </section>
      )}

      {recentActivity.length > 0 && (
        <section className="bg-white border border-gray-300 p-4 rounded shadow-sm">
          <h2 className="text-lg font-semibold mb-2 text-blue-700">🕓 Recently Touched</h2>
          <ul className="space-y-2 text-sm text-gray-800">
            {recentActivity.map((entry) => (
              <li key={`${entry.entity_type}-${entry.entity_id}`}>
                <a
                  href={entry.profile_link}
                  className="text-blue-600 hover:underline"
                >
                  {entry.name}
                </a>{" "}
                <span className="text-gray-500">
                  {formatDistanceToNow(parseISO(entry.last_touched), { addSuffix: true })}

                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {selectedInteraction && (
        <InteractionModal
          title={`Follow-up: ${selectedInteraction.client_name || selectedInteraction.lead_name}`}
          date={new Date(selectedInteraction.contact_date).toLocaleString()}
          outcome={selectedInteraction.outcome}
          summary={selectedInteraction.summary}
          notes={selectedInteraction.notes}
          contact_person={selectedInteraction.contact_person}
          email={selectedInteraction.email}
          phone={selectedInteraction.phone}
          profile_link={selectedInteraction.profile_link}
          onClose={() => setSelectedInteraction(null)}
          onMarkComplete={async () => {
            const res = await apiFetch(`/interactions/${selectedInteraction.id}/complete`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              setInteractions(prev => prev.filter(i => i.id !== selectedInteraction.id));
              setSelectedInteraction(null);
            } else {
              alert("Failed to mark interaction as completed.");
            }
          }}
        />
      )}
    </div>
  );
}
