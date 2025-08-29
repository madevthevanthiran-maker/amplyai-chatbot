// pages/api/email.js
// MailMate – AI Email Composer (no SDK, uses fetch)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      intent = "",
      recipient = "",
      goal = "",
      context = "",
      details = "",
      tone = "",
      length = "",
      signature = "",
      constraints = "",
    } = req.body || {};

    if (!intent.trim() || !recipient.trim() || !goal.trim()) {
      return res
        .status(400)
        .json({ error: "Please include at least intent, recipient, and goal." });
    }

    const system = `You are AmplyAI's MailMate. Write crisp, high-converting emails. Respond ONLY with valid JSON.`;
    const user = `
      Compose an email based on the inputs below. 
      Return JSON with keys "subjects" (array of 3 strings) and "versions" (array of 2 strings).

      Inputs:
      Intent: ${intent}
      Recipient: ${recipient}
      Goal: ${goal}
      Context: ${context}
      Details: ${details}
      Tone: ${tone}
      Length: ${length}
      Signature: ${signature}
      Constraints: ${constraints}
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API Error:", data);
      return res
        .status(500)
        .json({ error: "Failed to generate email", details: data });
    }

    const text = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
