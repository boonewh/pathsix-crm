// src/lib/calendarUtils.ts
import type { Interaction } from "@/types";

export function generateGoogleCalendarUrl(i: Interaction): string {
  const title = encodeURIComponent(`Follow-up: ${i.client_name || i.lead_name || "Unknown"}`);
  const details = encodeURIComponent(`Notes: ${i.notes || ""}\nOutcome: ${i.outcome || ""}`);
  const start = new Date(i.follow_up!).toISOString().replace(/[-:]|\.\d{3}/g, "");
  const end = start;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
}

export function generateOutlookComUrl(interaction: Interaction): string {
  if (!interaction.follow_up) return "";

  const title = encodeURIComponent(interaction.summary || "Follow-up");
  const body = encodeURIComponent(interaction.notes || "");
  const start = new Date(interaction.follow_up).toISOString();
  const end = new Date(new Date(interaction.follow_up).getTime() + 30 * 60 * 1000).toISOString(); // +30 mins

  return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&subject=${title}&body=${body}&startdt=${start}&enddt=${end}`;
}