// utils/parseTime.js

import chrono from "chrono-node";

/**
 * Parses natural language into a start and end datetime.
 * Examples: "3–4pm tomorrow", "next Mon 10am to 1pm"
 */
export function parseTimeRange(text, refDate = new Date(), options = {}) {
  const results = chrono.parse(text, refDate, options);
  if (!results?.length) return null;

  const result = results[0];
  const start = result.start?.date();
  const end = result.end?.date();

  if (!start) return null;

  return {
    start,
    end: end ?? new Date(start.getTime() + 60 * 60 * 1000), // default to 1 hour
    title: result.text ?? text,
  };
}
