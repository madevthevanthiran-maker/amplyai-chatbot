// pages/api/chat.js
export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { message = "" } = req.body || {};
  const m = message.toLowerCase();

  if (!m.trim()) return res.json({ reply: "Tell me what you want to do." });
  if (m.includes("email")) return res.json({ reply: "Use MailMate to draft or refine your email. Want me to open it?" });
  if (m.includes("resume") || m.includes("cv")) return res.json({ reply: "Use HireHelper to structure your resume. Open it now?" });
  if (m.includes("plan") || m.includes("schedule")) return res.json({ reply: "Try Planner to map your week. Open it?" });

  // fallback: short helpful tone
  return res.json({ reply: "Got it. I can help with MailMate (email), HireHelper (resume), and Planner (study/work). Which should we open?" });
}
