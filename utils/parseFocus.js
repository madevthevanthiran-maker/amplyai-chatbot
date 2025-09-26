// utils/parseFocus.js

import * as chrono from "chrono-node";

/**
 * Extract a title from the input string, removing known date/time info.
 */
function extractTitle(input, parsedDate) {
  const refDate = new Date(parsedDate);

  // Extract known parts from chrono
  const results = chrono.parse(input, refDate);
  if (results.length === 0) return input;

  let clean = input;
  for (const result of results) {
    clean = clean.replace(result.text, "");
  }

  return clean.trim().replace(/^[-–—\s]+/, "").trim();
}

/**
 * Attempts to parse natural language input into a calendar event.
 */
export default function parseFocus(text, options = {}) {
  const refDate = options.referenceDate instanceof Date
    ? options.referenceDate
    : new Date();
  const tz = options.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const results = chrono.parse(text, refDate);
  if (!results || results.length === 0) return null;

  const result = results[0];
  const startDate = result.start?.date();
  const endDate = result.end?.date();

  if (!startDate) return null;

  let title = extractTitle(text, startDate);
  if (!title) title = "Untitled event";

  return {
    title,
    startISO: startDate.toISOString(),
    endISO: (endDate || new Date(startDate.getTime() + 30 * 60000)).toISOString(),
    timezone: tz,
  };
}
