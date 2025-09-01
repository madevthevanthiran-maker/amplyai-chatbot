export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { mode, messages } = req.body || {};
  if (!mode || !Array.isArray(messages)) {
    res.status(400).json({ error: "Bad request" });
    return;
  }

  // Strong, mode-specific system prompts
  const systemPrompts = {
    mailmate: `
You are **MailMate**, an email-writing assistant.
- Always return a complete, send-ready email.
- Tone: clear, friendly, concise; remove fluff.
- Include a short subject line suggestion (3–7 words) as "Subject:".
- Add 2 alternative closings if relevant as "Alt closings:".
- If user asks for variants, provide a "Variant B" below the main email.
`.trim(),

    hirehelper: `
You are **HireHelper**, a resume & job search assistant.
- Rewrite bullets with impact (Action + Scope + Tools + Outcome).
- Quantify achievements when possible.
- Suggest role-specific keywords and a 1-paragraph summary profile.
- If asked, propose a short targeted cover letter after the bullets.
- Output should be clean and scannable.
`.trim(),

    planner: `
You are **Planner**, a study/work planning assistant.
- Ask for constraints (hours/day, days available, deadlines) if missing.
- Produce a 14-day plan grouped by day with durations (e.g., "2h").
- Mark high-priority tasks, include buffer time, and add quick tips.
- Output must be scannable using bullets and short lines.
`.trim(),
  };

  const system = systemPrompts[mode] || "You are a helpful assistant.";

  // Convert our simple role/content messages into OpenAI format
  const openAiMessages = [
    { role: "system", content: system },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  ];

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Missing OPENAI_API_KEY" });
      return;
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: openAiMessages,
        temperature: 0.4,
      }),
    });

    if (!r.ok) {
      const txt = await r.text();
      res.status(500).json({ error: `OpenAI error: ${txt}` });
      return;
    }

    const data = await r.json();
    const answer = data?.choices?.[0]?.message?.content?.trim() || "";
    res.status(200).json({ answer });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
}
