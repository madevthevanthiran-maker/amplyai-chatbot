// pages/app.js
import React from "react";
import ChatPanel from "@/components/ChatPanel";

const SYSTEMS = {
  hirehelper: "You are HireHelper, AmplyAI’s resume optimization specialist. Be concise, quantify impact, prefer STAR bullets.",
  mailmate: "You are MailMate. Draft clear, outcome-driven emails with subject lines and variants when useful.",
  planner: "You are the Planner. Break goals into tasks, estimate times, propose realistic schedules with buffers.",
  chat: "You are Progress Partner, a helpful, concise general assistant for life and work.",
};

export default function AppPage() {
  const [tab, setTab] = React.useState("chat");

  const label = (k) =>
    k === "hirehelper" ? "HireHelper" :
    k === "mailmate" ? "MailMate" :
    k === "planner" ? "Planner" : "Chat";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">AmplyAI</div>
          <nav className="flex gap-2">
            {["hirehelper","mailmate","planner","chat"].map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3 py-1.5 rounded-xl text-sm capitalize border
                  ${tab === key ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"}`}
              >
                {label(key)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
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
      </main>
    </div>
  );
}
