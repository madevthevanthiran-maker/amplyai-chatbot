// utils/parseFocus.js
// Very small placeholder parser.
// Your existing logic can stay—just ensure both exports exist.

export function parseFocus(text, opts = {}) {
  // Example: "block 2-4pm tomorrow — Deep Work"
  // In real code you already compute proper ISO strings & tz.
  const tz = opts.tz || "UTC";
  const now = new Date();
  const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  start.setHours(14, 0, 0, 0);
  const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  end.setHours(16, 0, 0, 0);
  return {
    ok: true,
    title: text || "Focus block",
    start: start.toISOString(),
    end: end.toISOString(),
    tz,
    allDay: false,
    intent: "event",
  };
}

export default parseFocus;
