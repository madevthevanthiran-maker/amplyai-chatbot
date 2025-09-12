import { useState } from "react";
import ChatInput from "./ChatInput";

/**
 * Drop-in ChatPanel that:
 * - Keeps messages state local and never binds messages into the input value.
 * - Routes calendar-like prompts to /api/chat with {mode:'calendar'}.
 * - Falls back to GPT for everything else.
 * - Shows simple bubbles (keeps your UI lightweight; does not remove your other components).
 *
 * If you already have a more complex ChatPanel, you can still use ONLY the
 * `handleSend` function from here and keep your UI.
 */

export default function ChatPanel({ tokens }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  function addMessage(msg) {
    setMessages((prev) => [...prev, msg]);
  }

  async function handleSend(text) {
    // add user message first
    addMessage({ role: "user", content: text });
    setLoading(true);

    try {
      // Very conservative trigger list for calendar routing
      const calendarLike = /\b(block|calendar|schedule|meeting|mtg|event|call|appointment|appt)\b/i.test(text);

      if (calendarLike) {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "calendar", message: text, tokens }),
        });
        const data = await res.json();

        if (!res.ok) {
          // show readable error but DO NOT leak it into input (input is controlled separately)
          addMessage({ role: "assistant", content: `❌ Calendar error: ${data.message || data.error || "Unknown error"}` });
          return;
        }

        if (data?.parsed) {
          const start = new Date(data.parsed.startISO);
          const end = new Date(data.parsed.endISO);
          addMessage({
            role: "assistant",
            content:
              `📅 **Created:** ${data.parsed.title}\n` +
              `🕒 ${start.toLocaleString()} → ${end.toLocaleString()}`,
          });
        } else {
          addMessage({ role: "assistant", content: "⚠️ I couldn't parse that into an event." });
        }
        return;
      }

      // Default: GPT flow
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        addMessage({ role: "assistant", content: `❌ Chat error: ${data.message || data.error || "Unknown error"}` });
        return;
      }

      addMessage({ role: "assistant", content: data.reply || "(no reply)" });
    } catch (err) {
      console.error("[ChatPanel] error", err);
      addMessage({ role: "assistant", content: `❌ ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b0f1a]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap p-2 rounded max-w-[80%] ${
              m.role === "user"
                ? "bg-indigo-600/20 text-indigo-100 self-end"
                : "bg-white/10 text-white self-start"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="italic text-gray-400">Assistant is typing…</div>
        )}
      </div>

      {/* Fully controlled input; no leakage from messages */}
      <ChatInput
        onSend={handleSend}
        disabled={loading}
        placeholder="Type a message…  (e.g. “next wed 14:30 call with supplier”)"
      />
    </div>
  );
}
