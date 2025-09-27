// utils/parseFocus.js
import chrono from "chrono-node";

export default function parseFocus(text, refDate = new Date(), options = {}) {
  try {
    const results = chrono.parse(text, refDate, options);

    if (!results?.length) {
      console.warn("⚠️ parseFocus: No date/time parsed from input:", text);
      const fallbackStart = new Date(refDate.getTime());
      const fallbackEnd = new Date(fallbackStart.getTime() + 60 * 60 * 1000);
      return {
        text,
        startISO: fallbackStart.toISOString(),
        endISO: fallbackEnd.toISOString(),
        title: text,
        timezone: options.timezone ?? "UTC",
        fallback: true,
      };
    }

    const result = results[0];
    const start = result.start?.date();
    const end = result.end?.date() || new Date(start.getTime() + 60 * 60 * 1000); // 1 hr default

    return {
      text,
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      title: result.text ?? text,
      timezone: options.timezone ?? "UTC",
    };
  } catch (err) {
    console.error("❌ parseFocus error", err);
    return null;
  }
}
