// /pages/app.jsx
import { useEffect, useState } from "react";
import ChatPanel from "@/components/ChatPanel";
import ModeTabs from "@/components/ModeTabs";
import { MODE_LIST } from "@/lib/modes";

export default function AppPage() {
  const [modeId, setModeId] = useState("general");
  const [history, setHistory] = useState({
    general: [],
    mailmate: [],
    hirehelper: [],
    planner: [],
  });

  const mode = MODE_LIST.find((m) => m.id === modeId) || MODE_LIST[0];

  // Load history from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("amplyai_history_v1");
      if (raw) setHistory((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("amplyai_history_v1", JSON.stringify(history));
    } catch {}
  }, [history]);

  const currentMessages = history[mode.id] || [];

  const setCurrentMessages = (fnOrArr) => {
    setHistory((prev) => {
      const next =
        typeof fnOrArr === "function" ? fnOrArr(prev[mode.id] || []) : fnOrArr;
      return { ...prev, [mode.id]: next };
    });
  };

  const handleSend = async (content) => {
    setCurrentMessages((prev) => [...prev, { role: "user", content }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: mode.id,
          messages: [...currentMessages, { role: "user", content }],
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCurrentMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ ${data?.error || "Request failed."}` },
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
        { role: "assistant", content: `⚠️ ${err?.message || "Network error"}` },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-4">
        {/* Mode Tabs */}
        <ModeTabs mode={modeId} setMode={setModeId} />

        {/* Chat Panel */}
        <div className="mt-3">
          <ChatPanel
            mode={mode}
            messages={currentMessages}
            onSend={handleSend}
            setMessages={setCurrentMessages}
          />
        </div>
      </div>
    </div>
  );
}
