// pages/api/google/calendar/parse-debug.js
import parseFocus from "../../../../utils/parseFocus";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }
  const { text, timezone } = req.body || {};
  try {
    const parsed = parseFocus(text, new Date(), timezone || "UTC");
    res.status(200).json({ ok: true, parsed });
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e?.message || e) });
  }
}
