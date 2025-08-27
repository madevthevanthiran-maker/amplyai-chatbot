// pages/resume-builder.js
import { useEffect, useMemo, useState } from "react";

// ---------- Helpers ----------
const emptyWork = () => ({
  org: "", title: "", salary: "", start: "", end: "", desc: "", reason: ""
});
const emptyEdu = () => ({
  school: "", degree: "", field: "", start: "", end: "", notes: ""
});
const emptyCert = () => ({ name: "", issuer: "", date: "", expiry: "" });
const emptyRef = () => ({ name: "", position: "", company: "", contact: "", relationship: "" });

const LAYOUTS = ["Classic", "Modern", "Minimal", "Creative"];
const FONTS = ["Calibri", "Roboto", "Open Sans", "Times New Roman"];

const STORAGE_KEY = "amplyai_resume_wizard_v1";

// ---------- Component ----------
export default function ResumeBuilder() {
  const [step, setStep] = useState(0);

  // Personal
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState(""); // base64 preview

  // Work (repeatable)
  const [work, setWork] = useState([emptyWork()]);

  // Education (repeatable)
  const [edu, setEdu] = useState([emptyEdu()]);

  // Certifications
  const [certs, setCerts] = useState([]);

  // Skills & Achievements
  const [skills, setSkills] = useState("");          // comma-separated tags or free text
  const [achievements, setAchievements] = useState(""); // free text

  // Referees (recommend at least 2)
  const [refs, setRefs] = useState([emptyRef(), emptyRef()]);

  // Extras
  const [hobbies, setHobbies] = useState("");
  const [languages, setLanguages] = useState("");

  // Layout settings
  const [layout, setLayout] = useState(LAYOUTS[0]);
  const [font, setFont] = useState(FONTS[0]);

  // Autosave/load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setFullName(data.fullName ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
        setAddress(data.address ?? "");
        setPhotoDataUrl(data.photoDataUrl ?? "");
        setWork(data.work?.length ? data.work : [emptyWork()]);
        setEdu(data.edu?.length ? data.edu : [emptyEdu()]);
        setCerts(data.certs ?? []);
        setSkills(data.skills ?? "");
        setAchievements(data.achievements ?? "");
        setRefs(data.refs?.length ? data.refs : [emptyRef(), emptyRef()]);
        setHobbies(data.hobbies ?? "");
        setLanguages(data.languages ?? "");
        setLayout(data.layout ?? LAYOUTS[0]);
        setFont(data.font ?? FONTS[0]);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const data = {
      fullName, email, phone, address, photoDataUrl,
      work, edu, certs, skills, achievements, refs,
      hobbies, languages, layout, font
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [fullName, email, phone, address, photoDataUrl, work, edu, certs, skills, achievements, refs, hobbies, languages, layout, font]);

  // Upload photo → base64 preview
  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  // Navigation
  const steps = [
    "Personal Info",
    "Work Experience",
    "Education",
    "Certifications",
    "Skills & Achievements",
    "Referees",
    "Extras",
    "Layout & Preview"
  ];
  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // Simple validation (can expand later)
  const canNext = useMemo(() => {
    if (step === 0) return !!fullName && !!email;
    if (step === 1) {
      // at least one work item with org or title
      return work.some(w => w.org || w.title || w.desc);
    }
    if (step === 5) {
      // refs, recommend 2 but allow empty to proceed
      return true;
    }
    return true;
  }, [step, fullName, email, work]);

  // Preview block (very light styling; will improve when we do layouts/export)
  const preview = (
    <div style={{
      fontFamily: font, lineHeight: 1.35, padding: 24, border: "1px solid #e5e7eb",
      borderRadius: 10, background: "#fff", color: "#111", maxWidth: 900
    }}>
      {/* Header */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
        {photoDataUrl ? (
          <img src={photoDataUrl} alt="profile" style={{ width: 80, height: 80, borderRadius: layout === "Classic" ? "8px" : "50%", objectFit: "cover" }}/>
        ) : null}
        <div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{fullName || "(Your Name)"}</div>
          <div style={{ color: "#374151" }}>
            {email || "(email)"} • {phone || "(phone)"}{address ? ` • ${address}` : ""}
          </div>
        </div>
      </div>

      {/* Work */}
      {work.some(w => w.org || w.title || w.desc) && (
        <section style={{ marginTop: 16 }}>
          <h3 style={{ margin: "8px 0" }}>Work Experience</h3>
          {work.map((w, i) => (
            (w.org || w.title || w.desc) ? (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}>
                  {w.title || "(Position)"} — {w.org || "(Organisation)"}
                </div>
                <div style={{ color: "#4b5563", fontSize: 13 }}>
                  {w.start || "(Start)"} – {w.end || "(End)"} {w.salary ? `• Last Salary: ${w.salary}` : ""}
                </div>
                {w.desc ? <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{w.desc}</div> : null}
                {w.reason ? <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>Reason for leaving: {w.reason}</div> : null}
              </div>
            ) : null
          ))}
        </section>
      )}

      {/* Education */}
      {edu.some(e => e.school || e.degree || e.field) && (
        <section style={{ marginTop: 16 }}>
          <h3 style={{ margin: "8px 0" }}>Education</h3>
          {edu.map((e, i) => (
            (e.school || e.degree || e.field) ? (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}>
                  {e.degree || "(Degree)"} — {e.school || "(Institution)"}
                </div>
                <div style={{ color: "#4b5563", fontSize: 13 }}>
                  {e.field || "(Field)"} • {e.start || "(Start)"} – {e.end || "(End)"}
                </div>
                {e.notes ? <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{e.notes}</div> : null}
              </div>
            ) : null
          ))}
        </section>
      )}

      {/* Certifications */}
      {certs.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <h3 style={{ margin: "8px 0" }}>Certifications</h3>
          {certs.map((c, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <strong>{c.name || "(Certification)"}</strong>
              {c.issuer ? ` — ${c.issuer}` : ""} {c.date ? `• ${c.date}` : ""} {c.expiry ? `• exp: ${c.expiry}` : ""}
            </div>
          ))}
        </section>
      )}

      {/* Skills & Achievements */}
      {(skills || achievements) && (
        <section style={{ marginTop: 16 }}>
          <h3 style={{ margin: "8px 0" }}>Skills & Achievements</h3>
          {skills ? <div><strong>Skills:</strong> {skills}</div> : null}
          {achievements ? <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{achievements}</div> : null}
        </section>
      )}

      {/* Referees */}
      {refs.some(r => r.name || r.contact) && (
        <section style={{ marginTop: 16 }}>
          <h3 style={{ margin: "8px 0" }}>Referees</h3>
          {refs.map((r, i) => (
            (r.name || r.contact) ? (
              <div key={i} style={{ marginBottom: 6 }}>
                <div><strong>{r.name || "(Name)"}</strong>{r.position ? ` — ${r.position}` : ""}{r.company ? ` @ ${r.company}` : ""}</div>
                <div style={{ color: "#4b5563", fontSize: 13 }}>
                  {r.contact || "(Email/Phone)"} {r.relationship ? `• ${r.relationship}` : ""}
                </div>
              </div>
            ) : null
          ))}
        </section>
      )}

      {/* Extras */}
      {(hobbies || languages) && (
        <section style={{ marginTop: 16 }}>
          <h3 style={{ margin: "8px 0" }}>Additional</h3>
          {hobbies ? <div><strong>Hobbies:</strong> {hobbies}</div> : null}
          {languages ? <div style={{ marginTop: 6 }}><strong>Languages:</strong> {languages}</div> : null}
        </section>
      )}
    </div>
  );

  // ---------- UI ----------
  return (
    <main style={{ maxWidth: 980, margin: "24px auto", padding: 16, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <h1 style={{ marginBottom: 6 }}>AmplyAI — Resume Builder (Wizard)</h1>
      <p style={{ color: "#555", marginTop: 0 }}>Step {step + 1} of {steps.length}: {steps[step]}</p>

      {/* Stepper */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0 20px" }}>
        {steps.map((label, i) => (
          <button key={i}
            onClick={() => setStep(i)}
            style={{
              padding: "6px 10px", borderRadius: 9999, border: "1px solid #ddd",
              background: i === step ? "#111" : "#fff", color: i === step ? "#fff" : "#111", cursor: "pointer"
            }}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {step === 0 && (
        <section style={card}>
          <label style={lbl}>Full Name<input style={inp} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g., Tan Wei Ming"/></label>
          <label style={lbl}>Email<input style={inp} value={email} onChange={e => setEmail(e.target.value)} placeholder="name@email.com"/></label>
          <label style={lbl}>Phone<input style={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+65 9xxx xxxx"/></label>
          <label style={lbl}>Address (optional)<input style={inp} value={address} onChange={e => setAddress(e.target.value)} placeholder="City, Country"/></label>
          <label style={lbl}>Professional Photo (optional)<input type="file" accept="image/*" onChange={onPhotoChange} /></label>
          {photoDataUrl ? <img src={photoDataUrl} alt="preview" style={{ width: 120, height: 120, borderRadius: 12, objectFit: "cover", marginTop: 8 }} /> : null}
        </section>
      )}

      {step === 1 && (
        <section style={card}>
          {work.map((w, idx) => (
            <div key={idx} style={{ border: "1px dashed #ddd", padding: 12, borderRadius: 10, marginBottom: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Role #{idx + 1}</div>
              <div style={grid2}>
                <label style={lbl}>Organisation<input style={inp} value={w.org} onChange={e => updateArr(setWork, work, idx, { org: e.target.value })}/></label>
                <label style={lbl}>Position Held<input style={inp} value={w.title} onChange={e => updateArr(setWork, work, idx, { title: e.target.value })}/></label>
              </div>
              <div style={grid3}>
                <label style={lbl}>Last Drawn Salary (optional)<input style={inp} value={w.salary} onChange={e => updateArr(setWork, work, idx, { salary: e.target.value })}/></label>
                <label style={lbl}>Start Date<input style={inp} value={w.start} onChange={e => updateArr(setWork, work, idx, { start: e.target.value })} placeholder="Jan 2022"/></label>
                <label style={lbl}>End Date<input style={inp} value={w.end} onChange={e => updateArr(setWork, work, idx, { end: e.target.value })} placeholder="Dec 2023 or Present"/></label>
              </div>
              <label style={lbl}>Job Description / Key Responsibilities<textarea style={txt} rows={5} value={w.desc} onChange={e => updateArr(setWork, work, idx, { desc: e.target.value })} placeholder="Bullets or short paragraph…"/></label>
              <label style={lbl}>Reason for Leaving (optional)<input style={inp} value={w.reason} onChange={e => updateArr(setWork, work, idx, { reason: e.target.value })}/></label>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setWork(prev => [...prev, emptyWork()])} style={btn}>+ Add another role</button>
                {work.length > 1 && <button type="button" onClick={() => removeAt(setWork, work, idx)} style={btnLight}>Remove</button>}
              </div>
            </div>
          ))}
        </section>
      )}

      {step === 2 && (
        <section style={card}>
          {edu.map((e, idx) => (
            <div key={idx} style={{ border: "1px dashed #ddd", padding: 12, borderRadius: 10, marginBottom: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Education #{idx + 1}</div>
              <div style={grid2}>
                <label style={lbl}>Institution<input style={inp} value={e.school} onChange={ev => updateArr(setEdu, edu, idx, { school: ev.target.value })}/></label>
                <label style={lbl}>Degree / Certificate<input style={inp} value={e.degree} onChange={ev => updateArr(setEdu, edu, idx, { degree: ev.target.value })}/></label>
              </div>
              <div style={grid2}>
                <label style={lbl}>Field of Study<input style={inp} value={e.field} onChange={ev => updateArr(setEdu, edu, idx, { field: ev.target.value })}/></label>
                <label style={lbl}>Dates<input style={inp} value={`${e.start} – ${e.end}`.trim()} onChange={ev => {
                  const v = ev.target.value; const [s="", , ed=""] = v.split("–");
                  updateArr(setEdu, edu, idx, { start: s.trim(), end: ed.trim() });
                }} placeholder="2019 – 2023"/></label>
              </div>
              <label style={lbl}>Achievements (optional)<textarea style={txt} rows={4} value={e.notes} onChange={ev => updateArr(setEdu, edu, idx, { notes: ev.target.value })}/></label>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setEdu(prev => [...prev, emptyEdu()])} style={btn}>+ Add another education</button>
                {edu.length > 1 && <button type="button" onClick={() => removeAt(setEdu, edu, idx)} style={btnLight}>Remove</button>}
              </div>
            </div>
          ))}
        </section>
      )}

      {step === 3 && (
        <section style={card}>
          {(certs.length ? certs : [emptyCert()]).map((c, idx) => (
            <div key={idx} style={{ border: "1px dashed #ddd", padding: 12, borderRadius: 10, marginBottom: 10 }}>
              <div style={grid3}>
                <label style={lbl}>Certification<input style={inp} value={c.name} onChange={e => updateArr(setCerts, certs, idx, { name: e.target.value }, true)}/></label>
                <label style={lbl}>Issuer<input style={inp} value={c.issuer} onChange={e => updateArr(setCerts, certs, idx, { issuer: e.target.value }, true)}/></label>
                <label style={lbl}>Date<input style={inp} value={c.date} onChange={e => updateArr(setCerts, certs, idx, { date: e.target.value }, true)}/></label>
              </div>
              <label style={lbl}>Expiry (optional)<input style={inp} value={c.expiry || ""} onChange={e => updateArr(setCerts, certs, idx, { expiry: e.target.value }, true)}/></label>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setCerts(prev => [...prev, emptyCert()])} style={btn}>+ Add certification</button>
                {certs.length > 0 && <button type="button" onClick={() => removeAt(setCerts, certs, idx)} style={btnLight}>Remove</button>}
              </div>
            </div>
          ))}
        </section>
      )}

      {step === 4 && (
        <section style={card}>
          <label style={lbl}>Skills (comma-separated or sentence)<input style={inp} value={skills} onChange={e => setSkills(e.target.value)} placeholder="Python, React, SQL, Docker"/></label>
          <label style={lbl}>Key Achievements<textarea style={txt} rows={6} value={achievements} onChange={e => setAchievements(e.target.value)} placeholder="Awards, impact statements, metrics…"/></label>
        </section>
      )}

      {step === 5 && (
        <section style={card}>
          {refs.map((r, idx) => (
            <div key={idx} style={{ border: "1px dashed #ddd", padding: 12, borderRadius: 10, marginBottom: 10 }}>
              <div style={grid2}>
                <label style={lbl}>Name<input style={inp} value={r.name} onChange={e => updateArr(setRefs, refs, idx, { name: e.target.value })}/></label>
                <label style={lbl}>Position<input style={inp} value={r.position} onChange={e => updateArr(setRefs, refs, idx, { position: e.target.value })}/></label>
              </div>
              <div style={grid2}>
                <label style={lbl}>Company<input style={inp} value={r.company} onChange={e => updateArr(setRefs, refs, idx, { company: e.target.value })}/></label>
                <label style={lbl}>Contact (email/phone)<input style={inp} value={r.contact} onChange={e => updateArr(setRefs, refs, idx, { contact: e.target.value })}/></label>
              </div>
              <label style={lbl}>Relationship<input style={inp} value={r.relationship} onChange={e => updateArr(setRefs, refs, idx, { relationship: e.target.value })}/></label>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setRefs(prev => [...prev, emptyRef()])} style={btn}>+ Add referee</button>
                {refs.length > 1 && <button type="button" onClick={() => removeAt(setRefs, refs, idx)} style={btnLight}>Remove</button>}
              </div>
            </div>
          ))}
          <div style={{ color: "#666", fontSize: 13 }}>Tip: Aim for at least two referees.</div>
        </section>
      )}

      {step === 6 && (
        <section style={card}>
          <label style={lbl}>Hobbies / Interests<textarea style={txt} rows={4} value={hobbies} onChange={e => setHobbies(e.target.value)} /></label>
          <label style={lbl}>Languages<textarea style={txt} rows={3} value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English (Fluent), Mandarin (Conversational)…"/></label>
        </section>
      )}

      {step === 7 && (
        <section style={{ display: "grid", gap: 16 }}>
          <div style={card}>
            <div style={grid2}>
              <label style={lbl}>Layout
                <select style={inp} value={layout} onChange={e => setLayout(e.target.value)}>
                  {LAYOUTS.map(l => <option key={l}>{l}</option>)}
                </select>
              </label>
              <label style={lbl}>Font
                <select style={inp} value={font} onChange={e => setFont(e.target.value)}>
                  {FONTS.map(f => <option key={f}>{f}</option>)}
                </select>
              </label>
            </div>
            <div style={{ color: "#666", fontSize: 13 }}>
              (Export to Word/PDF will be added in the next step. For now, copy from the preview.)
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>{preview}</div>
        </section>
      )}

      {/* Nav Buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={back} disabled={step === 0} style={btnLight}>Back</button>
        <button onClick={next} disabled={!canNext || step === steps.length - 1} style={btn}>Next</button>
      </div>
    </main>
  );
}

// ---------- tiny UI helpers ----------
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 };
const lbl = { display: "grid", gap: 6, marginBottom: 10, fontWeight: 600, fontSize: 14 };
const inp = { padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff" };
const txt = { ...inp, fontFamily: "inherit" };
const btn = { padding: "10px 14px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer" };
const btnLight = { padding: "10px 14px", borderRadius: 10, border: "1px solid #d1d5db", background: "#fff", color: "#111", cursor: "pointer" };
const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const grid3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 };

// array utilities
function updateArr(setter, arr, idx, patch, allowGrow = false) {
  const copy = arr.slice();
  if (allowGrow && idx >= copy.length) {
    // extend
    copy[idx] = patch;
  } else {
    copy[idx] = { ...copy[idx], ...patch };
  }
  setter(copy);
}
function removeAt(setter, arr, idx) {
  const copy = arr.slice();
  copy.splice(idx, 1);
  setter(copy);
}
