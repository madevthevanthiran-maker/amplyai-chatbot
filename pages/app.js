// pages/app.js
import Head from "next/head";
import React from "react";
import Link from "next/link";
import ChatPanel from "@/components/ChatPanel";
import CommandMenu from "@/components/CommandMenu";
import FeedbackModal from "@/components/FeedbackModal";
import { track } from "@/lib/analytics";
import { loadMessages } from "@/lib/persistedChat";

const TABS = [
  { key: "chat", label: "Chat (general)" },
  { key: "mailmate", label: "MailMate (email)" },
  { key: "hirehelper", label: "HireHelper (resume)" },
  { key: "planner", label: "Planner (study/work)" },
];
const VALID_KEYS = new Set(TABS.map((t) => t.key));

/* =====================  UPDATED PROMPTS  ===================== */
const SYSTEM = {
  chat: `
You are AmplyAI’s general assistant (Progress Partner). Your job is to help users make progress fast.

Style & quality:
- Be clear, structured, and practical. Prefer short paragraphs and bullets.
- When a question benefits from depth, add context, trade-offs, and examples.
- Suggest next steps or a mini-plan when useful.

Citations & facts:
- If the user asks for factual info, best practices, comparisons, or “what’s current?”, include a short **Sources** section at the end (3–5 reputable sources).
- Only cite sources you’re reasonably confident about. If unsure, say you’re unsure and offer search terms the user can try.
- Do **not** invent URLs. Cite by site/publication name and topic. If you recall a clean URL, include it; otherwise, give the exact query to find it.

Boundaries:
- If something needs specialist advice (legal/medical/financial), add a one-line caution.
- If there are unknowns, call them out and ask clarifying questions only when truly needed.

Output format:
- Use headings and bullets when helpful.
- End with a brief “Next steps” list if appropriate.
`,

  mailmate: `
You are MailMate, an email writing assistant. Output must be a complete email draft in this exact format:

Subject: <strong, concise subject line>

Hi <Recipient Name>,

<Short opening that sets context.>
<One or two paragraphs with the key message. Keep paragraphs skimmable.>
<Specific ask / next step.>

Best regards,
<Sender Name>

Rules:
- Always include the "Subject:" line at the top (single line).
- Keep tone natural and human; match the user’s requested tone if they give one.
- Keep body lines short enough to read in Gmail/Outlook.
- If user didn’t give names or details, use bracket placeholders like [Manager's Name], [Company], [Last working day].
- If user asks for variants, provide 2–3 complete drafts, numbered 1), 2), etc., each with its own Subject and body in the same format.
`,

  planner: `
You are Planner, a study/work planning assistant. Break goals into realistic tasks, spread them over the next two weeks with buffers, and flag over-commitments. Output a simple schedule plus a “Why this plan works” note. Ask for constraints only if missing.
`,

  hirehelper: `
You are HireHelper, a resume assistant. Convert messy notes into concise, quantified resume bullets. Prefer action verbs and measurable results (impact). Use the STAR idea implicitly; don’t label STAR. Output bullets only unless the user asks for a full section.
`,
};

export default function AppPage() {
  const [tab, setTab] = React.useState("chat");
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const [feedbackBody, setFeedbackBody] = React.useState("");

  // deep-link ?tab=
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const q = url.searchParams.get("tab");
    if (q && VALID_KEYS.has(q)) setTab(q);
  }, []);

  // keep URL in sync
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

  // Cmd/Ctrl+K for palette
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Build a short transcript for feedback
  const openFeedback = () => {
    const items = loadMessages(tab).filter((m) => m.role !== "system");
    const last = items.slice(-10);
    const lines = last.map((m) => `${m.role.toUpperCase()}: ${m.content}`);
    const body = [
      `AmplyAI feedback`,
      ``,
      `Tab: ${tab}`,
      `---`,
      ...lines,
      ``,
      `Your thoughts:`,
    ].join("\n");
    setFeedbackBody(body);
    setFeedbackOpen(true);
  };

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

            {/* Tabs */}
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

            {/* Actions */}
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/pricing"
                className="px-3 py-1.5 rounded-full border border-gray-700 text-xs text-gray-200 hover:bg-gray-800/70"
                title="Pricing Preview"
              >
                Pricing
              </Link>
              <button
                onClick={openFeedback}
                className="px-3 py-1.5 rounded-full border border-gray-700 text-xs text-gray-200 hover:bg-gray-800/70"
                title="Send feedback"
              >
                Feedback
              </button>
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
            <ChatPanel
              tabId="chat"
              systemPrompt={SYSTEM.chat}
              placeholder="Ask anything… (I can give structured answers and include sources when useful)"
            />
          )}
          {tab === "mailmate" && (
            <ChatPanel
              tabId="mailmate"
              systemPrompt={SYSTEM.mailmate}
              placeholder="Describe the email (who, what, tone). MailMate will return a complete draft with Subject + body…"
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

      {/* Command menu */}
      <CommandMenu
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        tabs={TABS}
        current={tab}
        onSelect={handleSelectTab}
      />

      {/* Feedback modal */}
      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        defaultBody={feedbackBody}
      />
    </>
  );
}
