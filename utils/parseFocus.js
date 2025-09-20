// utils/parseFocus.js
//
// Robust natural-language time parser for Focus prompts.
// Examples supported:
//  - "block 2-4pm tomorrow — Deep Work thesis"
//  - "next wed 14:30 call with supplier"
//  - "all day tomorrow: study retreat"
//  - "this fri 7pm-9pm dinner with family"
//  - "meeting on 12/10 9am for 2 hours"
//  - "tomorrow 10am catch up - Alice"
//
// Returns: { title, startISO, endISO, timezone }

import * as chrono from "chrono-node";

/**
 * Parse a focus-like sentence into a calendar range + title.
 *
 * @param {string} text - user input
 * @param {Date}   [now=new Date()] - reference date
 * @param {string} [timezone='UTC']  - IANA TZ for the event
 * @returns {{title: string, startISO: string, endISO: string, timezone: string}}
 * @throws on failure to find a time range or start time
 */
export default function parseFocus(text, now = new Date(), timezone = "UTC") {
  if (!text || typeof text !== "string") {
    throw new Error("No text to parse.");
  }

  const raw = text.trim();

  // Common separators to split title from time chunk, if present.
  const SEP = /—|–|-|:|\u2014|\u2013/; // em/en dash, hyphen, colon
  // We'll try to detect a time range early (2-4pm, 14:00-16:00, 7pm–9pm)
  const rangeMatch = raw.match(
    /(\b\d{1,2}(:\d{2})?\s?(am|pm)?)[\s]*[-–—to]+[\s]*(\d{1,2}(:\d{2})?\s?(am|pm)?)\b/i
  );

  // Title heuristic: prefer the part after the first dash/colon if it looks like a name/thing
  const splitBySep = raw.split(SEP);
  // If user used " — " or ":" the part after often is the title
  let candidateTitle =
    splitBySep.length >= 2 ? splitBySep.slice(1).join(" ").trim() : "";

  // Remove common verbs/noise from beginning
  candidateTitle = candidateTitle
    .replace(/^(block|schedule|meeting|meet|call|focus|event)\b[\s:,-]*/i, "")
    .trim();

  // If we didn't get a reasonable title, try "after the date/time" by cutting out the first parsed range later.

  // Build chrono options: forward-dating to avoid past dates.
  const options = { forwardDate: true };

  // 1) Try full parse once to capture any date/time expressions.
  const first = chrono.parse(raw, now, options);

  if (!first || first.length === 0) {
    // Last-ditch: maybe user typed only "tomorrow 2pm Deep work"
    // If chrono can't find anything, fail out.
    throw new Error("Could not locate any date/time in the text.");
  }

  // We want a start and (if possible) end.
  // Strategy:
  //  - If we detected an explicit "X-Y" range, parse start and end separately around that match
  //  - Else if chrono produced a result with a known end, use it
  //  - Else assume 60 minutes default
  let start = null;
  let end = null;
  let resultUsed = null;

  // Pick the earliest chrono result that has a start.
  resultUsed = first[0];

  // If explicit range pattern exists, resolve both ends with chrono individually using same reference.
  if (rangeMatch) {
    const startText = rangeMatch[1];
    const endText = rangeMatch[4];

    // Combine with surrounding context if only times were provided (so "tomorrow 2-4pm" works)
    // We remove the range portion and keep the rest to act as context (e.g., "tomorrow")
    const prefix = raw.replace(rangeMatch[0], startText); // put start where range was for context
    const ctxRes = chrono.parse(prefix, now, options);
    const ctx = ctxRes?.[0]?.start?.date ? ctxRes[0] : resultUsed;

    const startRes = chrono.parse(startText, ctx?.start?.date() ?? now, options);
    const endRes = chrono.parse(endText, ctx?.start?.date() ?? now, options);

    if (startRes?.[0]?.start?.date && endRes?.[0]?.start?.date) {
      start = startRes[0].start.date();
      end = endRes[0].start.date();

      // If end <= start (e.g., "11-1pm") and chrono didn't add am/pm correctly, bump end by 12h or 24h
      if (end.getTime() <= start.getTime()) {
        // Try add 12h; if still <= then add 24h
        end = new Date(end.getTime() + 12 * 60 * 60 * 1000);
        if (end.getTime() <= start.getTime()) {
          end = new Date(end.getTime() + 12 * 60 * 60 * 1000);
        }
      }
    }
  }

  // If we still don't have start/end, use the chrono result as-is
  if (!start) {
    start = resultUsed.start?.date?.() ?? null;
  }
  if (!end) {
    if (resultUsed.end?.date) {
      end = resultUsed.end.date();
    } else {
      // Default duration = 60 min
      end = start ? new Date(start.getTime() + 60 * 60 * 1000) : null;
    }
  }

  if (!start || !end) {
    throw new Error("Could not resolve start/end times.");
  }

  // Derive a good title if we still don't have one.
  // Remove the recognized date/time substring from the original text.
  let title = candidateTitle;
  if (!title) {
    // Remove first matched span text if available, else just remove known tokens
    const removeSpan =
      resultUsed?.text ??
      rangeMatch?.[0] ??
      ""; // fallback minimal
    const stripped = raw.replace(removeSpan, "").replace(SEP, " ").trim();
    title = stripped
      .replace(/^(block|schedule|meeting|meet|call|focus|event)\b[\s:,-]*/i, "")
      .trim();
  }

  // Guard title fallback
  if (!title) {
    // Try "after time chunk"
    const after = splitBySep.slice(1).join(" ").trim();
    title = after || "Focus block";
  }

  // Normalize to ISO strings
  const startISO = start.toISOString();
  const endISO = end.toISOString();

  return {
    title,
    startISO,
    endISO,
    timezone,
  };
}
