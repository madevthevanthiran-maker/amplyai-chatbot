// ✅ utils/parseFocus.js
import * as chrono from "chrono-node";
import { parseTimeInput } from "./parseTime"; // Make sure this exists and exports parseTimeInput

export function parseFocus(text, refDate = new Date(), options = {}) {
  try {
    const results = chrono.parse(text, refDate, options);
    if (!results?.length) return null;

    const result = results[0];
    const start = result.start?.date();
    const end = result.end?.date();

    if (!start) return null;

    return {
      text,
      startISO: start.toISOString(),
      endISO: end ? end.toISOString() : new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
      title: result.text ?? text,
      timezone: options.timezone ?? "UTC",
    };
  } catch (err) {
    console.error("parseFocus error", err);
    return null;
  }
}


// ✅ utils/parseTime.js (basic fallback if missing)
export function parseTimeInput(text) {
  // Add logic or keep as a stub if not needed
  return { start: new Date(), end: new Date(Date.now() + 60 * 60 * 1000) };
}


// ✅ pages/api/test-chrono.js
import * as chrono from "chrono-node";

export default function handler(req, res) {
  const tests = [
    "block 2-4pm tomorrow",
    "next wed 14:30 call with supplier",
    "remind me next Fri at 5pm",
    "meeting from 9 to 11 next Mon",
  ];

  const results = tests.map((sentence) => {
    const result = chrono.parse(sentence);
    const start = result[0]?.start?.date();
    const end = result[0]?.end?.date();
    return {
      input: sentence,
      start: start?.toISOString() || null,
      end: end?.toISOString() || null,
    };
  });

  res.status(200).json({ results });
}


// ✅ pages/api/google/calendar/parse-create.js (fix import)
import { parseFocus } from "@/utils/parseFocus";
// other logic remains the same...


// ✅ pages/api/google/calendar/parse-debug.js
import { parseFocus } from "@/utils/parseFocus";
// other logic remains the same...


// ✅ pages/api/debug-parse.js
import { parseFocus } from "@/utils/parseFocus";
// other logic remains the same...


// ✅ pages/focus.jsx
import { parseFocus } from "@/utils/parseFocus";
// other logic remains the same...
