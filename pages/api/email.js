// pages/api/email.js
// MailMate API (Next.js Pages Router)
// For now returns mock JSON so you can test without any API keys.

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

    // --- MOCK RESPONSE (works out of the box) ---
    const mock = {
      subjects: [
        "Quick intro: AmplyAI + a 15-min idea",
        "Exploring the Product Marketing Intern role",
        "Could we connect this week?",
      ],
      versions: [
        `Hi ${recipient || "there"},\n\nI’m building AmplyAI and wanted to quickly introduce myself. ${goal || "Could we set up a short call?"}\n\n${context}\n${details}\n\nIf it’s helpful, I can share a one-pager beforehand. Does Tue 3–5pm SGT work?\n\n${signature || "Best,\nYour Name"}`,
        `Hello ${recipient || "there"},\n\nReaching out about the role — short version: ${goal || "keen to connect for a quick chat"}.\n\n${context}\n${details}\n\nHappy to adapt if there’s a better time.\n\n${signature || "Regards,\nYour Name"}`,
      ],
    };

    // Return mock for now
    return res.status(200).json(mock);

    /* ---------- REAL AI (Optional) ----------
    1) Add OPENAI_API_KEY in Vercel: Project → Settings → Environment Variables.
    2) Uncomment the code below and remove the `return` above.

    import OpenAI from "openai";
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const sys = "You are AmplyAI's MailMate. Write crisp, high-converting emails. Return JSON only.";
    const user = `Compose an email based on:
    Intent: ${intent}
    Recipient: ${recipient}
    Goal: ${goal}
    Context: ${context}
    Details: ${details}
    Tone: ${tone}
    Length: ${length}
    Signature: ${signature}
    Constraints: ${constraints}
    Return JSON with keys "subjects" (3 strings) and "versions" (2 strings).`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const payload = JSON.parse(completion.choices?.[0]?.message?.content || "{}");
    return res.status(200).json(payload);
    ----------------------------------------- */
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}
