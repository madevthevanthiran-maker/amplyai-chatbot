// utils/calendarParser.js

import parseTime from "./parseTime";

export default function calendarParser(text, refDate = new Date()) {
  const result = parseTime(text, refDate);
  if (!result) return null;

  const { startISO, endISO, title } = result;
  return {
    title,
    start: startISO,
    end: endISO,
  };
}
