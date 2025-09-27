// pages/api/chat.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages = [], mode = "general" } = req.body;

    const systemPrompts = {
      general: "You are AmplyAI, a helpful, concise assistant. Answer plainly and helpfully.",
      mailmate: "You are MailMate, a friendly writing assistant for emails. Keep replies polite, clear, and professional.",
      hirehelper: "You are HireHelper, an expert resume and job application assistant. Be concise, achievement-focused, and ATS-friendly.",
      planner: "You are PlannerPal, a helpful productivity assistant for planning tasks, exams, goals, and projects. Be practical and motivating.",
    };

    const systemPrompt = systemPrompts[mode] || systemPrompts.general;

    const payload = {
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: json.error?.message || "Something went wrong" });
    }

    return res.status(200).json({ text: json.choices?.[0]?.message?.content || "" });
  } catch (err) {
    console.error("API /chat error", err);
    return res.status(500).json({ error: err?.message || "Unknown error" });
  }
}
