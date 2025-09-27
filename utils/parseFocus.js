// ✅ FILE: utils/parseFocus.js

import { parseTimeFromText } from "./parseTime";

function parseFocus(input) {
  const timeData = parseTimeFromText(input);
  if (!timeData) return null;

  return {
    title: timeData.title || "Focus Session",
    start: timeData.startISO,
    end: timeData.endISO,
  };
}

export default parseFocus;
