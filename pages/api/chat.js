// File: pages/api/chat.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages = [], mode } = req.body;

    const systemPromptMap = {
      general: "You are AmplyAI, a helpful assistant for general chat.",
      mailmate: "You are MailMate, a smart email assistant. Write clearly and professionally.",
      hirehelper: "You are HireHelper, an expert in resume and job application advice.",
      planner: "You are Planner, a productivity assistant for study and work scheduling.",
    };

    const systemPrompt = systemPromptMap[mode] || systemPromptMap.general;

    const payload = {
      model: "gpt-4o", // or "gpt-3.5-turbo" if preferred
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API Error:", data);
      return res.status(500).json({ error: data?.error?.message || "Request failed" });
    }

    const text = data?.choices?.[0]?.message?.content;
    return res.status(200).json({ text });
  } catch (err) {
    console.error("API handler error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
