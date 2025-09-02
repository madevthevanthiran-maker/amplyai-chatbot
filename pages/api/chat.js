// pages/api/chat.js
// Proxies OpenAI's streaming chat completions to the client as Server-Sent Events (SSE)

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

  const {
    system,
    messages = [],
    model = process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature = 0.7,
  } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "No messages provided" });
  }

  // Build message list; prepend system if provided
  const chatMessages = [...messages];
  if (system && (chatMessages[0]?.role !== "system")) {
    chatMessages.unshift({ role: "system", content: system });
  }

  // Initiate upstream request with streaming
  let upstream;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000); // 30s safety

  try {
    upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        stream: true,
        messages: chatMessages.map(({ role, content }) => ({ role, content })),
      }),
    });
  } catch (e) {
    clearTimeout(timer);
    const isAbort = e?.name === "AbortError";
    return res
      .status(isAbort ? 504 : 500)
      .json({ error: isAbort ? "Upstream timed out" : String(e?.message || e) });
  }

  clearTimeout(timer);

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return res.status(upstream.status || 500).json({
      error:
        upstream.status === 401
          ? "Invalid API key."
          : upstream.status === 429
          ? "Rate limited. Try again shortly."
          : "Upstream error.",
      detail: detail.slice(0, 500),
    });
  }

  // Prepare SSE response to client
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // for some proxies

  // Pipe chunks through as-is
  try {
    for await (const chunk of upstream.body) {
      res.write(chunk);
    }
  } catch (e) {
    // client may have disconnected/aborted; just end
  } finally {
    // Ensure stream terminator
    try { res.write("data: [DONE]\n\n"); } catch {}
    res.end();
  }
}
