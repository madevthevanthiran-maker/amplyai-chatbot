// components/ChatPanel.jsx
import { useEffect, useRef, useState } from "react";

export default function ChatPanel({ mode, messages, onSend, setMessages }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div>
      <div className="rounded-xl bg-slate-900 p-4 space-y-4 h-[60vh] overflow-y-auto text-sm">
        {messages.map((m, i) => (
          <div key={i} className="whitespace-pre-wrap">
            <span className="font-semibold text-white">
              {m.role === "user" ? "You" : "AmplyAI"}
            </span>
            <div className="text-slate-300 mt-1">
              {m.content || (m.role === "assistant" && "(No response)")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <textarea
          rows={1}
          className="flex-1 p-2 rounded bg-slate-800 text-white resize-none"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-500"
        >
          Send
        </button>
      </form>
    </div>
  );
}
