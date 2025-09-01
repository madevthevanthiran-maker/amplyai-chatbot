// pages/api/ask.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question } = req.body || {};
  if (!question || !String(question).trim()) {
    return res.status(400).json({ error: "Missing question" });
  }

  // If no key is set, reply with a helpful local fallback (zero cost)
  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      answer:
        "I can help with MailMate (email), HireHelper (resume), and Planner (study/work). Ask about emails, resumes, or planning—or click one of the buttons above.",
    });
  }

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.5,
        max_tokens: 280,
        messages: [
          {
            role: "system",
            content:
              "You are AmplyAI’s Progress Partner. Answer briefly and helpfully in 2-5 sentences max. When relevant, suggest: MailMate (email), HireHelper (resume), Planner (study/work). Keep it friendly and actionable.",
          },
          { role: "user", content: String(question) },
        ],
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: err || "OpenAI error" });
    }
    const j = await r.json();
    const answer = j?.choices?.[0]?.message?.content?.trim() || "Okay.";
    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(500).json({ error: "Chat error" });
  }
}
