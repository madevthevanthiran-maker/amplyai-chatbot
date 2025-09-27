// /utils/parseFocus.js
import chrono from "chrono-node";

export default function parseFocus(text, refDate = new Date(), options = {}) {
  try {
    console.log("🧪 parseFocus input:", text);
    console.log("📆 refDate:", refDate.toString());

    const results = chrono.parse(text, refDate, options);

    if (!results?.length) {
      console.warn("❌ chrono.parse returned no results.");
      return null;
    }

    const result = results[0];
    const start = result.start?.date();
    const end = result.end?.date();

    if (!start) {
      console.warn("❌ Parsed result missing start time.");
      return null;
    }

    const parsed = {
      text,
      startISO: start.toISOString(),
      endISO: end
        ? end.toISOString()
        : new Date(start.getTime() + 60 * 60 * 1000).toISOString(), // default 1hr
      title: result.text ?? text,
      timezone: options.timezone ?? "UTC",
    };

    console.log("✅ Parsed:", parsed);
    return parsed;
  } catch (err) {
    console.error("💥 parseFocus error:", err);
    return null;
  }
}
