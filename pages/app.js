// pages/app.js
import React, { useMemo, useState } from "react";
import ChatPanel from "@/components/ChatPanel";
import QuickActions from "@/components/QuickActions";
import { MODES } from "@/lib/modes";

export default function AppPage() {
  const [activeMode, setActiveMode] = useState("general");

  // histories per mode
  const [history, setHistory] = useState({
    general: [],
    mailmate: [],
    hirehelper: [],
    planner: [],
  });

  const messages = history[activeMode] ?? [];

  const handlePick = (modeObj) => {
    setActiveMode(modeObj.id);
  };

  const sendToApi = async (text, mode) => {
    // append user message optimistically
    setHistory((h) => ({
      ...h,
      [mode]: [...(h[mode] ?? []), { role: "user", content: text }],
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode }),
      });
      const data = await res.json();

      const assistantContent =
        data?.message ??
        "Sorry, I couldn’t process that. Please try again in a moment.";

      setHistory((h) => ({
        ...h,
        [mode]: [...(h[mode] ?? []), { role: "assistant", content: assistantContent }],
      }));
    } catch (e) {
      setHistory((h) => ({
        ...h,
        [mode]: [
          ...(h[mode] ?? []),
          { role: "assistant", content: "Network error. Please try again." },
        ],
      }));
    }
  };

  return (
    <main className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-2 text-slate-300">AmplyAI — <span className="text-slate-100">Progress Partner</span></div>

      <QuickActions activeMode={activeMode} onPick={handlePick} />

      <ChatPanel
        activeMode={activeMode}
        messages={messages}
        onSend={sendToApi}
      />
    </main>
  );
}
