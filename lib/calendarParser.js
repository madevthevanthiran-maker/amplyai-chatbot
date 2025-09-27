// lib/calendarParser.js

import { parseTimeRange } from "@/utils/parseTime";

/**
 * Turns natural language into a calendar event object.
 * Used when user types "block 3–5pm tomorrow for study"
 */
export function parseCalendarInput(text, refDate = new Date()) {
  const result = parseTimeRange(text, refDate);
  if (!result) return null;

  const { start, end, title } = result;

  return {
    title,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    allDay: false,
  };
}
