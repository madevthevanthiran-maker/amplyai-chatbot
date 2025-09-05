// pages/api/chat.js
import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error:
          "OPENAI_API_KEY is missing. Set it in Vercel → Project → Settings → Environment Variables, then redeploy.",
      });
    }

    const { messages = [], mode = "general" } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "No messages provided." });
    }

    const SYSTEM = {
      general:
        "Be concise, helpful, and structured. When useful, add short sources or links. Use bullets for clarity.",
      mailmate:
        "Write crisp, outcome-driven emails with a friendly, confident tone. Include subject options if asked.",
      hirehelper:
        "Turn notes into recruiter-ready bullets using STAR (Situation/Task, Action, Result). Quantify impact.",
      planner:
        "Break goals into doable tasks with realistic time estimates, buffers, and a weekly schedule. Note risks & mitigations.",
    };

    const client = new OpenAI({ apiKey });

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM[mode] || SYSTEM.general },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const text = resp?.choices?.[0]?.message?.content?.trim() || "(No response)";
    return res.status(200).json({ text });
  } catch (err) {
    console.error("/api/chat error:", err);
    const msg = err?.response?.data?.error?.message || err?.message || "Unknown error";
    return res.status(500).json({ error: msg });
  }
}
