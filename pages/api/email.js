// pages/api/email.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const system = `
      You are AmplyAI's MailMate. Write crisp, high-converting emails.
      Respond ONLY with valid JSON.
    `;

    const user = `
      Compose an email based on the inputs below. 
      Return JSON with keys:
      - "subjects": array of 3 possible subject lines
      - "versions": array of 2 different email drafts

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

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(raw);

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Email API error:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate email", details: error.message });
  }
}
