export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { mode, message, tokens } = req.body;

    // Calendar mode
    if (mode === "calendar") {
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/google/calendar/parse-create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message, tokens, timezone: "Asia/Singapore" }),
        }
      );
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    // Default: GPT response
    const systemPrompt =
      "You are Progress Partner, a helpful assistant. Answer plainly and helpfully.";

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
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

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || "OpenAI API error");

    return res.status(200).json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error("[api/chat] error", err);
    return res.status(500).json({ error: err.message });
  }
}
