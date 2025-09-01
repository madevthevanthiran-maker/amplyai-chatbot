// pages/api/chat.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  try {
    const { messages = [], system } = req.body;

    // Trim history to keep payload small & cheaper (e.g., last 12)
    const trimmed = messages.slice(-12);

    const systemPrompt =
      system ||
      "You are Progress Partner, a helpful, concise assistant. Answer plainly and helpfully.";

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...trimmed.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("OpenAI error:", text);
      // surface rate limit nicely
      if (resp.status === 429) {
        return res
          .status(429)
          .json({ error: "Rate limited. Please try again shortly." });
      }
      return res.status(500).json({ error: "LLM request failed" });
    }

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "";

    return res.status(200).json({ reply });
  } catch (e) {
    console.error("Chat API error:", e);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
