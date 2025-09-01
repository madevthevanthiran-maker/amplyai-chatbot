// pages/api/ask.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { messages, mode } = req.body;

    // Custom system prompts
    const systemPrompts = {
      mailmate: "You are MailMate, an AI email assistant. Write clear, professional, and effective emails.",
      hirehelper: "You are HireHelper, an AI career assistant. Help users improve resumes, prepare for interviews, and give career advice.",
      planner: "You are Planner, an AI study/work planning assistant. Help users create schedules, stay organized, and manage productivity.",
    };

    const systemMessage = {
      role: "system",
      content: systemPrompts[mode] || "You are a helpful AI assistant.",
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [systemMessage, ...messages],
        max_tokens: 300,
      }),
    });

    const data = await response.json();

    const answer = data.choices?.[0]?.message?.content?.trim() || "⚠️ No reply.";
    res.status(200).json({ answer });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ answer: "⚠️ Server error." });
  }
}
