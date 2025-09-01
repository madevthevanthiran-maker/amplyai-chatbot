// pages/index.jsx (or index.js)
import { useState } from "react";
import Link from "next/link";
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

  const send = (e) => {
    e.preventDefault();
    const clean = (text || "").trim();
    if (!clean) return;

    // append user bubble
    setMessages((m) => [...m, { role: "user", text: clean }]);
    setText("");
    setTyping(true);

    // simple, friendly router reply (no API cost)
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text:
            "Got it. You can jump into:\n• MailMate for emails\n• HireHelper for resumes\n• Planner to map your 2-week plan",
        },
      ]);
      setTyping(false);
    }, 600);
  };

  const clearChat = () => {
    // reset to first greeting and wipe draft input
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
            placeholder="Type what you want to do…"
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
