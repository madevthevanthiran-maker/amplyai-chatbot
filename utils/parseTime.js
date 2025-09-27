// utils/parseTime.js

import chrono from "chrono-node";

/**
 * Parses natural language time expressions and returns a start/end time range and title.
 * Returns null if no valid time is found.
 */
export function parseTimeRange(text) {
  const results = chrono.parse(text);
  if (!results.length) return null;

  const result = results[0];
  const start = result.start?.date();
  const end = result.end?.date();
  const title = result.text ?? text;

  return {
    title,
    start,
    end: end ?? new Date(start.getTime() + 60 * 60 * 1000), // default 1 hour
  };
}
