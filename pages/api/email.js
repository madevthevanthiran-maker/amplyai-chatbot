// pages/api/email.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt, tone = "professional", length = "medium" } = req.body || {};

  // Build a richer instruction for your model
  const system = `You are MailMate, an email-writing assistant.
Write a clean, concise email in a ${tone} tone.
Length target: ${length}.
Return only the email body text (no extra commentary).`;

  try {
    // === Your existing LLM/provider call here ===
    // For example: const text = await callModel({ system, prompt });
    // Make sure to return as { drafts: [text] }

    const text = await someLLMCall(system, prompt); // <— replace with your actual call
    res.status(200).json({ drafts: [text] });
  } catch (e) {
    res.status(500).json({ error: "generation_failed" });
  }
}
