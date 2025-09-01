// pages/api/ask.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { messages } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",   // fast + affordable model
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: 200,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI error:", data.error);
      res.status(500).json({ answer: "⚠️ AI request failed." });
      return;
    }

    const answer = data.choices?.[0]?.message?.content?.trim() || "⚠️ No reply.";
    res.status(200).json({ answer });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ answer: "⚠️ Server error." });
  }
}
