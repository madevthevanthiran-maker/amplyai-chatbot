// pages/index.jsx
import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [q, setQ] = useState("");

  function smartRoute(e){
    e.preventDefault();
    const s = q.toLowerCase();

    if (/(email|cold|follow.?up|outreach|intro)/.test(s)) {
      window.location.href = "/email";
      return;
    }
    if (/(resume|cv|ats|hire|job)/.test(s)) {
      window.location.href = "/hire-helper";
      return;
    }
    if (/(plan|study|schedule|work|week|calendar|tasks?)/.test(s)) {
      window.location.href = "/planner";
      return;
    }
    alert("Got it! Try: 'write a cold email', 'fix my resume', or 'plan my week'.");
  }

  return (
    <main className="app">
      <div className="topbar">
        <Link className="pill-link" href="/email">MailMate</Link>
        <Link className="pill-link" href="/hire-helper">HireHelper</Link>
        <Link className="pill-link" href="/planner">Planner</Link>
      </div>

      <section className="chat">
        <h1>AmplyAI — <strong>Progress Partner</strong></h1>

        <div style={{color:"var(--muted)", marginBottom:8}}>What do you want to do today?</div>

        <div className="quick-actions">
          <Link href="/email">✉️ MailMate (email)</Link>
          <Link href="/hire-helper">💼 HireHelper (resume)</Link>
          <Link href="/planner">🗓️ Planner (study/work)</Link>
        </div>

        <form onSubmit={smartRoute}>
          <input
            className="input"
            placeholder="Type what you want to do… e.g., “write a cold email”, “polish my resume”, “plan my week”"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
          />
          <div className="actions">
            <button className="btn">Send</button>
          </div>
        </form>
      </section>
    </main>
  );
}
