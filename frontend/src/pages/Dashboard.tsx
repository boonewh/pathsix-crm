import { useEffect, useState } from "react";
import { useAuth } from "@/authContext";
import { Interaction } from "@/types";
import { addDays, isBefore, isToday, isWithinInterval, parseISO } from "date-fns";

export default function Dashboard() {
  const { token } = useAuth();
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  useEffect(() => {
    fetch("/api/interactions/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setInteractions);
  }, [token]);

  const now = new Date();

  const followUpsToday = interactions.filter(
    (i) => i.follow_up && isToday(parseISO(i.follow_up))
  );

  const upcomingFollowUps = interactions.filter(
    (i) =>
      i.follow_up &&
      isWithinInterval(parseISO(i.follow_up), {
        start: now,
        end: addDays(now, 7),
      })
  );

  const overdueFollowUps = interactions.filter(
    (i) => i.follow_up && isBefore(parseISO(i.follow_up), now)
  );

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {followUpsToday.length > 0 && (
        <section className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <h2 className="font-semibold text-blue-800 mb-2">📅 Follow-ups Today</h2>
          <ul className="space-y-1 text-sm">
            {followUpsToday.map((i) => (
              <li key={i.id} className="text-gray-700">
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
              <li key={i.id} className="text-gray-700">
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
              <li key={i.id} className="text-gray-700">
                <strong>{i.summary}</strong> – was due {new Date(i.follow_up!).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="bg-gray-200 text-center py-4 text-sm text-gray-600 rounded shadow-inner">
        Tailwind is still working fine here too 👍
      </div>
    </div>
  );
}
