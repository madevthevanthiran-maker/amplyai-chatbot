import { useEffect, useMemo, useRef, useState } from "react";

const MODES = {
  mailmate: "MailMate (email)",
  hirehelper: "HireHelper (resume)",
  planner: "Planner (study/work)",
};

const EXAMPLES = {
  mailmate: [
    "Write a polite follow-up after a product demo",
    "Decline a meeting but keep the door open",
  ],
  hirehelper: [
    "Rewrite bullets for SWE internship",
    "Tailor resume to a Growth PM role",
  ],
  planner: [
    "Plan 2 weeks for finals (2h/day, M/W/F)",
    "Schedule around Tue/Thu evenings only",
  ],
};

export default function ProgressPartner() {
  const [mode, setMode] = useState("mailmate");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  // Load history per mode
  useEffect(() => {
    const saved = localStorage.getItem(`pp:chat:${mode}`);
    setMessages(saved ? JSON.parse(saved) : []);
  }, [mode]);

  // Persist history per mode
  useEffect(() => {
    localStorage.setItem(`pp:chat:${mode}`, JSON.stringify(messages));
  }, [mode, messages]);

  // Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const placeholder = useMemo(() => {
    switch (mode) {
      case "mailmate":
        return "e.g., write a concise follow-up email after a demo…";
      case "hirehelper":
        return "e.g., rewrite bullets for a Product Manager role…";
      default:
        return "e.g., plan 2 weeks around 3 deadlines, 2h/day…";
    }
  }, [mode]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, messages: next }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "I hit a snag generating a reply. Mind trying again in a moment?",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="pp-root">
      <header className="pp-header">
        <div className="pp-brand">
          <span className="pp-dot" />
          <span className="pp-name">AmplyAI</span>
          <span className="pp-sep">—</span>
          <span className="pp-page">Progress Partner</span>
        </div>
        <div className="pp-quicklinks">
          {Object.entries(MODES).map(([k, label]) => (
            <button
              key={k}
              className={`pp-pill ${mode === k ? "active" : ""}`}
              onClick={() => setMode(k)}
            >
              {label.split(" ")[0]}
            </button>
          ))}
        </div>
      </header>

      <main className="pp-main">
        <div className="pp-card">
          <nav className="pp-tabs">
            {Object.entries(MODES).map(([k, label]) => (
              <button
                key={k}
                className={`pp-tab ${mode === k ? "active" : ""}`}
                onClick={() => setMode(k)}
              >
                {label}
              </button>
            ))}
          </nav>

          <section className="pp-chat">
            {messages.length === 0 && (
              <div className="pp-welcome">
                <div className="pp-welcome-title">
                  Hey! I’m your Progress Partner. What do you want to do today?
                </div>
                <ul className="pp-welcome-list">
                  <li>Write a great email (MailMate)</li>
                  <li>Build/refresh your resume (HireHelper)</li>
                  <li>Plan study/work for 2 weeks (Planner)</li>
                </ul>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`pp-msg ${m.role}`}>
                <div className="pp-avatar">
                  {m.role === "assistant" ? "PP" : "You"}
                </div>
                <div className="pp-bubble">{m.content}</div>
              </div>
            ))}

            {sending && (
              <div className="pp-msg assistant">
                <div className="pp-avatar">PP</div>
                <div className="pp-bubble">
                  <span className="pp-typing">
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </section>

          <div className="pp-chips">
            {EXAMPLES[mode].map((t) => (
              <button
                key={t}
                className="pp-chip"
                onClick={() => setInput(t)}
                disabled={sending}
              >
                {t}
              </button>
            ))}
          </div>

          <footer className="pp-composer">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              rows={1}
            />
            <button className="pp-send" onClick={send} disabled={sending}>
              {sending ? "…" : "Send"}
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
}
