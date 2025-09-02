// pages/app.js
import Head from "next/head";
import React from "react";
import ChatPanel from "@/components/ChatPanel";
import CommandMenu from "@/components/CommandMenu";
import FeedbackButton from "@/components/FeedbackButton";
import { track } from "@/lib/analytics";

const TABS = [
  { key: "chat", label: "Chat (general)" },
  { key: "mailmate", label: "MailMate (email)" },
  { key: "hirehelper", label: "HireHelper (resume)" },
  { key: "planner", label: "Planner (study/work)" },
];
const VALID_KEYS = new Set(TABS.map((t) => t.key));

const SYSTEM = {
  chat:
    "You are AmplyAI’s general assistant (Progress Partner). Be concise, helpful, and friendly.",
  mailmate:
    "You are MailMate, an email assistant. Write clear, outcome-driven emails with strong subject lines and short, skimmable paragraphs. Suggest variants when helpful.",
  hirehelper:
    "You are HireHelper, a resume assistant. Convert messy notes into concise, quantified resume bullets. Prefer action verbs and measurable results (impact).",
  planner:
    "You are Planner, a study/work planning assistant. Break goals into realistic tasks, schedule them over the next two weeks with buffers, and call out over-commitments.",
};

export default function AppPage() {
  const [tab, setTab] = React.useState("chat");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const q = url.searchParams.get("tab");
    if (q && VALID_KEYS.has(q)) setTab(q);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") !== tab) {
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  }, [tab]);

  const handleSelectTab = (key) => {
    if (!VALID_KEYS.has(key)) return;
    setTab(key);
    try { track("tab_select", { tab: key }); } catch {}
  };

  const [cmdOpen, setCmdOpen] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Head><title>Progress Partner — AmplyAI</title></Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 text-gray-100">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950/70 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-blue-500 rounded-full" />
            <span className="font-semibold">AmplyAI</span>
            <span className="text-gray-400">— Progress Partner</span>

            <div className="ml-6 hidden md:flex items-center gap-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleSelectTab(t.key)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition
                    ${
                      tab === t.key
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-transparent text-gray-300 border-gray-700 hover:bg-gray-800/60"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <FeedbackButton tabId={tab} />
              <button
                onClick={() => setCmdOpen(true)}
                className="px-3 py-1.5 rounded-full border border-gray-700 text-xs text-gray-200 hover:bg-gray-800/70"
                title="Open command menu (⌘/Ctrl+K)"
              >
                ⌘K
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <main className="max-w-6xl mx-auto px-4 py-6">
          {tab === "chat" && (
            <ChatPanel tabId="chat" systemPrompt={SYSTEM.chat} placeholder="Ask anything…" />
          )}
          {tab === "mailmate" && (
            <ChatPanel
              tabId="mailmate"
              systemPrompt={SYSTEM.mailmate}
              placeholder="Paste context or draft, then say what you need…"
            />
          )}
          {tab === "hirehelper" && (
            <ChatPanel
              tabId="hirehelper"
              systemPrompt={SYSTEM.hirehelper}
              placeholder="Paste your experience/notes. I’ll turn them into resume bullets…"
            />
          )}
          {tab === "planner" && (
            <ChatPanel
              tabId="planner"
              systemPrompt={SYSTEM.planner}
              placeholder="What do you need to get done over the next two weeks?"
            />
          )}
        </main>
      </div>

      <CommandMenu
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        tabs={TABS}
        current={tab}
        onSelect={handleSelectTab}
      />
    </>
  );
}
