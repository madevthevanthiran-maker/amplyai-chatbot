import { useState, useEffect } from "react";
import ChatInput from "./ChatInput";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [tokens, setTokens] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load Google tokens on mount from your existing status endpoint
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/google/status");
        const data = await res.json();
        if (data.connected) setTokens(data.tokens);
      } catch (e) {
        console.error("[ChatPanel] failed to load tokens", e);
      }
    }
    load();
  }, []);

  function addMessage(msg) {
    setMessages((prev) => [...prev, msg]);
  }

  async function handleSend(text) {
    addMessage({ role: "user", content: text });
    setLoading(true);

    try {
      const calendarLike = /\b(block|calendar|schedule|meeting|mtg|event|call|appointment|appt)\b/i.test(text);

      if (calendarLike) {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "calendar", message: text, tokens }),
        });
        const data = await res.json();

        if (!res.ok) {
          addMessage({ role: "assistant", content: `❌ Calendar error: ${data.message || data.error || "Not connected"}` });
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
      if (!res.ok) throw new Error(data.message || data.error);
      addMessage({ role: "assistant", content: data.reply || "(no reply)" });
    } catch (err) {
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
        {loading && <div className="italic text-gray-400">Assistant is typing…</div>}
      </div>
      <ChatInput
        onSend={handleSend}
        disabled={loading}
        placeholder="Type a message… (e.g. “next wed 14:30 call with supplier”)"
      />
    </div>
  );
}
