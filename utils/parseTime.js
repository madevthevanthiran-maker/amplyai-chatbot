// utils/parseTime.js

import chrono from "chrono-node";

// Parses a sentence like "meeting 2pm tomorrow" and returns { start, end, title }
export function parseTimeFromText(text, refDate = new Date()) {
  try {
    const results = chrono.parse(text, refDate);
    if (!results.length) return null;

    const result = results[0];
    const start = result.start?.date();
    const end = result.end?.date() || new Date(start.getTime() + 60 * 60 * 1000);

    return {
      text,
      title: result.text,
      startISO: start.toISOString(),
      endISO: end.toISOString(),
    };
  } catch (err) {
    console.error("parseTimeFromText error", err);
    return null;
  }
}
