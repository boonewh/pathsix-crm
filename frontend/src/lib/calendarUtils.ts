// src/lib/calendarUtils.ts
import type { Interaction } from "@/types";

export function generateGoogleCalendarUrl(i: Interaction): string {
  const title = encodeURIComponent(`Follow-up: ${i.client_name || i.lead_name || "Unknown"}`);
  const details = encodeURIComponent(`Notes: ${i.notes || ""}\nOutcome: ${i.outcome || ""}`);
  const start = new Date(i.follow_up!).toISOString().replace(/[-:]|\.\d{3}/g, "");
  const end = start;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
}
