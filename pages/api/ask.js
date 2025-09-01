// pages/api/ask.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = JSON.parse(req.body || "{}");
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Missing OPENAI_API_KEY on server" });
    }

    // Lightweight, fast, and cost-friendly
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Progress Partner, a concise and friendly assistant. If the user asks about email, resume/CV, or planning, give concrete steps and link back to the relevant tool (MailMate, HireHelper, Planner). Otherwise answer briefly and helpfully.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 300,
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ error: `Upstream error: ${t}` });
    }

    const data = await r.json();
    const text =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn’t produce a response.";
    return res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
