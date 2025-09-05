// pages/app.js
import { useEffect, useState } from "react";
import ChatPanel from "@/components/ChatPanel";
import ModeTabs from "@/components/ModeTabs";
import PresetBar from "@/components/PresetBar";
import { PRESETS_BY_MODE } from "@/lib/modes";

export default function AppPage() {
  const [mode, setMode] = useState("general");
  const [history, setHistory] = useState({
    general: [],
    mailmate: [],
    hirehelper: [],
    planner: [],
  });

  // Load per-tab history from localStorage (client only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("amplyai_history_v1");
      if (raw) setHistory((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  // Save per-tab history
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
    // add user
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

  const handlePresetInsert = (text) => {
    // Tell the ChatPanel to insert this text into the textarea
    window.dispatchEvent(new CustomEvent("amplyai.insertPreset", { detail: text }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <ModeTabs mode={mode} setMode={setMode} />
        <div className="mt-3">
          <PresetBar presets={PRESETS_BY_MODE[mode]} onInsert={handlePresetInsert} />
        </div>
        <div className="mt-3">
          <ChatPanel mode={mode} messages={currentMessages} onSend={handleSend} />
        </div>
      </div>
    </div>
  );
}
