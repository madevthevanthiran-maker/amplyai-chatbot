// lib/calendarParser.js

import { parseTimeRange } from "@/utils/parseTime";

/**
 * Converts text input into a calendar block object for Google Calendar.
 * Returns { title, startISO, endISO } or null if parsing fails.
 */
export function calendarParser(text, refDate = new Date()) {
  const result = parseTimeRange(text, refDate);
  if (!result) return null;

  return {
    title: result.title,
    startISO: result.start.toISOString(),
    endISO: result.end.toISOString(),
  };
}
