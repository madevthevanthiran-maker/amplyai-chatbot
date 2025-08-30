// pages/api/ask.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { question } = req.body || {};
  if (!question) return res.status(400).json({ error: "Missing question" });

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a concise, helpful assistant for a productivity site called AmplyAI. Keep answers short, clear, and actionable.",
          },
          { role: "user", content: question },
        ],
        temperature: 0.5,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: err || "OpenAI error" });
    }

    const j = await r.json();
    const answer = j?.choices?.[0]?.message?.content?.trim() || "I couldn’t generate an answer.";
    res.status(200).json({ answer });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
}
