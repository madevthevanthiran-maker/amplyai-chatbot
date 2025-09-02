// pages/api/chat.js
// Simple non-streaming chat endpoint with robust error handling.

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  const {
    system,
    messages = [],
    model = process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature = 0.7,
  } = req.body || {};

  // Build message list; prepend system if not already there
  const chatMessages = Array.isArray(messages) ? [...messages] : [];
  if (system && (!chatMessages.length || chatMessages[0]?.role !== "system")) {
    chatMessages.unshift({ role: "system", content: system });
  }

  // Guardrails
  if (!chatMessages.length) {
    return res.status(400).json({ error: "No messages provided" });
  }
  // Trim overly long prompts to avoid provider errors
  const MAX_CHARS = 8000;
  const safeMessages = chatMessages.map(m => ({
    role: m.role,
    content: (m.content || "").slice(0, MAX_CHARS),
  }));

  // Timeout (in case provider hangs)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000); // 30s

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: safeMessages,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    // If provider returns error, pass details through so UI can show it
    if (!resp.ok) {
      let detail = "";
      try {
        const t = await resp.text();
        detail = t || "";
      } catch {}
      const status = resp.status;

      // Helpful messages for common cases
      let friendly =
        status === 401
          ? "Invalid API key."
          : status === 429
          ? "Rate limited. Please slow down and try again."
          : status >= 500
          ? "Upstream service error."
          : "Request failed.";

      return res
        .status(status)
        .json({ error: `${friendly} (status ${status})`, detail });
    }

    const data = await resp.json();
    const content =
      data?.choices?.[0]?.message?.content ??
      "Sorry, I couldn't generate a response.";

    return res.status(200).json({ content });
  } catch (err) {
    const aborted = err?.name === "AbortError";
    return res.status(504).json({
      error: aborted ? "Request timed out." : "Network/unknown error.",
      detail: String(err?.message || err),
    });
  }
}
