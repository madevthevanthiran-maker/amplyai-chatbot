// pages/app.js

import { useEffect, useState } from "react";
import ChatPanel from "@/components/ChatPanel";

export default function AppPage() {
  const [mode, setMode] = useState("general");
  const [history, setHistory] = useState({
    general: [],
    mailmate: [],
    hirehelper: [],
    planner: [],
  });

  // Load history from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("amplyai_history_v1");
      if (raw) setHistory((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  // Save history
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("amplyai_history_v1", JSON.stringify(history));
    } catch {}
  }, [history]);

  const currentMessages = history[mode] || [];
  const setCurrentMessages = (fnOrArr) => {
    setHistory((prev) => {
      const next =
        typeof fnOrArr === "function" ? fnOrArr(prev[mode] || []) : fnOrArr;
      return { ...prev, [mode]: next };
    });
  };

  const handleSend = async (content) => {
    setCurrentMessages((prev) => [...prev, { role: "user", content }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          messages: [...currentMessages, { role: "user", content }],
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCurrentMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ ${data?.error || "Request failed."}`,
          },
        ]);
        return;
      }

      setCurrentMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.text || "(No response)" },
      ]);
    } catch (err) {
      setCurrentMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${err?.message || "Network error"}`,
        },
      ]);
    }
  };

  const handlePresetInsert = (text) => {
    window.dispatchEvent(new CustomEvent("amplyai.insertPreset", { detail: text }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <ChatPanel
          mode={mode}
          messages={currentMessages}
          onSend={handleSend}
          setMessages={setCurrentMessages}
          setMode={setMode}
          onInsertPreset={handlePresetInsert}
        />
      </div>
    </div>
  );
}
