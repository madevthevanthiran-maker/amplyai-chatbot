// pages/api/chat.js
import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Make the problem obvious in the UI
      return res.status(500).json({
        error:
          "OPENAI_API_KEY is missing. Set it in Vercel -> Project -> Settings -> Environment Variables.",
      });
    }

    const { messages = [], mode = "general" } = req.body || {};

    // Basic validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "No messages provided." });
    }

    const systemByMode = {
      general:
        "Be concise, helpful, and structured. Add sources when useful. Use bullets for clarity.",
      mailmate:
        "Write crisp, outcome-driven emails. Include subject options when asked. Keep a friendly, confident tone.",
      hirehelper:
        "Turn notes into recruiter-ready bullets (STAR, quantified). Optimize for clarity and impact.",
      planner:
        "Break goals into doable tasks, add time estimates, buffers, and a schedule. Be realistic.",
    };

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemByMode[mode] || systemByMode.general },
        // only include role/content
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.4,
    });

    const text =
      completion?.choices?.[0]?.message?.content?.trim() || "(No response)";
    return res.status(200).json({ text });
  } catch (err) {
    console.error("API /api/chat error:", err);
    return res.status(500).json({ error: err?.message || "Unknown error" });
  }
}
