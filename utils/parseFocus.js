import chrono from "chrono-node";

export default function parseFocus(text, refDate = new Date(), options = {}) {
  try {
    const results = chrono.parse(text, refDate, options);
    if (!results?.length) return null;

    const result = results[0];
    const start = result.start?.date();
    const end = result.end?.date();

    if (!start) return null;

    return {
      text,
      startISO: start.toISOString(),
      endISO: end ? end.toISOString() : new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
      title: result.text ?? text,
      timezone: options.timezone ?? "UTC",
    };
  } catch (err) {
    console.error("parseFocus error", err);
    return null;
  }
}
