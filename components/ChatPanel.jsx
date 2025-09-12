import { useState } from "react";

export default function ChatPanel({ tokens }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  function addMessage(msg) {
    setMessages((prev) => [...prev, msg]);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const text = input.trim();
    addMessage({ role: "user", content: text });
    setInput("");
    setLoading(true);

    try {
      // Check if message looks like a calendar/block-time command
      if (/calendar|block|meeting|schedule/i.test(text)) {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "calendar", message: text, tokens }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error);

        if (data?.parsed) {
          addMessage({
            role: "assistant",
            content: `📅 Event created: **${data.parsed.title}**\n\n🕒 ${new Date(
              data.parsed.startISO
            ).toLocaleString()} → ${new Date(
              data.parsed.endISO
            ).toLocaleString()}`,
          });
        } else {
          addMessage({
            role: "assistant",
            content:
              "⚠️ I tried to parse your calendar request, but something went wrong.",
          });
        }
      } else {
        // Default: send to GPT
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error);

        addMessage({
          role: "assistant",
          content: data.reply || "(no reply)",
        });
      }
    } catch (err) {
      addMessage({
        role: "assistant",
        content: `❌ Error: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              m.role === "user"
                ? "bg-blue-100 text-blue-900 self-end"
                : "bg-gray-200 text-gray-900 self-start"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="italic text-gray-500">Assistant is typing…</div>
        )}
      </div>
      <form onSubmit={sendMessage} className="p-3 flex gap-2 border-t">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-indigo-600 text-white"
          disabled={loading}
        >
          Send
        </button>
      </form>
    </div>
  );
}
