// /pages/api/email.js
// MailMate — AI Email Composer (no SDK; uses fetch)

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
      signature = "",
    } = req.body || {};

    if (!intent.trim() || !recipient.trim() || !goal.trim()) {
      return res
        .status(400)
        .json({ error: "Please include at least intent, recipient, and goal." });
    }

    const system =
      'You are AmplyAI\'s MailMate. Write crisp, high-converting emails. Respond ONLY with valid JSON.';

    const user = `Compose an email based on the inputs below.
Return JSON with keys "subjects" (array of 3 strings) and "versions" (array of 2 strings).

Inputs:
Intent: ${intent}
Recipient: ${recipient}
Goal: ${goal}

Context: ${context}
Details: ${details}

Tone: ${tone}
Signature: ${signature}

Rules:
- Keep it concise and friendly.
- 1 clear call-to-action.
- No fluff or filler.
- 1 paragraph + a short CTA line is ideal.
- Provide 3 subject line options.
- Provide 2 email body variants.`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ error: `OpenAI error: ${text}` });
    }

    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: "Model returned non-JSON." });
    }

    // Sanity defaults
    const subjects = Array.isArray(parsed.subjects) ? parsed.subjects : [];
    const versions = Array.isArray(parsed.versions) ? parsed.versions : [];

    return res.status(200).json({ subjects, versions });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}
