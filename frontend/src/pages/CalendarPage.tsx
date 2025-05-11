import { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer, Event } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { useAuth } from "@/authContext";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

interface Interaction {
  id: number;
  contact_date: string;
  outcome: string;
  follow_up?: string;
  client_id?: number;
  lead_id?: number;
  client_name?: string;
  lead_name?: string;
}

interface CalendarEvent extends Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

export default function CalendarPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/interactions/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: Interaction[] = await res.json();

      const eventList: CalendarEvent[] = data
        .filter((i) => i.follow_up)
        .map((i) => ({
          id: i.id,
          title: `Follow-up: ${i.client_name || i.lead_name || "Unknown"}`,
          start: new Date(i.follow_up!),
          end: new Date(i.follow_up!),
          allDay: true,
        }));

      setEvents(eventList);
    };

    fetchData();
  }, [token]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Follow-Up Calendar</h1>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "80vh" }}
        eventPropGetter={() => ({
          style: {
            backgroundColor: "white",
            border: "1px solid #3b82f6", // Tailwind blue-500
            color: "#3b82f6",
            fontWeight: "bold",
            padding: "4px",
            cursor: "pointer",
          },
        })}
        onSelectEvent={(event) => {
          alert(`Open detail for: ${event.title} (id: ${event.id})`);
        }}
      />
    </div>
  );
}
