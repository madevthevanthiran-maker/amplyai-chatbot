// pages/api/chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { systemPrompt, messages = [], stream = false } = req.body || {};

    // Build messages for the API (system + user/assistant history)
    const chatMessages = [];
    if (systemPrompt) chatMessages.push({ role: "system", content: systemPrompt });

    // Only allow user/assistant roles from the client history
    for (const m of messages) {
      if (m?.role === "user" || m?.role === "assistant") {
        chatMessages.push({ role: m.role, content: String(m.content ?? "") });
      }
    }

    // Call OpenAI Chat Completions (non-streaming)
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // or any chat-capable model you prefer
        messages: chatMessages,
        temperature: 0.5,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: "upstream_error", details: text });
    }

    const data = await resp.json();
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.delta?.content ??
      "";

    return res.status(200).json({
      message: { role: "assistant", content: String(content) },
    });
  } catch (err) {
    console.error("api/chat error:", err);
    return res.status(500).json({ error: "server_error" });
  }
}
