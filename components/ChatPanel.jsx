// components/ChatPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import QuickActions from "@/components/QuickActions";
import ChatInput from "@/components/ChatInput";
import { safeGet, safeSet } from "@/lib/storage";
import { MODE_LIST } from "@/lib/modes";

export default function ChatPanel() {
  const [mode, setMode] = useState(() => safeGet("amply.mode", "general"));
  const [messages, setMessages] = useState(() => safeGet("amply.messages", []));
  const scrollRef = useRef(null);

  // persist mode & messages (client only via safe* helpers)
  useEffect(() => { safeSet("amply.mode", mode); }, [mode]);
  useEffect(() => { safeSet("amply.messages", messages); }, [messages]);

  // auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleInsertPreset = (text) => {
    if (!text) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    // Optionally: immediately call your chat API and append assistant reply
  };

  const handleSend = async (text) => {
    // push user message
    setMessages((m) => [...m, { role: "user", content: text }]);

    // TODO: call your /api/chat here with { messages, mode } and stream or append reply.
    // For now, append a placeholder assistant reply:
    const reply = `Acknowledged in "${mode}" mode. I’ll process: ${text}`;
    setMessages((m) => [...m, { role: "assistant", content: reply }]);
  };

  const msgs = Array.isArray(messages) ? messages : [];

  return (
    <div className="flex h-[100dvh] flex-col px-4 py-4">
      {/* tabs */}
      <div className="mb-3 flex gap-2 border-b border-slate-800 pb-3">
        {MODE_LIST.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              mode === m.id ? "bg-blue-700 text-white" : "bg-slate-700 text-slate-100 hover:bg-slate-600"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* quick presets */}
      <QuickActions mode={mode} onInsert={handleInsertPreset} />

      {/* messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-3"
      >
        {msgs.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
            <div
              className={`inline-block max-w-[820px] rounded-xl px-3 py-2 ${
                msg.role === "user"
                  ? "bg-blue-700 text-white"
                  : "bg-slate-800 text-slate-100"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* input */}
      <div className="mt-3">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
