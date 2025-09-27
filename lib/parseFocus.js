// lib/parseFocus.js
import calendarParser from "./calendarParser";

export default function parseFocus(inputText) {
  const parsedEvent = calendarParser(inputText);
  if (!parsedEvent) {
    return { error: "Could not parse date/time from input." };
  }

  return {
    event: {
      summary: parsedEvent.summary,
      startTime: parsedEvent.start,
      endTime: parsedEvent.end,
    },
  };
}
