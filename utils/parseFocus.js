// ✅ FIXED utils/parseFocus.js — with correct chrono-node import and named export

import { parse, addDays, setHours, setMinutes, format, isAfter } from "date-fns";
import * as chrono from "chrono-node"; // ✅ FIXED: named import, no default

function extractTimeRange(text) {
  const rangeRegex = /(?:from\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const match = text.match(rangeRegex);
  if (!match) return null;

  let [ , startHour, startMin = "00", startPeriod, endHour, endMin = "00", endPeriod ] = match;

  startHour = parseInt(startHour);
  endHour = parseInt(endHour);
  startMin = parseInt(startMin);
  endMin = parseInt(endMin);

  if (startPeriod) {
    if (startPeriod.toLowerCase() === "pm" && startHour < 12) startHour += 12;
    if (startPeriod.toLowerCase() === "am" && startHour === 12) startHour = 0;
  }

  if (endPeriod) {
    if (endPeriod.toLowerCase() === "pm" && endHour < 12) endHour += 12;
    if (endPeriod.toLowerCase() === "am" && endHour === 12) endHour = 0;
  }

  return { startHour, startMin, endHour, endMin };
}

export function parseFocus(input) {
  try {
    const timeRange = extractTimeRange(input);
    const date = chrono.parseDate(input);

    if (!date || !timeRange) {
      return { error: "Could not parse time or date from input." };
    }

    const baseDate = date;
    const start = new Date(baseDate);
    start.setHours(timeRange.startHour, timeRange.startMin, 0, 0);

    const end = new Date(baseDate);
    end.setHours(timeRange.endHour, timeRange.endMin, 0, 0);

    if (!isAfter(end, start)) {
      end.setDate(end.getDate() + 1);
    }

    const summary = input
      .replace(/block|schedule|plan|focus|set/i, "")
      .replace(/from.*$/i, "")
      .replace(/(\d{1,2})(?::\d{2})?\s*(am|pm)?\s*(-|to)\s*(\d{1,2})(?::\d{2})?\s*(am|pm)?/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      || "Focus Session";

    return {
      start: start.toISOString(),
      end: end.toISOString(),
      summary,
    };
  } catch (err) {
    return { error: "Parsing failed.", details: err.message };
  }
}
