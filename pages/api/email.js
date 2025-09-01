// pages/email.jsx
import Link from "next/link";
import { useMemo } from "react";
import { useLocalState } from "../lib/useLocalState";

export default function MailMate() {
  // Persistent fields
  const [intent, setIntent] = useLocalState("mailmate.intent", "Cold outreach");
  const [recipient, setRecipient] = useLocalState("mailmate.recipient", "Hiring Manager");
  const [goal, setGoal] = useLocalState("mailmate.goal", "Request a short intro call");
  const [context, setContext] = useLocalState(
    "mailmate.context",
    "I’m exploring roles and would love to learn more about your team."
  );
  const [details, setDetails] = useLocalState(
    "mailmate.details",
    "Background: product + writing. Strong on clarity, brevity, shipping."
  );
  const [tone, setTone] = useLocalState("mailmate.tone", "Friendly & concise");

  // Compose a simple subject + body locally (no API)
  const draft = useMemo(() => {
    const subj = (() => {
      const g = goal.trim();
      if (!g) return `${intent} — quick hello`;
      // keep <= 60 chars-ish
      return g.length > 60 ? g.slice(0, 57) + "…" : g;
    })();

    const lines = [
      `Subject: ${subj}`,
      "",
      recipient ? `Hi ${recipient.split(" ")[0]},` : "Hi there,",
      "",
      context,
      details ? `\n${details}` : "",
      "",
      `Would you be open to a quick 10–15 min chat this or next week?` +
        ` Happy to adapt to your schedule.`,
      "",
      `Best,`,
      `Your Name`,
      `you@example.com · www.example.com`,
    ];
    return lines.join("\n");
  }, [intent, recipient, goal, context, details]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      alert("Draft copied to clipboard ✅");
    } catch {
      alert("Couldn’t copy — select & copy manually.");
    }
  };

  return (
    <main className="container">
      {/* Back + quick nav */}
      <div className="header">
        <div className="app-title">AmplyAI — MailMate</div>
        <nav className="top-links">
          <Link href="/">← Back to Progress Partner</Link>
          <Link href="/hire-helper">HireHelper</Link>
          <Link href="/planner">Planner</Link>
        </nav>
      </div>

      <div className="card">
        <h2 style={{margin: "0 0 12px 0"}}>Email setup</h2>

        <div className="grid" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <input
            className="input"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="Intent (e.g., Cold outreach, Follow-up)"
          />
          <input
            className="input"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Recipient (e.g., Hiring Manager, Jane)"
          />

          <input
            className="input"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="One clear CTA (e.g., Request a short intro call)"
            style={{gridColumn:"1 / -1"}}
          />

          <textarea
            className="input"
            style={{minHeight:110, gridColumn:"1 / -1"}}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Context (why you’re writing)"
          />
          <textarea
            className="input"
            style={{minHeight:110, gridColumn:"1 / -1"}}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Details (relevant background, proof points, links)"
          />

          <select className="input" value={tone} onChange={(e) => setTone(e.target.value)}>
            <option>Friendly & concise</option>
            <option>Professional & direct</option>
            <option>Warm & enthusiastic</option>
          </select>
          <div style={{alignSelf:"center", color:"var(--muted)"}}>Tone (hint only)</div>
        </div>

        <div style={{display:"flex", gap:8, marginTop:12}}>
          {/* Placeholder “Generate” if you want to add an API later */}
          {/* <button className="button" onClick={generate}>Generate draft</button> */}
          <button className="button" onClick={copy}>Copy draft</button>
        </div>

        <div className="preview" style={{marginTop:12, whiteSpace:"pre-wrap"}}>
          {draft}
        </div>
      </div>
    </main>
  );
}
