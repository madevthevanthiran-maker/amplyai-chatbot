// pages/api/chat.js
import OpenAI from "openai";
import { PROMPTS } from "@/lib/prompts";

/**
 * Shape of PROMPTS we're expecting:
 * export const PROMPTS = {
 *   chat:    { system: "...", style: "" },
 *   mail:    { system: "...", style: "" },
 *   hire:    { system: "...", style: "" },
 *   planner: { system: "...", style: "" }
 * };
 */

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages = [], tabId = "chat" } = req.body || {};

    // Pick the right prompt for the active tab (fallback to 'chat')
    const mode = typeof tabId === "string" ? tabId : "chat";
    const preset = PROMPTS[mode] || PROMPTS.chat || { system: "", style: "" };

    // Build chat messages: system + style + user/history
    const chatMessages = [];

    if (preset.system?.trim()) {
      chatMessages.push({ role: "system", content: preset.system.trim() });
    }

    if (preset.style?.trim()) {
      chatMessages.push({ role: "system", content: preset.style.trim() });
    }

    // Append history/user messages coming from the client
    for (const m of messages) {
      // defensive normalization
      if (!m || typeof m.content !== "string") continue;
      const role = m.role === "assistant" ? "assistant" : "user";
      chatMessages.push({ role, content: m.content });
    }

    // Call OpenAI (non-streamed for simplicity & reliability)
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // use any chat-capable model you prefer
      messages: chatMessages,
      temperature: 0.3,
    });

    const content =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn’t generate a response.";

    return res.status(200).json({ content });
  } catch (err) {
    console.error("API /chat error:", err);
    return res.status(500).json({
      error: "Failed to get response from the model.",
      details:
        process.env.NODE_ENV === "development" ? String(err?.message || err) : undefined,
    });
  }
}
