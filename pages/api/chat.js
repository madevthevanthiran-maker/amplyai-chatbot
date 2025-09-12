import { parseFocus } from "../../utils/parseFocus";
import { createCalendarEvent } from "../../lib/calendar";

/**
 * Chat API:
 * - Default: forwards message to GPT and returns `reply`
 * - Calendar mode: parses text and creates an event directly (no internal fetch),
 *   returning { ok, parsed, event, refreshed, tokens } just like /api/google/calendar/parse-create.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { mode, message, tokens } = req.body || {};

    // -------- Calendar mode (no HTTP hop; call libs directly) --------
    if (mode === "calendar") {
      if (!message) {
        return res.status(400).json({ error: "Missing message" });
      }
      if (!tokens) {
        return res.status(401).json({ error: "Not connected" });
      }

      const parsed = parseFocus(message, { timezone: "Asia/Singapore" });
      if (parsed.error) {
        return res.status(400).json({ error: "PARSE_ERROR", detail: parsed });
      }

      const { title, startISO, endISO, allDay, timezone } = parsed;
      const result = await createCalendarEvent(tokens, {
        summary: title,
        description: allDay ? "All-day block (auto)" : "Created by AmplyAI",
        startISO,
        endISO,
        timeZone: timezone,
      });

      if (result.error) {
        return res.status(500).json(result);
      }

      return res
        .status(200)
        .json({
          ok: true,
          parsed,
          event: result.event,
          refreshed: result.refreshed,
          tokens: result.tokens,
        });
    }

    // --------------------- Default: GPT flow --------------------------
    const systemPrompt =
      "You are Progress Partner, a helpful assistant. Answer plainly and helpfully.";

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message || "" },
      ],
      temperature: 0.7,
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.error?.message || "OpenAI API error");
    }

    return res.status(200).json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error("[api/chat] error", err);
    return res.status(500).json({ error: err.message });
  }
}
