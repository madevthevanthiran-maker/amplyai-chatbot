// utils/parseTime.js

import chrono from "chrono-node";

/**
 * Parses a natural language string into a start and end time using chrono-node.
 * Fallbacks to 1-hour blocks if no end time is given.
 *
 * @param {string} text - The input string like "2pm to 4pm next Tuesday"
 * @param {Date} refDate - Reference date (defaults to now)
 * @returns {object|null} - { start, end, title } or null if failed
 */
export function parseTimeRange(text, refDate = new Date()) {
  try {
    const results = chrono.parse(text, refDate);
    if (!results?.length) return null;

    const result = results[0];
    const start = result.start?.date();
    const end = result.end?.date() ?? new Date(start.getTime() + 60 * 60 * 1000);

    return {
      start,
      end,
      title: result.text ?? text,
    };
  } catch (err) {
    console.error("[parseTimeRange] error:", err);
    return null;
  }
}
