// utils/parseFocus.js

import { parseTimeInput } from "./parseTime";

export function parseFocus(input) {
  const blocked = [];
  const lines = input.split("\n");

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("block")) {
      const timeInfo = parseTimeInput(line);
      if (timeInfo) {
        blocked.push(timeInfo);
      }
    }
  }

  return { blocked };
}
