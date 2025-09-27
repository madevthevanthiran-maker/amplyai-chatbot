// utils/parseTime.js

import chrono from "chrono-node";

/**
 * Parses a natural language time range from text.
 * Returns { title, start, end } or null if parsing fails.
 */
export function parseTimeRange(text, refDate = new Date()) {
  try {
    const results = chrono.parse(text, refDate);
    if (!results?.length) return null;

    const result = results[0];
    const start = result.start?.date();
    const end = result.end?.date() ?? new Date(start.getTime() + 60 * 60 * 1000); // default 1 hour

    const title = result.text ? text.replace(result.text, "").trim() || result.text : text;

    return {
      title,
      start,
      end,
    };
  } catch (err) {
    console.error("parseTimeRange error:", err);
    return null;
  }
}
