// pages/api/email.js
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
      return res.status(400).json({ error: "Please include at least intent, recipient, and goal." });
    }

    const system = "You are AmplyAI's MailMate. Write crisp, high-converting emails. Respond ONLY with valid JSON.";
    const user = `Compose an email based on the inputs below.
Return JSON with keys "subjects" (array of 3 strings) and "versions" (array of 2 strings).

Inputs:
Intent: ${intent}
Recipient: ${recipient}
Goal: ${goal}

Context: ${context}
Details: ${details}
Tone: ${tone}
Length: ${length}
Signature:
${signature}

Constraints: ${constraints}`;

    // --- Call OpenAI (fetch) ---
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
    const content = data?.choices?.[0]?.message?.content || "{}";
    let parsed = {};
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // fallback light parser if model returns fenced code blocks
      parsed = JSON.parse(content.replace(/^```json|```$/g, "").trim());
    }

    const subjects = Array.isArray(parsed.subjects) ? parsed.subjects.slice(0, 3) : [];
    const versions = Array.isArray(parsed.versions) ? parsed.versions.slice(0, 2) : [];

    return res.status(200).json({ subjects, versions });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
