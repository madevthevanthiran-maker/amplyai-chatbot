// lib/calendarParser.js
import parseTime from "./parseTime";

export default function calendarParser(inputText) {
  const parsed = parseTime(inputText);
  if (!parsed) return null;

  return {
    summary: inputText, // Or extract cleaned-up summary from input
    start: parsed.start.toISOString(),
    end: parsed.end ? parsed.end.toISOString() : null,
  };
}
