// pages/hire-helper.jsx
import Link from "next/link";
import { useState } from "react";

export default function HireHelper(){
  const [role, setRole] = useState("");
  const [layout, setLayout] = useState("Modern / Minimal");
  const [org, setOrg] = useState("");
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [desc, setDesc] = useState("");

  return (
    <main className="app">
      <div className="backbar">
        <Link href="/">← Back to Progress Partner</Link>
        <Link className="pill-link" href="/email">MailMate</Link>
        <Link className="pill-link" href="/planner">Planner</Link>
      </div>

      <div className="page">
        <h2 className="section-title">AmplyAI — HireHelper</h2>

        <div style={{marginBottom:12, color:"var(--muted)"}}>
          Job role you’re applying for & layout preference.
        </div>

        <div className="grid">
          <input
            type="text"
            placeholder="e.g., Software Engineer, Marketing Manager"
            value={role}
            onChange={(e)=>setRole(e.target.value)}
          />
          <select value={layout} onChange={(e)=>setLayout(e.target.value)}>
            <option>Modern / Minimal</option>
            <option>ATS / Compact</option>
            <option>Academic CV</option>
          </select>

          <div className="full" style={{marginTop:8, color:"var(--muted)"}}>
            Add roles below. Include org, role, location, dates, and achievements.
          </div>

          <input placeholder="Organisation" value={org} onChange={(e)=>setOrg(e.target.value)} />
          <input placeholder="Position / Role" value={title} onChange={(e)=>setTitle(e.target.value)} />
          <input placeholder="City" value={city} onChange={(e)=>setCity(e.target.value)} />
          <input placeholder="Country" value={country} onChange={(e)=>setCountry(e.target.value)} />
          <input type="text" placeholder="Start (MM/YYYY)" value={start} onChange={(e)=>setStart(e.target.value)} />
          <input type="text" placeholder="End (MM/YYYY or Present)" value={end} onChange={(e)=>setEnd(e.target.value)} />
          <textarea className="full" placeholder="Job description / responsibilities" value={desc} onChange={(e)=>setDesc(e.target.value)} />
        </div>

        <div style={{marginTop:16}} className="preview">
          <div><strong>Target role:</strong> {role || "—"} • <strong>Layout:</strong> {layout}</div>
          <div style={{marginTop:8}}>
            <strong>Experience:</strong> {org ? `${org} — ${title || ""}` : "—"}
            { (city || country) ? ` (${[city, country].filter(Boolean).join(", ")})` : "" }
            { (start || end) ? ` • ${[start,end].filter(Boolean).join(" — ")}` : "" }
          </div>
          <div style={{whiteSpace:"pre-wrap"}}>{desc}</div>
          <div style={{color:"var(--muted)", marginTop:10}}>
            (Export and polish via your resume builder flow.)
          </div>
        </div>
      </div>
    </main>
  );
}
