// pages/app.jsx
import { useState, useEffect } from "react";
import Head from "next/head";
import ChatPanel from "@/components/ChatPanel";

const TABS = [
  {
    id: "chat",
    label: "Chat (general)",
    initial: [
      {
        role: "assistant",
        content:
          "Hey! I’m your Progress Partner. Ask anything — I can summarize, research, reason step-by-step, and include sources when useful.",
      },
    ],
    hint:
      "Ask anything… (I can give structured answers and include sources when useful)",
  },
  {
    id: "mailmate",
    label: "MailMate (email)",
    initial: [
      {
        role: "assistant",
        content:
          "MailMate here. What’s the goal of the email? Paste context or bullets and tell me tone (concise, warm, formal). I’ll draft, subject line first.",
      },
    ],
    hint: "Describe the email goal, tone, and paste any context…",
  },
  {
    id: "hirehelper",
    label: "HireHelper (resume)",
    initial: [
      {
        role: "assistant",
        content:
          "HireHelper ready. Paste messy experience/notes. I’ll craft STAR-tight, quantified bullets and align them to a role/ATS if you tell me.",
      },
    ],
    hint:
      "Paste raw experience. Optionally add target role/ATS keywords for alignment…",
  },
  {
    id: "planner",
    label: "Planner (study/work)",
    initial: [
      {
        role: "assistant",
        content:
          "Planner here. What’s the outcome and deadline? I’ll break it into realistic tasks with buffers and build a schedule you can actually follow.",
      },
    ],
    hint:
      "Describe the goal and deadline. I’ll make a buffered plan with milestones…",
  },
];

export default function AppPage() {
  const [active, setActive] = useState("chat");

  // optional: remember last-opened tab across reloads
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("amplyai.v1.lastTab") : null;
    if (saved && TABS.some(t => t.id === saved)) setActive(saved);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("amplyai.v1.lastTab", active);
    }
  }, [active]);

  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <>
      <Head>
        <title>AmplyAI — Progress Partner</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#0A1020] text-slate-100">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0A1020]/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2D5BFF]" />
              <span className="text-[15px] font-semibold">AmplyAI</span>
              <span className="mx-2 text-slate-500">—</span>
              <span className="text-[14px] text-slate-400">Progress Partner</span>
            </div>

            {/* simple right-side actions (optional) */}
            <div className="hidden items-center gap-2 sm:flex">
              <a
                href="/pricing"
                className="rounded-full border border-white/15 px-3 py-1.5 text-[13px] text-slate-200 hover:bg-white/5"
              >
                Pricing
              </a>
              <a
                href="mailto:hello@amplyai.org?subject=AmplyAI%20feedback"
                className="rounded-full border border-white/15 px-3 py-1.5 text-[13px] text-slate-200 hover:bg-white/5"
              >
                Feedback
              </a>
              <span className="rounded-full border border-white/15 px-2 py-1 text-[12px] text-slate-400">
                ⌘K
              </span>
            </div>
          </div>

          {/* Tab pills */}
          <nav className="mx-auto max-w-6xl px-3 pb-3">
            <div className="flex flex-wrap gap-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] ${
                    active === t.id
                      ? "bg-[#2D5BFF] text-white"
                      : "bg-white/5 text-slate-300 hover:bg-white/7"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </nav>
        </header>

        {/* Main chat container */}
        <main className="mx-auto max-w-6xl px-3 pb-10 pt-6">
          <div className="rounded-2xl border border-white/10 bg-[#0B1222]/60 p-3 sm:p-4">
            {/* Here we mount ONE panel, switching tabId/props.
                ChatPanel persists per-tab in localStorage, so history is restored. */}
            <ChatPanel
              tabId={current.id}
              initialMessages={current.initial}
              systemHint={current.hint}
            />
          </div>
        </main>
      </div>
    </>
  );
}
