// pages/api/chat.js
// Simple non-streaming chat endpoint for AmplyAI.
// Expects: { system?: string, messages: [{role, content}] }
// Returns: { content: string }

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Surface a clear message in dev; in prod you'll just see the "error" bubble.
    return res
      .status(500)
      .json({ error: "Missing OPENAI_API_KEY environment variable." });
  }

  try {
    const { system, messages = [] } = req.body || {};

    // Build message array (prepend system if provided and not already included)
    const chatMessages = Array.isArray(messages) ? [...messages] : [];
    if (system && (!chatMessages.length || chatMessages[0]?.role !== "system")) {
      chatMessages.unshift({ role: "system", content: system });
    }

    // Call OpenAI Chat Completions
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // pick your model here
        temperature: 0.7,
        messages: chatMessages.map(({ role, content }) => ({ role, content })),
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return res
        .status(resp.status)
        .json({ error: `Provider error (${resp.status}): ${errText}` });
    }

    const data = await resp.json();

    const content =
      data?.choices?.[0]?.message?.content ??
      "Sorry, I couldn't generate a response.";

    // Frontend expects { content }
    return res.status(200).json({ content });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
