// utils/parseTime.js
import chrono from "chrono-node";

export function parseNaturalLanguageTime(text, referenceDate = new Date()) {
  const results = chrono.parse(text, referenceDate);

  if (results.length === 0) return null;

  const { start, end } = results[0];
  return {
    start: start?.date() || null,
    end: end?.date() || null,
  };
}
