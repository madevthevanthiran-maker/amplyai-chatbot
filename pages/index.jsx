// pages/index.jsx
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function smartRoute(e) {
    e.preventDefault();
    const s = q.trim().toLowerCase();
    if (!s) return;

    // Hard-route to tools if intent is clear
    if (/(email|cold|follow.?up|outreach|intro|mailmate)/.test(s)) {
      window.location.href = "/email";
      return;
    }
    if (/(resume|cv|ats|hire|job|hirehelper)/.test(s)) {
      window.location.href = "/hire-helper";
      return;
    }
    if (/(plan|study|schedule|work|week|calendar|tasks?|planner)/.test(s)) {
      window.location.href = "/planner";
      return;
    }

    // Otherwise: answer inline
    try {
      setLoading(true);
      setAnswer("");
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const j = await r.json();
      setAnswer(j.answer || "I couldn’t generate an answer.");
    } catch (err) {
      setAnswer("Sorry — I couldn’t answer that right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ paddingTop: 28 }}>
      {/* Top nav chips */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginBottom: 8 }}>
        <a className="pill-link" href="/email">MailMate</a>
        <a className="pill-link" href="/hire-helper">HireHelper</a>
        <a className="pill-link" href="/planner">Planner</a>
      </div>

      <h1 style={{ marginBottom: 16 }}>AmplyAI — <span style={{ fontWeight: 500 }}>Progress Partner</span></h1>

      <div className="card chat">
        <div className="bubble">
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            What do you want to do today?
          </div>
          <div style={{ color: "var(--muted)" }}>
            • Write a great email (MailMate) &nbsp;• Build/refresh your resume (HireHelper) &nbsp;• Or ask me something here.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <a className="pill-link" href="/email">📧&nbsp;MailMate (email)</a>
          <a className="pill-link" href="/hire-helper">💼&nbsp;HireHelper (resume)</a>
          <a className="pill-link" href="/planner">🗓️&nbsp;Planner (study/work)</a>
        </div>

        {/* Ask box */}
        <form onSubmit={smartRoute} style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            ref={inputRef}
            className="input"
            placeholder="Type what you want to do… or ask a quick question"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) smartRoute(e);
            }}
          />
          <button className="btn" type="submit">Send</button>
        </form>

        {/* Inline answer (fallback QA) */}
        {loading && <div style={{ marginTop: 12, color: "var(--muted)" }}>Thinking…</div>}
        {!loading && !!answer && (
          <div className="preview" style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
            {answer}
          </div>
        )}
      </div>
    </div>
  );
}
