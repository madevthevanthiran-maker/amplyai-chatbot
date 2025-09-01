import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text:
        "Hey! I’m your Progress Partner. What do you want to do today?\n• Write a great email (MailMate)\n• Build/refresh your resume (HireHelper)\n• Plan study/work for the next 2 weeks (Planner)",
    },
  ]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  const send = (e) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;

    // append user bubble
    setMessages((m) => [...m, { role: "user", text: clean }]);
    setText("");
    setTyping(true);

    // simple, friendly “router” answer (UI polish step; no external calls)
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

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div className="app-title">AmplyAI — Progress Partner</div>
        <nav className="top-links">
          <Link href="/email">MailMate</Link>
          <Link href="/hire-helper">HireHelper</Link>
          <Link href="/resume-builder">Planner</Link>
        </nav>
      </div>

      {/* Chat Card */}
      <div className="card">
        <div className="greeting">
          What do you want to do?
        </div>

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
          <Link href="/resume-builder">🗓️ Planner (study/work)</Link>
        </div>

        {/* composer */}
        <form onSubmit={send} className="composer">
          <input
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type what you want to do…"
          />
          <button className="button" type="submit">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
