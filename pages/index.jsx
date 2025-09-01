// pages/index.jsx
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import useLocalState from "../lib/useLocalState";

const WELCOME =
  "Hey! I’m your Progress Partner. What do you want to do today?";

const QUICK_ACTIONS = [
  { label: "✉️ MailMate (email)", href: "/email" },
  { label: "🧰 HireHelper (resume)", href: "/hire-helper" },
  { label: "📅 Planner (study/work)", href: "/planner" },
];

export default function Home() {
  // Persist chat across refresh
  const [messages, setMessages] = useLocalState("pp.messages", [
    { role: "assistant", content: WELCOME },
    {
      role: "assistant",
      content:
        "Tips: Try “write an outreach email”, “improve my resume bullets”, or ask me anything!",
    },
  ]);
  const [input, setInput] = useState("");

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // Optimistic UI
    const next = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");

    // Route to tool if it matches; else ask fallback API
    const lower = trimmed.toLowerCase();
    if (/(email|mailmate|mail mate)/.test(lower)) {
      window.location.href = "/email";
      return;
    }
    if (/(resume|cv|hirehelper|hire helper)/.test(lower)) {
      window.location.href = "/hire-helper";
      return;
    }
    if (/(plan|planner|schedule|study|work)/.test(lower)) {
      window.location.href = "/planner";
      return;
    }

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-8) }),
      });
      const data = await res.json();
      const ai =
        data?.answer ||
        "Hmm… I couldn’t generate a reply right now. Try again in a moment?";
      setMessages((m) => [...m, { role: "assistant", content: ai }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Something went wrong reaching the server. Please try again shortly.",
        },
      ]);
    }
  }

  return (
    <>
      <Head>
        <title>AmplyAI — Progress Partner</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="app">
        {/* Top bar */}
        <header className="topbar">
          <div className="brand">
            <span className="dot" />
            <span className="brand-name">AmplyAI</span>
            <span className="sep">—</span>
            <span className="brand-sub">Progress Partner</span>
          </div>
          <nav className="topnav">
            <Link href="/email" className="pill">MailMate</Link>
            <Link href="/hire-helper" className="pill">HireHelper</Link>
            <Link href="/planner" className="pill pill-primary">Planner</Link>
          </nav>
        </header>

        {/* Chat card */}
        <main className="shell">
          <section className="chat-card">
            {/* Quick actions */}
            <div className="quick-row">
              {QUICK_ACTIONS.map((q) => (
                <Link key={q.href} href={q.href} className="chip">
                  {q.label}
                </Link>
              ))}
            </div>

            {/* Messages */}
            <div className="messages">
              {messages.map((m, i) => (
                <Bubble key={i} role={m.role} text={m.content} />
              ))}
            </div>

            {/* Composer */}
            <form onSubmit={handleSend} className="composer">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message… (try 'write an outreach email')"
                className="input"
                aria-label="Message input"
              />
              <button className="send" type="submit">Send</button>
            </form>
          </section>
        </main>
      </div>
    </>
  );
}

function Bubble({ role, text }) {
  const me = role === "user";
  return (
    <div className={`row ${me ? "me" : "ai"}`}>
      <div className={`avatar ${me ? "me" : "ai"}`}>
        {me ? "You" : "PP"}
      </div>
      <div className={`bubble ${me ? "me" : "ai"}`}>
        {text}
      </div>
    </div>
  );
}
