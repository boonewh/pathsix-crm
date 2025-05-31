import { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useAuth } from "@/authContext";
import InteractionModal from "@/components/ui/InteractionModal";
import { Interaction } from "@/types";
import { apiFetch } from "@/lib/api";

// TEMP: All Seasons Foam prefers "Accounts" instead of "Clients"
const USE_ACCOUNT_LABELS = true;

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
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await apiFetch("/interactions/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: Interaction[] = await res.json();
      const filtered = data.filter((i) => {
        if (!i.follow_up) return false;
        if (filterType === "client") return !!i.client_id;
        if (filterType === "lead") return !!i.lead_id;
        return true;
      });

      const eventList: CalendarEvent[] = filtered.map((i) => ({
        id: i.id.toString(),
        title: `${i.client_name || i.lead_name || "Unknown"}`,
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
      const res = await apiFetch(`/interactions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ follow_up: newDate.toISOString() }),
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

    return (
      <div className={`${style} truncate max-w-full overflow-hidden whitespace-nowrap`}>
        {arg.event.title}
      </div>
    );
  }

  function handleDateClick(arg: any) {
    const calendarApi = calendarRef.current?.getApi() as Calendar;
    if (calendarApi) {
      calendarApi.changeView("timeGridDay", arg.dateStr);
    }
  }

  const isMobile = window.innerWidth < 768;

  return (
    <div className="p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Follow-Up Calendar</h1>

      <div className="mb-4">
        <label className="mr-2 font-semibold">Filter by:</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as "all" | "client" | "lead")}
          className="border rounded px-2 py-1"
        >
          <option value="all">All</option>
          <option value="client">{USE_ACCOUNT_LABELS ? "Accounts Only" : "Clients Only"}</option>
          <option value="lead">Leads Only</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading follow-ups...</p>
      ) : (
        <div className="overflow-x-auto">
          <FullCalendar
            ref={calendarRef}
            dateClick={handleDateClick}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={isMobile ? "timeGridDay" : "dayGridMonth"}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: "Today",
              month: "Month",
              week: "Week",
              day: "Day",
              list: "List",
            }}
            events={events}
            editable={true}
            eventDrop={handleEventDrop}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            height="auto"
          />
        </div>
      )}
      
      {selectedEvent && (
        <InteractionModal
          title={selectedEvent.title}
          date={new Date(selectedEvent.start).toLocaleString()}
          outcome={selectedEvent.extendedProps.outcome}
          notes={selectedEvent.extendedProps.notes}
          contact_person={selectedEvent.extendedProps.contact_person}
          email={selectedEvent.extendedProps.email}
          phone={selectedEvent.extendedProps.phone}
          profile_link={selectedEvent.extendedProps.profile_link}
          onClose={() => setSelectedEvent(null)}
          calendarLink={generateGoogleCalendarUrl(selectedEvent)}
          icsLink={`/api/interactions/${selectedEvent.id}/calendar.ics`}  // 👈 Add this line
        />
      )}
    </div>
  );
}
