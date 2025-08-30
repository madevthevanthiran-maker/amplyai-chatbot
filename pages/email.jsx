// pages/email.jsx
import Link from "next/link";
import { useState } from "react";

export default function MailMate(){
  const [intent, setIntent] = useState("Cold outreach");
  const [recipient, setRecipient] = useState("Hiring Manager");
  const [goal, setGoal] = useState("Request a short intro call");
  const [context, setContext] = useState(
    "I'm exploring roles and would love to learn more about your team."
  );
  const [details, setDetails] = useState(
    "Background: product + writing. Strong on clarity, brevity, shipping."
  );
  const signature = "Best,\nYour Name\nwww.example.com | you@example.com";

  return (
    <main className="app">
      <div className="backbar">
        <Link href="/">← Back to Progress Partner</Link>
        <Link className="pill-link" href="/hire-helper">HireHelper</Link>
        <Link className="pill-link" href="/planner">Planner</Link>
      </div>

      <div className="page">
        <h2 className="section-title">AmplyAI — MailMate</h2>

        <div className="grid">
          <input
            type="text"
            value={intent}
            onChange={(e)=>setIntent(e.target.value)}
            placeholder="Email intent…"
          />
          <input
            type="text"
            value={recipient}
            onChange={(e)=>setRecipient(e.target.value)}
            placeholder="Who are you writing to?"
          />
          <input
            type="text"
            value={goal}
            onChange={(e)=>setGoal(e.target.value)}
            placeholder="One clear call-to-action"
            className="full"
          />
          <textarea
            value={context}
            onChange={(e)=>setContext(e.target.value)}
            placeholder="Context"
            className="full"
          />
          <textarea
            value={details}
            onChange={(e)=>setDetails(e.target.value)}
            placeholder="Details"
            className="full"
          />
        </div>

        <div style={{marginTop:16}} className="preview">
          <div><strong>To:</strong> {recipient}</div>
          <div><strong>Intent:</strong> {intent} • <strong>Goal:</strong> {goal}</div>
          <div style={{marginTop:10}}><strong>Context:</strong> {context}</div>
          <div><strong>Details:</strong> {details}</div>
          <div style={{whiteSpace:"pre-wrap", marginTop:10}}>{signature}</div>
          <div style={{color:"var(--muted)", marginTop:10}}>
            (Click “Generate” in your UI to produce polished drafts via your API route.)
          </div>
        </div>
      </div>
    </main>
  );
}
