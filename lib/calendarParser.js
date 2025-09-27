// lib/calendarParser.js

import { parseTimeRange } from "../utils/parseTime";

/**
 * Parses a user message into a calendar event object
 * for blocking time or creating a reminder.
 */
export function parseCalendarEvent(message) {
  const parsed = parseTimeRange(message);
  if (!parsed) return null;

  return {
    title: parsed.title,
    start: parsed.start.toISOString(),
    end: parsed.end.toISOString(),
  };
}
