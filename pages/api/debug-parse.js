// /pages/api/debug-parse.js
// POST { text: string, timezone?: string } → { ok: true, parsed } | { ok: false, error }

import parseFocus from "@/utils/parseFocus";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { text, timezone } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ ok: false, error: "Missing 'text' string" });
    }

    const parsed = parseFocus(text, { timezone });
    return res.status(200).json({ ok: true, parsed });
  } catch (err) {
    return res.status(200).json({
      ok: false,
      error: String(err?.message || err),
      stack: process.env.NODE_ENV === "production" ? undefined : err?.stack,
    });
  }
}
