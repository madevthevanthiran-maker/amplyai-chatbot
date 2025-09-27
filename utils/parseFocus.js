import * as chrono from "chrono-node";

// Clean up text before parsing
function preprocess(text) {
  return text
    .replace(/—|–/g, "-")            // Replace em/en dash with hyphen
    .replace(/\b(tmr|tmrw)\b/gi, "tomorrow")  // Expand common shorthand
    .replace(/\b(\d{1,2})-(\d{1,2})\s*pm\b/i, "$1pm to $2pm"); // 2-4pm → 2pm to 4pm
}

function extractTitle(originalText, datetimeText) {
  const clean = originalText.replace(datetimeText, "").trim();
  return clean || "Untitled Event";
}

function defaultEndTime(startDate) {
  const end = new Date(startDate);
  end.setHours(end.getHours() + 1);
  return end;
}

export default function parseFocus(text, refDateOrOptions = new Date(), maybeOptions = {}) {
  let refDate = refDateOrOptions;
  let options = maybeOptions;

  if (refDateOrOptions && typeof refDateOrOptions === "object" && !refDateOrOptions.getTime) {
    options = refDateOrOptions;
    refDate = new Date();
  }

  const cleanedText = preprocess(text);
  const results = chrono.parse(cleanedText, refDate);

  if (!results || results.length === 0) {
    console.warn("⚠ chrono failed to parse:", cleanedText);
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
