import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useAuth } from "@/authContext";

interface Interaction {
  id: number;
  contact_date: string;
  outcome: string;
  notes: string;
  follow_up?: string;
  client_id?: number;
  lead_id?: number;
  client_name?: string;
  lead_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  profile_link?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  extendedProps: {
    outcome: string;
    notes: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    profile_link?: string;
  };
}

export default function CalendarPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filterType, setFilterType] = useState<"all" | "client" | "lead">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetch("/api/interactions/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: Interaction[] = await res.json();
      console.log("Calendar raw data:", data);

      const filtered = data.filter((i) => {
        if (!i.follow_up) return false;
        if (filterType === "client") return !!i.client_id;
        if (filterType === "lead") return !!i.lead_id;
        return true;
      });

      const eventList: CalendarEvent[] = filtered.map((i) => ({
        id: i.id.toString(),
        title: `Follow-up: ${i.client_name || i.lead_name || "Unknown"}`,
        start: i.follow_up!,
        extendedProps: {
          outcome: i.outcome,
          notes: i.notes || "No notes",
          contact_person: i.contact_person,
          email: i.email,
          phone: i.phone,
          profile_link: i.profile_link,
        },
      }));

      setEvents(eventList);
      setLoading(false);
    };

    fetchData();
  }, [token, filterType]);

  function handleEventClick(arg: any) {
    const { event } = arg;

    const customEvent: CalendarEvent = {
      id: event.id,
      title: event.title,
      start: event.start!,
      extendedProps: {
        outcome: event.extendedProps["outcome"],
        notes: event.extendedProps["notes"],
        contact_person: event.extendedProps["contact_person"],
        email: event.extendedProps["email"],
        phone: event.extendedProps["phone"],
        profile_link: event.extendedProps["profile_link"],
      },
    };

    setSelectedEvent(customEvent);
  }

  async function handleEventDrop(arg: any) {
    const id = arg.event.id;
    const newDate = arg.event.start;

    try {
      const res = await fetch(`/api/interactions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          follow_up: newDate.toISOString(),
        }),
      });

      if (!res.ok) {
        alert("Failed to update follow-up.");
        arg.revert();
      }
    } catch (err) {
      console.error(err);
      alert("Error updating follow-up.");
      arg.revert();
    }
  }

  function generateGoogleCalendarUrl(event: CalendarEvent): string {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(
      `Outcome: ${event.extendedProps.outcome}\nNotes: ${event.extendedProps.notes}`
    );
    const start = new Date(event.start).toISOString().replace(/[-:]|\.\d{3}/g, "");
    const end = start;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  }

  function renderEventContent(arg: any) {
    const isOverdue = new Date(arg.event.start) < new Date();
    const style = isOverdue
      ? "text-red-600 font-semibold"
      : "text-blue-600 font-semibold";

    return <div className={style}>{arg.event.title}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Follow-Up Calendar</h1>

      <div className="mb-4">
        <label className="mr-2 font-semibold">Filter by:</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as "all" | "client" | "lead")}
          className="border rounded px-2 py-1"
        >
          <option value="all">All</option>
          <option value="client">Clients Only</option>
          <option value="lead">Leads Only</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading follow-ups...</p>
      ) : (
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          editable={true}
          eventDrop={handleEventDrop}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          height="80vh"
        />
      )}

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h2 className="text-lg font-bold mb-2">{selectedEvent.title}</h2>
            <p className="text-sm text-gray-600 mb-1">
              Date: {new Date(selectedEvent.start).toLocaleString()}
            </p>
            <p className="text-sm mb-1">
              <strong>Outcome:</strong> {selectedEvent.extendedProps.outcome}
            </p>
            <p className="text-sm mb-1">
              <strong>Notes:</strong> {selectedEvent.extendedProps.notes}
            </p>

            <div className="text-sm text-gray-700 space-y-1 mt-4">
              {selectedEvent.extendedProps.contact_person && (
                <p>
                  <strong>Contact:</strong> {selectedEvent.extendedProps.contact_person}
                </p>
              )}
              {selectedEvent.extendedProps.phone && (
                <p>
                  <strong>Phone:</strong>{" "}
                  <a
                    href={`tel:${selectedEvent.extendedProps.phone}`}
                    className="text-blue-600 underline"
                  >
                    {selectedEvent.extendedProps.phone}
                  </a>
                </p>
              )}
              {selectedEvent.extendedProps.email && (
                <p>
                  <strong>Email:</strong>{" "}
                  <a
                    href={`mailto:${selectedEvent.extendedProps.email}`}
                    className="text-blue-600 underline"
                  >
                    {selectedEvent.extendedProps.email}
                  </a>
                </p>
              )}
              {selectedEvent.extendedProps.profile_link && (
                <p>
                  <a
                    href={selectedEvent.extendedProps.profile_link}
                    className="text-blue-600 underline"
                  >
                    View full profile →
                  </a>
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <a
                href={generateGoogleCalendarUrl(selectedEvent)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Add to Google Calendar
              </a>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-sm bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
