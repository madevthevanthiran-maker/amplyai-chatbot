// /components/ChatPanel.jsx
import { useEffect, useRef, useState } from "react";
import { MODE_LIST } from "@/lib/modes";
import PresetBar from "./PresetBar";

export default function ChatPanel({ mode, messages, onSend, setMessages }) {
  const [input, setInput] = useState("");
  const containerRef = useRef(null);

  // ✅ Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (text, m = mode) => {
    const content = text || input;
    if (!content.trim()) return;

    onSend(content, m);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Preset Prompts */}
      <PresetBar
        presets={mode.presets || []}
        onInsert={(text) => setInput(text)}
        onSend={(text) => handleSend(text)}
      />

      {/* Message Display */}
      <div
        ref={containerRef}
        className="flex flex-col gap-2 p-3 rounded-lg bg-slate-900 text-slate-100 h-96 overflow-y-auto border border-slate-700"
      >
        {messages.map((msg, i) => (
          <div key={i} className="text-sm">
            <strong className={msg.role === "user" ? "text-blue-400" : "text-green-400"}>
              {msg.role === "user" ? "You" : "AmplyAI"}
            </strong>
            <div className="mt-1">{msg.content}</div>
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
        onClick={() => handleSend()}
        className="rounded-lg bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 transition"
      >
        Send
      </button>
    </div>
  );
}
