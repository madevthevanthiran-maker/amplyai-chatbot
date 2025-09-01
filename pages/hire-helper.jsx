// pages/hire-helper.jsx
import Link from "next/link";
import { useMemo } from "react";
import useLocalState from "../lib/useLocalState";

export default function HireHelper() {
  // Persistent fields
  const [targetRole, setTargetRole] = useLocalState("hire.role", "");
  const [layout, setLayout] = useLocalState("hire.layout", "Modern / Minimal");

  const [org, setOrg] = useLocalState("hire.org", "");
  const [title, setTitle] = useLocalState("hire.title", "");
  const [city, setCity] = useLocalState("hire.city", "");
  const [country, setCountry] = useLocalState("hire.country", "");
  const [start, setStart] = useLocalState("hire.start", "");
  const [end, setEnd] = useLocalState("hire.end", "");
  const [desc, setDesc] = useLocalState(
    "hire.desc",
    "Summarize what you owned. Add 2–3 bullet points with metrics if possible."
  );

  // Very light “ATS style” bullets from the freeform desc (no AI yet)
  const bullets = useMemo(() => {
    const raw = (desc || "").split(/\n+/).map(s => s.trim()).filter(Boolean);
    if (raw.length === 0) return ["• Add 2–3 strong impact bullets here."];
    // Cap to 3 bullets
    return raw.slice(0, 3).map((b, i) => (b.startsWith("•") ? b : `• ${b}`));
  }, [desc]);

  const sectionText = useMemo(() => {
    const header = [org, title].filter(Boolean).join(" — ");
    const loc = [city, country].filter(Boolean).join(", ");
    const dates = [start, end].filter(Boolean).join(" — ");
    const lines = [
      header || "Organisation — Position",
      [loc, dates].filter(Boolean).join(" • "),
      "",
      ...bullets,
    ];
    return lines.join("\n");
  }, [org, title, city, country, start, end, bullets]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sectionText);
      alert("Section copied to clipboard ✅");
    } catch {
      alert("Couldn’t copy — select & copy manually.");
    }
  };

  return (
    <main className="container">
      {/* Back + quick nav */}
      <div className="header">
        <div className="app-title">AmplyAI — HireHelper</div>
        <nav className="top-links">
          <Link href="/">← Back to Progress Partner</Link>
          <Link href="/email">MailMate</Link>
          <Link href="/planner">Planner</Link>
        </nav>
      </div>

      <div className="card">
        <h2 style={{margin:"0 0 12px 0"}}>Resume setup</h2>
        <div style={{color:"var(--muted)", marginBottom:12}}>
          Target role & layout preference (used as guidance for style/tone).
        </div>

        <div className="grid" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <input
            className="input"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Target role (e.g., Product Manager)"
          />
          <select className="input" value={layout} onChange={(e)=> setLayout(e.target.value)}>
            <option>Modern / Minimal</option>
            <option>ATS / Compact</option>
            <option>Academic CV</option>
          </select>

          <div style={{gridColumn:"1 / -1", color:"var(--muted)"}}>
            Experience entry (add as many sections as you need; copy each).
          </div>

          <input className="input" value={org} onChange={(e)=>setOrg(e.target.value)} placeholder="Organisation" />
          <input className="input" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Position / Role" />
          <input className="input" value={city} onChange={(e)=>setCity(e.target.value)} placeholder="City" />
          <input className="input" value={country} onChange={(e)=>setCountry(e.target.value)} placeholder="Country" />
          <input className="input" value={start} onChange={(e)=>setStart(e.target.value)} placeholder="Start (MM/YYYY)" />
          <input className="input" value={end} onChange={(e)=>setEnd(e.target.value)} placeholder="End (MM/YYYY or Present)" />

          <textarea
            className="input"
            style={{minHeight:120, gridColumn:"1 / -1"}}
            value={desc}
            onChange={(e)=>setDesc(e.target.value)}
            placeholder="Role summary + impact notes. Tip: use action verbs, add metrics (%, #, $)."
          />
        </div>

        <div style={{display:"flex", gap:8, marginTop:12}}>
          {/* Placeholder for an AI bullets API later */}
          {/* <button className="button" onClick={generateBullets}>Generate bullets</button> */}
          <button className="button" onClick={copy}>Copy section</button>
        </div>

        <div className="preview" style={{marginTop:12, whiteSpace:"pre-wrap"}}>
          <div><strong>Target role:</strong> {targetRole || "—"} • <strong>Layout:</strong> {layout}</div>
          <div style={{marginTop:8}} />
          {sectionText}
        </div>
      </div>
    </main>
  );
}
