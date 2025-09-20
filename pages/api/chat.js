// /pages/api/chat.js
import parseFocus from "@/utils/parseFocus"; // ✅ must be default import

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages = [], system } = req.body;

    const systemPrompt =
      system ||
      "You are Progress Partner, a helpful assistant. Answer plainly and helpfully.";

    // Example usage of parseFocus:
    // const parsed = parseFocus("block 2-4pm tomorrow — Deep Work thesis");

    return res.status(200).json({ ok: true, echo: messages, systemPrompt });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
