// pages/api/email.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, tone, length } = req.body;

  try {
    // Build a system prompt tailored for email writing
    const systemPrompt = `
You are MailMate, an email writing assistant.
Always produce 2 polished email drafts in Markdown format.
Apply the requested tone: ${tone}.
Adjust the length: ${length}.
Return ONLY email drafts, nothing else.
    `;

    const userPrompt = `Write an email: ${prompt}`;

    // Example: using OpenAI API (replace with your actual client call)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const text = data.choices[0].message.content;

    // Split drafts by "---" or numbering
    const drafts = text.split(/(?:^|\n)---+\n?/).map((d) => d.trim()).filter(Boolean);

    res.status(200).json({ drafts });
  } catch (err) {
    console.error("MailMate error:", err);
    res.status(500).json({ error: "Failed to generate email" });
  }
}
