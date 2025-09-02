// pages/app.js
import React from "react";
import ChatPanel from "@/components/ChatPanel";
import { track } from "@/lib/analytics";

const SYSTEMS = {
  hirehelper: "You are HireHelper, AmplyAI’s resume optimization specialist. Be concise, quantify impact, prefer STAR bullets.",
  mailmate: "You are MailMate. Draft clear, outcome-driven emails with subject lines and variants when useful.",
  planner: "You are the Planner. Break goals into tasks, estimate times, propose realistic schedules with buffers.",
  chat: "You are Progress Partner, a helpful, concise general assistant for life and work.",
};

export default function AppPage() {
  const [tab, setTab] = React.useState("chat");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const t = p.get("tab");
    if (t && SYSTEMS[t]) setTab(t);
  }, []);

  const label = (k) =>
    k === "hirehelper" ? "HireHelper (resume)" :
    k === "mailmate" ? "MailMate (email)" :
    k === "planner" ? "Planner (study/work)" : "Chat (general)";

  const tabs = ["chat", "mailmate", "hirehelper", "planner"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-blue-500 rounded-full"></span>
            <span className="font-semibold">AmplyAI</span>
            <span className="text-gray-500">— Progress Partner</span>
          </div>
          <nav className="flex gap-2">
            {tabs.map((key) => (
              <button
                key={key}
                onClick={() => {
                  setTab(key);
                  track("tab_select", { tab: key });
                  if (typeof window !== "undefined") {
                    const url = new URL(window.location.href);
                    url.searchParams.set("tab", key);
                    window.history.replaceState({}, "", url.toString());
                  }
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition 
                  ${tab === key
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"}`}
              >
                {label(key)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur p-6 shadow-lg">
          <ChatPanel
            tabId={tab}
            systemPrompt={SYSTEMS[tab]}
            apiPath="/api/chat"
            placeholder={
              tab === "hirehelper" ? "Paste your bullet or job description…" :
              tab === "mailmate" ? "Draft an email about…" :
              tab === "planner" ? "Plan my week around…" :
              "Ask anything…"
            }
          />
        </div>
      </main>
    </div>
  );
}
