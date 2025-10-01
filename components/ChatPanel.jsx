import { useEffect, useRef, useState } from "react";

export default function ChatPanel({ mode, messages, onSend, setMessages }) {
  const [input, setInput] = useState("");
  const containerRef = useRef(null);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // Listen for preset insert events
  useEffect(() => {
    const handler = (e) => setInput(e.detail);
    window.addEventListener("amplyai.insertPreset", handler);
    return () => window.removeEventListener("amplyai.insertPreset", handler);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Strip markdown-like **text**
  const cleanText = (text) => text.replace(/\*\*(.*?)\*\*/g, "$1");

  return (
    <div className="flex flex-col gap-2">
      {/* Chat Window */}
      <div
        ref={containerRef}
        className="flex flex-col gap-2 p-3 rounded-lg bg-slate-900 text-slate-100 h-96 overflow-y-auto border border-slate-700"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              msg.role === "user"
                ? "bg-slate-800 text-blue-300 self-end"
                : "bg-slate-800 text-green-300 self-start"
            }`}
          >
            <strong>{msg.role === "user" ? "You" : "AmplyAI"}</strong>
            <div className="whitespace-pre-wrap text-sm mt-1">
              {cleanText(msg.content)}
            </div>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <textarea
        className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={2}
        placeholder="Type a message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      {/* Send Button */}
      <button
        onClick={handleSend}
        className="rounded-lg bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 transition"
      >
        Send
      </button>
    </div>
  );
}
