// utils/parseTime.js

import chrono from "chrono-node";

export function parseTimeExpression(input) {
  const parsedDate = chrono.parseDate(input, new Date(), {
    forwardDate: true,
  });

  if (!parsedDate) return null;

  return parsedDate;
}

export function formatTimeRange(start, end) {
  const pad = (n) => (n < 10 ? "0" + n : n);

  const startStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const endStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

  return `${startStr} - ${endStr}`;
}
