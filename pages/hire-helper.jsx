// pages/hire-helper.jsx
import Link from "next/link";
import { useState } from "react";

export default function HireHelper() {
  const [form, setForm] = useState({
    targetRole: "Product Marketing Intern",
    summary:
      "Sophomore building AmplyAI; shipped MVP; strong in copy, tooling, short-form.",
    experience: `AmplyAI — Founder (2024–Present)
- Launched MVP; 1k+ visits from Product Hunt
- Built email assistant + resume helper
- Led product, copy, and GTM experiments`,
    projects: `MailMate — AI email composer
Resume Helper — ATS-ready resume tool`,
    skills: "Copywriting, Product marketing, Email, JS/React, Next.js",
  });

  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function generate() {
    setLoading(true);
    setOutput("");
    try {
      const messages = [
        {
          role: "system",
          content:
            "You are HireHelper by AmplyAI. Turn inputs into an ATS-friendly resume section set. Be concise and results-oriented.",
        },
        {
          role: "user",
          content: `Target Role: ${form.targetRole}

Summary:
${form.summary}

Experience:
${form.experience}

Projects:
${form.projects}

Skills:
${form.skills}

Return Markdown with sections:
- Professional Summary (2–3 lines)
- Experience (bullets; each starts with an action verb + metric)
- Projects (concise bullets)
- Skills (comma-separated)
Do not include personal info.`,
        },
      ];

      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed");
      setOutput(data.content || JSON.stringify(data, null, 2));
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      {/* Back to Assistant */}
      <p style={{ margin: "12px 0 6px" }}>
        <Link href="/" style={{ textDecoration: "none", color: "#0070f3" }}>
          ← Back to Assistant
        </Link>
      </p>

      <header className="topbar">
        <h1 style={{ margin: 0 }}>
          AmplyAI — <span className="brand">HireHelper</span>
        </h1>
      </header>

      <div className="grid">
        {/* Left form */}
        <section className="card">
          <h2>Inputs</h2>

          <label>Target Role</label>
          <input value={form.targetRole} onChange={set("targetRole")} />

          <label>Professional Summary</label>
          <textarea rows={3} value={form.summary} onChange={set("summary")} />

          <label>Experience (role, dates, bullets)</label>
          <textarea rows={6} value={form.experience} onChange={set("experience")} />

          <label>Projects</label>
          <textarea rows={4} value={form.projects} onChange={set("projects")} />

          <label>Skills</label>
          <input value={form.skills} onChange={set("skills")} />

          <button className="primary" onClick={generate} disabled={loading}>
            {loading ? "Crafting…" : "Generate ATS Resume Draft"}
          </button>
        </section>

        {/* Right preview */}
        <section className="card">
          <h2>Preview</h2>
          {output ? (
            <pre className="preview">{output}</pre>
          ) : (
            <p className="muted">Your ATS-friendly resume draft will appear here.</p>
          )}
        </section>
      </div>

      <style jsx>{`
        .container { max-width: 1050px; margin: 24px auto; padding: 0 16px; }
        .topbar { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
        .brand { color:#1e293b; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:16px; }
        label { display:block; font-weight:600; margin-top:12px; margin-bottom:6px; }
        input, textarea { width:100%; border:1px solid #e5e7eb; border-radius:8px; padding:10px; }
        .primary { margin-top:16px; padding:10px 14px; border-radius:8px; background:#111827; color:#fff; border:none; }
        .preview { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:12px; white-space:pre-wrap; }
        .muted { color:#6b7280; }
        @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
