// components/ChatPanel.jsx

import { useEffect, useRef, useState } from "react";

export default function ChatPanel({ mode, messages = [], onSend }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  // Listen for preset insertions
  useEffect(() => {
    const handleInsert = (e) => {
      setInput((prev) => (prev ? prev + " " + e.detail : e.detail));
    };
    window.addEventListener("amplyai.insertPreset", handleInsert);
    return () => window.removeEventListener("amplyai.insertPreset", handleInsert);
  }, []);

  // Scroll to bottom when new message is added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        onSend(input.trim());
        setInput("");
      }
    }
  };

  return (
    <div>
      <div
        ref={containerRef}
        className="max-h-[60vh] overflow-y-auto rounded bg-slate-900 p-4 shadow"
      >
        {messages.map((m, i) => (
          <div key={i} className="mb-4">
            <div className="font-semibold text-slate-400">
              {m.role === "user" ? "You" : "AmplyAI"}
            </div>
            <div className="whitespace-pre-wrap text-slate-100">{m.content}</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <textarea
          ref={textareaRef}
          className="w-full rounded border border-slate-600 bg-slate-800 p-2 text-slate-100"
          rows={3}
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="mt-2 w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => {
            if (input.trim()) {
              onSend(input.trim());
              setInput("");
            }
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
