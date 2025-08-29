// /pages/email.jsx
import { useState } from "react";
import Link from "next/link";

export default function MailMate() {
  const [form, setForm] = useState({
    intent: "Cold outreach",
    recipient: "Hiring Manager",
    goal: "Request a 15-min intro call",
    context:
      "I'm a sophomore building AmplyAI. We shipped an MVP and have traffic from PH.",
    details:
      "Job: Product Marketing Intern at Glide. My strengths: copy, tooling, short-form.",
    tone: "Concise, confident, friendly",
    signature: "Madev Thevan\nFounder, AmplyAI\nwww.amplyai.org | madev@amplyai.org",
  });

  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [versions, setVersions] = useState([]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function generate() {
    setLoading(true);
    setSubjects([]);
    setVersions([]);
    try {
      const r = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed");
      setSubjects(data.subjects || []);
      setVersions(data.versions || []);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <header className="topbar">
        <Link href="/" className="back">&larr; Resume Helper</Link>
        <h1>
          <span className="brand">AmplyAI</span> — <span>MailMate</span>
        </h1>
      </header>

      <div className="grid">
        {/* Left form */}
        <section className="card">
          <h2>Intent & Target</h2>

          <label> Email intent (e.g., Cold outreach, Follow-up, Request, Update) </label>
          <input value={form.intent} onChange={set("intent")} />

          <label> Recipient (Who are you writing to?) </label>
          <input value={form.recipient} onChange={set("recipient")} />

          <label> Goal (One clear call-to-action) </label>
          <input value={form.goal} onChange={set("goal")} />

          <h2>Context & Style</h2>

          <label> Context </label>
          <textarea rows={3} value={form.context} onChange={set("context")} />

          <label> Details </label>
          <textarea rows={3} value={form.details} onChange={set("details")} />

          <label> Tone </label>
          <input value={form.tone} onChange={set("tone")} />

          <label> Signature </label>
          <textarea rows={2} value={form.signature} onChange={set("signature")} />

          <button className="primary" onClick={generate} disabled={loading}>
            {loading ? "Generating…" : "Review → Generate"}
          </button>
        </section>

        {/* Right preview */}
        <section className="card">
          <h2>Live Preview</h2>
          <div className="preview">
            <p><strong>To:</strong> {form.recipient}</p>
            <p>
              <strong>Intent:</strong> {form.intent} • <strong>Goal:</strong> {form.goal}
            </p>
            <p><strong>Context:</strong> {form.context}</p>
            <p><strong>Details:</strong> {form.details}</p>
            <p><strong>Tone:</strong> {form.tone}</p>
            <pre className="sig">{form.signature}</pre>
          </div>

          <h3>Subject Lines (Top 3)</h3>
          {subjects.length === 0 ? (
            <p className="muted">Click Generate to get suggestions.</p>
          ) : (
            <ul>{subjects.map((s, i) => <li key={i}>{s}</li>)}</ul>
          )}

          <h3>Email Drafts (A/B)</h3>
          {versions.length === 0 ? (
            <p className="muted">Drafts will appear here after you generate.</p>
          ) : (
            versions.map((v, i) => (
              <div className="draft" key={i}>
                <pre>{v}</pre>
              </div>
            ))
          )}
        </section>
      </div>

      <style jsx>{`
        .container { max-width: 1050px; margin: 32px auto; padding: 0 16px; }
        .topbar { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
        .back { text-decoration:none; color:#6b7280; }
        h1 { font-weight:700; margin:0; }
        .brand { color:#1e293b; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:16px; }
        label { display:block; font-weight:600; margin-top:12px; margin-bottom:6px; }
        input, textarea { width:100%; border:1px solid #e5e7eb; border-radius:8px; padding:10px; }
        .primary { margin-top:16px; padding:10px 14px; border-radius:8px; background:#111827; color:#fff; border:none; }
        .preview { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:12px; margin-bottom:12px; white-space:pre-wrap; }
        .sig { white-space:pre-wrap; margin:0; }
        .muted { color:#6b7280; }
        .draft { margin-top:10px; border:1px dashed #e5e7eb; border-radius:8px; padding:12px; background:#fafafa; }
        @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
