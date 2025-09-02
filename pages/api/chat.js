// pages/api/chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { system, messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "No messages provided" });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_PUBLIC || process.env.OPENAI_API_KEY_SECRET;
  if (!apiKey) return res.status(500).json({ error: "Server missing OpenAI API key" });

  // 25s safety timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: system ? [{ role: "system", content: system }, ...messages] : messages,
        temperature: 0.3,
      }),
    });

    clearTimeout(timeoutId);

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return res.status(500).json({ error: `Upstream error: ${text.slice(0, 200)}` });
    }

    const data = await r.json().catch(() => ({}));
    const content = data?.choices?.[0]?.message?.content ?? "";
    return res.status(200).json({ content });
  } catch (e) {
    return res.status(500).json({
      error: e?.name === "AbortError" ? "Request timed out" : String(e?.message || e),
    });
  }
}
