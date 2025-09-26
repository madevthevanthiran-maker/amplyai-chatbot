// utils/parseFocus.js
import * as chrono from "chrono-node";

function extractTitle(text, datetimeText) {
  const title = text.replace(datetimeText, "").trim();
  return title || "Untitled Event";
}

function defaultEndTime(startDate) {
  const end = new Date(startDate);
  end.setHours(end.getHours() + 1);
  return end;
}

export default function parseFocus(text, refDate = new Date(), options = {}) {
  const results = chrono.parse(text, refDate);
  if (!results || results.length === 0) {
    throw new Error("Could not parse any date/time");
  }

  const result = results[0];

  const start = result.start?.date?.();
  if (!start) throw new Error("No start date found");

  const end = result.end?.date?.() || defaultEndTime(start);
  const timezone = options.timezone || "UTC";

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    title: extractTitle(text, result.text),
    timezone,
  };
}
