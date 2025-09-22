// pages/api/ping.js
export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }
  return res.status(200).json({ ok: true, echo: req.body || null });
}
