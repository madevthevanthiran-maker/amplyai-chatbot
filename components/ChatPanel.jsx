// /components/ChatPanel.jsx

import { useEffect, useRef, useState } from "react";
import { MODE_LIST } from "@/lib/modes";
import PresetBar from "./PresetBar";

export default function ChatPanel({ messages, onSend }) {
  const [mode, setMode] = useState(MODE_LIST[0]);
  const [input, setInput] = useState("");
  const [presets, setPresets] = useState(mode.presets || []);
  const containerRef = useRef(null);

  useEffect(() => {
    setPresets(mode.presets || []);
  }, [mode]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input, mode.system);
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
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pb-1">
        {MODE_LIST.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              mode.id === m.id
                ? "bg-slate-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Preset Prompts */}
      <PresetBar
        presets={presets}
        onInsert={(text) => setInput(text)}
      />

      {/* Message Display */}
      <div
        ref={containerRef}
        className="flex flex-col gap-2 p-3 rounded-lg bg-slate-900 text-slate-100 h-64 overflow-y-auto border border-slate-700"
      >
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.role === "user" ? "You" : "AmplyAI"}</strong>
            <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
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
