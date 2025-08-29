// pages/email.jsx
import { useState } from "react";
import Link from "next/link";

export default function MailMate() {
  const [intent, setIntent] = useState("Cold outreach");
  const [recipient, setRecipient] = useState("Hiring Manager");
  const [goal, setGoal] = useState("Request a short intro call");
  const [context, setContext] = useState(
    "I'm exploring roles and would love to learn more about your team."
  );
  const [details, setDetails] = useState(
    "Background: product + writing. Strong on clarity, brevity, shipping."
  );

  return (
    <main className="container">
      <header className="topbar">
        <h1>MailMate — Email Composer</h1>
        <Link href="/" className="back">← Back to Progress Partner</Link>
      </header>

      <section className="card">
        <h2>Intent & Target</h2>
        <input value={intent} onChange={e=>setIntent(e.target.value)} placeholder="Email intent" />
        <input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Recipient" />
        <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Goal (clear CTA)" />
      </section>

      <section className="card">
        <h2>Context & Style</h2>
        <textarea value={context} onChange={e=>setContext(e.target.value)} rows={4} />
        <textarea value={details} onChange={e=>setDetails(e.target.value)} rows={4} />
      </section>

      <section className="card">
        <h2>Live Preview</h2>
        <p><strong>To:</strong> {recipient}</p>
        <p><strong>Intent:</strong> {intent} • <strong>Goal:</strong> {goal}</p>
        <p><strong>Context:</strong> {context}</p>
        <p><strong>Details:</strong> {details}</p>
        <p style={{opacity:.7, marginTop:12}}>
          (Click generate in your UI to produce polished drafts via your API route.)
        </p>
      </section>
    </main>
  );
}
