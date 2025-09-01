// pages/index.jsx (or index.js)
import Link from "next/link";
import { useState } from "react";
import { useLocalState } from "../lib/useLocalState";

export default function Home() {
  const [messages, setMessages] = useLocalState("pp.messages", [
    {
      role: "bot",
      text:
        "Hey! I’m your Progress Partner. What do you want to do today?\n• Write a great email (MailMate)\n• Build/refresh your resume (HireHelper)\n• Plan study/work for the next 2 weeks (Planner)",
    },
  ]);
  const [text, setText] = useLocalState("pp.input", "");
  const [typing, setTyping] = useState(false);

  function intentOf(s) {
    const t = s.toLowerCase();
    if (/(email|cold|follow.?up|outreach|intro|mailmate)/.test(t)) return "email";
    if (/(resume|cv|ats|hire|job|hirehelper|hire helper)/.test(t)) return "resume";
    if (/(plan|study|schedule|work|week|calendar|tasks?|planner)/.test(t)) return "planner";
    return "unknown";
  }

  async function send(e) {
    e.preventDefault();
    const clean = (text || "").trim();
    if (!clean) return;

    // add user bubble
    setMessages((m) => [...m, { role: "user", text: clean }]);
    setText("");

    // route if clear intent
    const intent = intentOf(clean);
    if (intent === "email") return (window.location.href = "/email");
    if (intent === "resume") return (window.location.href = "/hire-helper");
    if (intent === "planner") return (window.location.href = "/planner");

    // else: answer via /api/ask
    setTyping(true);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: clean }),
      });
      const j = await r.json();
      const answer =
        j?.answer ||
        "I can help with MailMate (email), HireHelper (resume), and Planner (study/work). Which should we open?";
      setMessages((m) => [...m, { role: "bot", text: answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text:
            "I’m here, but couldn’t generate a full answer. You can jump into MailMate (email), HireHelper (resume), or Planner (study/work).",
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  const clearChat = () => {
    setMessages([
      {
        role: "bot",
        text:
          "Hey! I’m your Progress Partner. What do you want to do today?\n• Write a great email (MailMate)\n• Build/refresh your resume (HireHelper)\n• Plan study/work for the next 2 weeks (Planner)",
      },
    ]);
    setText("");
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div className="app-title">AmplyAI — Progress Partner</div>
        <nav className="top-links">
          <Link href="/email">MailMate</Link>
          <Link href="/hire-helper">HireHelper</Link>
          <Link href="/planner">Planner</Link>
        </nav>
      </div>

      {/* Chat Card */}
      <div className="card">
        <div className="greeting">What do you want to do?</div>

        {/* messages */}
        <div className="messages" role="log" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className="row">
              <div className="avatar">{m.role === "bot" ? "PP" : "You"}</div>
              <div className={`bubble ${m.role}`}>{m.text}</div>
            </div>
          ))}

          {/* typing indicator */}
          {typing && (
            <div className="row">
              <div className="avatar">PP</div>
              <div className="bubble bot">
                <span className="typing">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* quick links under the log */}
        <div className="quick">
          <Link href="/email">📧 MailMate (email)</Link>
          <Link href="/hire-helper">💼 HireHelper (resume)</Link>
          <Link href="/planner">🗓️ Planner (study/work)</Link>
        </div>

        {/* composer */}
        <form onSubmit={send} className="composer">
          <input
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type what you want to do… or ask a quick question"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(e);
              }
            }}
          />
          <button className="button" type="submit">
            Send
          </button>
          <button
            className="button"
            type="button"
            style={{ background: "#334155" }}
            onClick={clearChat}
            title="Clear conversation"
          >
            Clear
          </button>
        </form>
      </div>
    </div>
  );
}
