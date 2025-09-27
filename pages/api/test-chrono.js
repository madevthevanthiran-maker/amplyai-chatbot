// /pages/api/test-chrono.js
import parseFocus from "@/utils/parseFocus";

export default function handler(req, res) {
  const { q } = req.query;
  const parsed = parseFocus(q || "Meeting tomorrow 2pm");
  res.status(200).json({ input: q, parsed });
}
