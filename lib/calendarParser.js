// lib/calendarParser.js

import { parseTimeRange } from "../utils/parseTime";

/**
 * Converts free-form text into a calendar event object with title, start, and end time.
 * Falls back to default 1-hour duration if end time is not provided.
 */
export function parseCalendarText(inputText) {
  const parsed = parseTimeRange(inputText);
  if (!parsed) return null;

  return {
    title: parsed.title,
    start: parsed.start.toISOString(),
    end: parsed.end.toISOString(),
  };
}
