// pages/index.js
import { useState } from "react";

/** ---------- Helper: build a single string for the model ---------- */
function buildResumeTextFromSections(sections) {
  if (!sections) return "";

  const lines = [];

  // Work Experience
  if (sections.experience?.length) {
    lines.push("## Work Experience");
    sections.experience.forEach((w, i) => {
      lines.push(
        `- ${w.org || "Organisation"} — ${w.role || "Role"} (${w.city || ""}${
          w.country ? (w.city ? ", " : "") + w.country : ""
        })`
      );
      lines.push(
        `  Duration: ${w.start || "??"} – ${w.end || "Present"}${
          w.length ? ` (${w.length})` : ""
        }`
      );
      if (w.salary) lines.push(`  Last drawn salary: ${w.salary}`);
      if (w.reason) lines.push(`  Reason for leaving: ${w.reason}`);
      if (w.desc) lines.push(`  Description: ${w.desc}`);
      if (w.achievements) lines.push(`  Achievements: ${w.achievements}`);
      lines.push("");
    });
  }

  // Education
  if (sections.education?.length) {
    lines.push("## Education");
    sections.education.forEach((e) => {
      lines.push(
        `- ${e.school || "School/University"} — ${e.qualification || ""}${
          e.level ? ` (${e.level})` : ""
        }`
      );
      lines.push(
        `  Location: ${e.city || ""}${e.country ? (e.city ? ", " : "") + e.country : ""}`
      );
      if (e.gradYear) lines.push(`  Graduation year: ${e.gradYear}`);
      if (e.coursework) lines.push(`  Coursework/Honours: ${e.coursework}`);
      lines.push("");
    });
  }

  // Certifications
  if (sections.certs?.length) {
    lines.push("## Certifications");
    sections.certs.forEach((c) => {
      lines.push(
        `- ${c.name || "Certificate"} — ${c.issuer || ""}${
          c.year ? ` (${c.year})` : ""
        }${c.id ? `, ID/URL: ${c.id}` : ""}`
      );
    });
    lines.push("");
  }

  // Skills
  if (
    sections.skills?.tech ||
    sections.skills?.tools ||
    sections.skills?.languages ||
    sections.skills?.soft
  ) {
    lines.push("## Skills");
    if (sections.skills.tech) lines.push(`- Technical: ${sections.skills.tech}`);
    if (sections.skills.tools) lines.push(`- Tools/Frameworks: ${sections.skills.tools}`);
    if (sections.skills.languages)
      lines.push(`- Languages: ${sections.skills.languages}`);
    if (sections.skills.soft) lines.push(`- Soft skills: ${sections.skills.soft}`);
    lines.push("");
  }

  // Projects
  if (sections.projects?.length) {
    lines.push("## Projects");
    sections.projects.forEach((p) => {
      lines.push(`- ${p.name || "Project"} — ${p.role || ""}`);
      if (p.desc) lines.push(`  Description: ${p.desc}`);
      if (p.outcomes) lines.push(`  Outcomes/Metrics: ${p.outcomes}`);
      if (p.link) lines.push(`  Link: ${p.link}`);
      lines.push("");
    });
  }

  // Referees
  if (sections.referees?.length) {
    lines.push("## Referees");
    sections.referees.forEach((r) => {
      lines.push(
        `- ${r.name || "Name"} — ${r.title || ""}${
          r.org ? `, ${r.org}` : ""
        }${r.email ? `, ${r.email}` : ""}${r.phone ? `, ${r.phone}` : ""}`
      );
    });
    lines.push("");
  }

  // Hobbies
  if (sections.hobbies) {
    lines.push("## Hobbies / Interests");
    lines.push(sections.hobbies);
    lines.push("");
  }

  return lines.join("\n");
}

/** ---------- Tabs UI for structured résumé input ---------- */
function ResumeSections({ onChange }) {
  const [active, setActive] = useState("work");
  const [experience, setExperience] = useState([{ org: "", role: "", city: "", country: "", start: "", end: "", length: "", salary: "", reason: "", desc: "", achievements: "" }]);
  const [education, setEducation] = useState([{ school: "", country: "", city: "", level: "", qualification: "", gradYear: "", coursework: "" }]);
  const [certs, setCerts] = useState([{ name: "", issuer: "", year: "", id: "" }]);
  const [skills, setSkills] = useState({ tech: "", tools: "", languages: "", soft: "" });
  const [projects, setProjects] = useState([{ name: "", role: "", desc: "", outcomes: "", link: "" }]);
  const [referees, setReferees] = useState([{ name: "", title: "", org: "", email: "", phone: "" }]);
  const [hobbies, setHobbies] = useState("");

  // notify parent
  const emit = () => {
    onChange?.({
      experience,
      education,
      certs,
      skills,
      projects,
      referees,
      hobbies,
    });
  };

  // small helpers for repeaters
  const addRow = (setter, shape) => setter((prev) => [...prev, { ...shape }]);
  const updateRow = (setter, list, idx, field, value) =>
    setter(list.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  const removeRow = (setter, list, idx) => setter(list.filter((_, i) => i !== idx));

  // effect-ish: call emit when anything changes
  const signal = () =>
    emit();

  // call emit when any field changes (delay until user action)
  // simplest approach: call emit on every blur/change where it matters.

  return (
    <div className="sections">
      {/* Tabs */}
      <div className="tabs">
        {[
          ["work", "Work Experience"],
          ["edu", "Education"],
          ["certs", "Certifications"],
          ["skills", "Skills"],
          ["proj", "Projects"],
          ["refs", "Referees"],
          ["hobbies", "Hobbies"],
        ].map(([key, label]) => (
          <button
            type="button"
            key={key}
            className={active === key ? "tab active" : "tab"}
            onClick={() => setActive(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="panel">

        {/* Work Experience */}
        {active === "work" && (
          <div className="group">
            <div className="groupHeader">
              Add roles. Include org, role, location, dates, salary (optional), reason for leaving (optional), description and achievements.
            </div>
            {experience.map((w, idx) => (
              <div key={idx} className="card">
                <div className="row">
                  <input
                    placeholder="Organisation"
                    value={w.org}
                    onChange={(e) => {
                      updateRow(setExperience, experience, idx, "org", e.target.value);
                      signal();
                    }}
                  />
                  <input
                    placeholder="Position / Role"
                    value={w.role}
                    onChange={(e) => {
                      updateRow(setExperience, experience, idx, "role", e.target.value);
                      signal();
                    }}
                  />
                </div>
                <div className="row">
                  <input
                    placeholder="City"
                    value={w.city}
                    onChange={(e) => {
                      updateRow(setExperience, experience, idx, "city", e.target.value);
                      signal();
                    }}
                  />
                  <input
                    placeholder="Country"
                    value={w.country}
                    onChange={(e) => {
                      updateRow(setExperience, experience, idx, "country", e.target.value);
                      signal();
                    }}
                  />
                </div>
                <div className="row">
                  <input
                    placeholder="Start (MM/YYYY)"
                    value={w.start}
                    onChange={(e) => {
                      updateRow(setExperience, experience, idx, "start", e.target.value);
                      signal();
                    }}
                  />
                  <input
                    placeholder="End (MM/YYYY or Present)"
                    value={w.end}
                    onChange={(e) => {
                      updateRow(setExperience, experience, idx, "end", e.target.value);
                      signal();
                    }}
                  />
                  <input
                    placeholder="Length (e.g., 2y 3m)"
                    value={w.length}
                    onChange={(e) => {
                      updateRow(setExperience, experience, idx, "length", e.target.value);
                      signal();
                    }}
                  />
                </div>
                <div className="row">
                  <input
                    placeholder="Last drawn salary (optional)"
                    value={w.salary}
                    onChange={(e) => {
                      updateRow(setExperience, experience, idx, "salary", e.target.value);
                      signal();
                    }}
                  />
                  <input
                    placeholder="Reason for leaving (optional)"
                    value={w.reason}
                    onChange={(e) => {
                      updateRow(setExperience, experience, idx, "reason", e.target.value);
                      signal();
                    }}
                  />
                </div>
                <textarea
                  placeholder="Job description / responsibilities"
                  value={w.desc}
                  onChange={(e) => {
                    updateRow(setExperience, experience, idx, "desc", e.target.value);
                    signal();
                  }}
                />
                <textarea
                  placeholder="Key achievements (numbers help!)"
                  value={w.achievements}
                  onChange={(e) => {
                    updateRow(setExperience, experience, idx, "achievements", e.target.value);
                    signal();
                  }}
                />
                <div className="row end">
                  {experience.length > 1 && (
                    <button
                      type="button"
                      className="link danger"
                      onClick={() => {
                        removeRow(setExperience, experience, idx);
                        signal();
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              className="link"
              onClick={() => {
                addRow(setExperience, {
                  org: "",
                  role: "",
                  city: "",
                  country: "",
                  start: "",
                  end: "",
                  length: "",
                  salary: "",
                  reason: "",
                  desc: "",
                  achievements: "",
                });
                signal();
              }}
            >
              + Add another role
            </button>
          </div>
        )}

        {/* Education */}
        {active === "edu" && (
          <div className="group">
            {education.map((e, idx) => (
              <div key={idx} className="card">
                <div className="row">
                  <input
                    placeholder="School / University"
                    value={e.school}
                    onChange={(ev) => {
                      updateRow(setEducation, education, idx, "school", ev.target.value);
                      signal();
                    }}
                  />
                </div>
                <div className="row">
                  <input
                    placeholder="Country"
                    value={e.country}
                    onChange={(ev) => {
                      updateRow(setEducation, education, idx, "country", ev.target.value);
                      signal();
                    }}
                  />
                  <input
                    placeholder="City"
                    value={e.city}
                    onChange={(ev) => {
                      updateRow(setEducation, education, idx, "city", ev.target.value);
                      signal();
                    }}
                  />
                </div>
                <div className="row">
                  <input
                    placeholder="Qualification level (e.g., Bachelor's, Diploma)"
                    value={e.level}
                    onChange={(ev) => {
                      updateRow(setEducation, education, idx, "level", ev.target.value);
                      signal();
                    }}
                  />
                  <input
                    placeholder="Qualification (e.g., BSc Computer Science)"
                    value={e.qualification}
                    onChange={(ev) => {
                      updateRow(setEducation, education, idx, "qualification", ev.target.value);
                      signal();
                    }}
                  />
                </div>
                <div className="row">
                  <input
                    placeholder="Graduation year"
                    value={e.gradYear}
                    onChange={(ev) => {
                      updateRow(setEducation, education, idx, "gradYear", ev.target.value);
                      signal();
                    }}
                  />
                </div>
                <textarea
                  placeholder="Notable coursework / honours"
                  value={e.coursework}
                  onChange={(ev) => {
                    updateRow(setEducation, education, idx, "coursework", ev.target.value);
                    signal();
                  }}
                />
                <div className="row end">
                  {education.length > 1 && (
                    <button
                      type="button"
                      className="link danger"
                      onClick={() => {
                        removeRow(setEducation, education, idx);
                        signal();
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              className="link"
              onClick={() => {
                addRow(setEducation, {
                  school: "",
                  country: "",
                  city: "",
                  level: "",
                  qualification: "",
                  gradYear: "",
                  coursework: "",
                });
                signal();
              }}
            >
              + Add another education
            </button>
          </div>
        )}

        {/* Certifications */}
        {active === "certs" && (
          <div className="group">
            {certs.map((c, idx) => (
              <div key={idx} className="card">
                <div className="row">
                  <input
                    placeholder="Certification name"
                    value={c.name}
                    onChange={(e) => {
                      updateRow(setCerts, certs, idx, "name", e.target.value);
                      signal();
                    }}
                  />
                  <input
                    placeholder="Issuer"
                    value={c.issuer}
                    onChange={(e) => {
                      updateRow(setCerts, certs, idx, "issuer", e.target.value);
                      signal();
                    }}
                  />
                </div>
                <div className="row">
                  <input
                    placeholder="Year"
                    value={c.year}
                    onChange={(e) => {
                      updateRow(setCerts, certs, idx, "year", e.target.value);
                      signal();
                    }}
                  />
                  <input
                    placeholder="Credential ID/URL (optional)"
                    value={c.id}
                    onChange={(e) => {
                      updateRow(setCerts, certs, idx, "id", e.target.value);
                      signal();
                    }}
                  />
                </div>
                <div className="row end">
                  {certs.length > 1 && (
                    <button
                      type="button"
                      className="link danger"
                      onClick={() => {
                        removeRow(setCerts, certs, idx);
                        signal();
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              className="link"
              onClick={() => {
                addRow(setCerts, { name: "", issuer: "", year: "", id: "" });
                signal();
              }}
            >
              + Add another certification
            </button>
          </div>
        )}

        {/* Skills */}
        {active === "skills" && (
          <div className="group">
            <div className="row">
              <input
                placeholder="Technical skills"
                value={skills.tech}
                onChange={(e) => {
                  setSkills((s) => ({ ...s, tech: e.target.value }));
                  signal();
                }}
              />
            </div>
            <div className="row">
              <input
                placeholder="Tools / frameworks"
                value={skills.tools}
                onChange={(e) => {
                  setSkills((s) => ({ ...s, tools: e.target.value }));
                  signal();
                }}
              />
            </div>
            <div className="row">
              <input
                placeholder="Languages (programming/human)"
                value={skills.languages}
                onChange={(e) => {
                  setSkills((s) => ({ ...s, languages: e.target.value }));
                  signal();
                }}
              />
            </div>
            <div className="row">
              <input
                placeholder="Soft skills"
                value={skills.soft}
                onChange={(e) => {
                  setSkills((s) => ({ ...s, soft: e.target.value }));
                  signal();
                }}
              />
            </div>
          </div>
        )}

        {/* Projects */}
        {active === "proj" && (
          <div className="group">
            {projects.map((p, idx) => (
              <div key={idx} className="card">
                <div className="row">
                  <input
                    placeholder="Project name"
                    value={p.name}
                    onChange={(e) => {
                      updateRow(setProjects, projects, idx, "name", e.target.value);
                      signal();
                    }}
                  />
                  <input
                    placeholder="Your role"
                    value={p.role}
                    onChange={(e) => {
                      updateRow(setProjects, projects, idx, "role", e.target.value);
                      signal();
                    }}
                  />
                </div>
                <textarea
                  placeholder="Brief description"
                  value={p.desc}
                  onChange={(e) => {
                    updateRow(setProjects, projects, idx, "desc", e.target.value);
                    signal();
                  }}
                />
                <input
                  placeholder="Outcomes / metrics (optional)"
                  value={p.outcomes}
                  onChange={(e) => {
                    updateRow(setProjects, projects, idx, "outcomes", e.target.value);
                    signal();
                  }}
                />
                <input
                  placeholder="Link (optional)"
                  value={p.link}
                  onChange={(e) => {
                    updateRow(setProjects, projects, idx, "link", e.target.value);
                    signal();
                  }}
                />
                <div className="row end">
                  {projects.length > 1 && (
                    <button
                      type="button"
                      className="link danger"
                      onClick={() => {
                        removeRow(setProjects, projects, idx);
                        signal();
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              className="link"
              onClick={() => {
                addRow(setProjects, { name: "", role: "", desc: "", outcomes: "", link: "" });
                signal();
              }}
            >
              + Add another project
            </button>
          </div>
        )}

        {/* Referees */}
        {active === "refs" && (
          <div className="group">
            {referees.map((r, idx) => (
              <div key={idx} className="card">
                <div className="row">
                  <input
                    placeholder="Name"
                    value={r.name}
                    onChange={(e) => {
                      updateRow(setReferees, referees, idx, "name", e.target.value);
                      signal();
                    }}
                  />
                  <input
                    placeholder="Title"
                    value={r.title}
                    onChange={(e) => {
                      updateRow(setReferees, referees, idx, "title", e.target.value);
                      signal();
                    }}
                  />
                </div>
                <div className="row">
                  <input
                    placeholder="Organisation"
                    value={r.org}
                    onChange={(e) => {
                      updateRow(setReferees, referees, idx, "org", e.target.value);
                      signal();
                    }}
                  />
                </div>
                <div className="row">
                  <input
                    placeholder="Email (optional)"
                    value={r.email}
                    onChange={(e) => {
                      updateRow(setReferees, referees, idx, "email", e.target.value);
                      signal();
                    }}
                  />
                  <input
                    placeholder="Phone (optional)"
                    value={r.phone}
                    onChange={(e) => {
                      updateRow(setReferees, referees, idx, "phone", e.target.value);
                      signal();
                    }}
                  />
                </div>
                <div className="row end">
                  {referees.length > 1 && (
                    <button
                      type="button"
                      className="link danger"
                      onClick={() => {
                        removeRow(setReferees, referees, idx);
                        signal();
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              className="link"
              onClick={() => {
                addRow(setReferees, { name: "", title: "", org: "", email: "", phone: "" });
                signal();
              }}
            >
              + Add another referee
            </button>
          </div>
        )}

        {/* Hobbies */}
        {active === "hobbies" && (
          <div className="group">
            <textarea
              placeholder="What do you enjoy in your free time? (optional)"
              value={hobbies}
              onChange={(e) => {
                setHobbies(e.target.value);
                signal();
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        .sections {
          margin-top: 12px;
        }
        .tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }
        .tab {
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #fff;
          cursor: pointer;
          font-size: 14px;
        }
        .tab.active {
          background: #111827;
          color: #fff;
          border-color: #111827;
        }
        .panel {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
          background: #fafafa;
        }
        .groupHeader {
          font-size: 14px;
          color: #4b5563;
          margin-bottom: 8px;
        }
        .card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px;
          margin-bottom: 10px;
        }
        .row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 8px;
        }
        .row.end {
          display: flex;
          justify-content: flex-end;
        }
        input, textarea, select {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 14px;
          background: #fff;
        }
        textarea {
          min-height: 80px;
          resize: vertical;
        }
        .link {
          background: transparent;
          color: #0f766e;
          border: none;
          cursor: pointer;
          padding: 4px 0;
        }
        .link.danger {
          color: #b91c1c;
        }
      `}</style>
    </div>
  );
}

/** ---------------- Main Page ---------------- */
export default function Home() {
  const [jobRole, setJobRole] = useState("");
  const [layout, setLayout] = useState("Academic CV");
  const [tone, setTone] = useState(""); // optional, in advanced section
  const [showTone, setShowTone] = useState(false);

  const [sections, setSections] = useState(null);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSectionsChange = (data) => setSections(data);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOutput("");
    setLoading(true);

    try {
      const resumeText = buildResumeTextFromSections(sections);
      const userPrompt =
        `Job role: ${jobRole || "N/A"}\nDesired layout: ${layout}\n` +
        (tone ? `Desired tone: ${tone}\n` : "") +
        `\nResume details:\n${resumeText || "(User did not provide structured sections yet)"}`;

      // Send BOTH shapes so your /api/chat can accept either
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRole,
          layout,
          tone,
          resumeText, // classic shape
          // "messages" shape (for APIs that expect OpenAI-style messages)
          messages: [
            {
              role: "system",
              content:
                "You are a helpful résumé assistant. Rewrite and restructure the user's résumé based on the supplied job role and desired layout. Keep content truthful, emphasize results and clarity.",
            },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Request failed");
      }
      const data = await res.json();
      // Try common fields from various API implementations
      const content =
        data.output ||
        data.result ||
        data.text ||
        data.message ||
        (Array.isArray(data.choices) && data.choices[0]?.message?.content) ||
        "";
      setOutput(content || "(No content returned)");
    } catch (err) {
      setError(
        err?.message?.includes("quota")
          ? "OpenAI quota/billing error — please check plan/billing."
          : err?.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>
        <span className="brand">AmplyAI</span> — Resume Helper
      </h1>

      <form className="form" onSubmit={handleSubmit}>
        {/* Job Role */}
        <label className="label">
          Job role you’re applying for
          <input
            type="text"
            placeholder="e.g., Software Engineer, Marketing Manager, Registered Nurse"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
          />
        </label>

        {/* Desired Layout */}
        <label className="label">
          Desired layout
          <select value={layout} onChange={(e) => setLayout(e.target.value)}>
            <option>Academic CV</option>
            <option>ATS-friendly</option>
            <option>Modern</option>
            <option>Minimal</option>
            <option>Creative Portfolio</option>
          </select>
        </label>
        <small className="hint">
          Research, publications, conferences, teaching, grants (Academic CV), or pick ATS/Modern/Minimal for job apps.
        </small>

        {/* Advanced: Tone */}
        <div className="advanced">
          <button
            type="button"
            className="disclosure"
            onClick={() => setShowTone((s) => !s)}
          >
            {showTone ? "▼" : "▶"} Advanced (optional): Tone
          </button>
          {showTone && (
            <div className="advancedBody">
              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="">None</option>
                <option>Professional</option>
                <option>Confident</option>
                <option>Concise</option>
                <option>Friendly</option>
                <option>Executive</option>
              </select>
            </div>
          )}
        </div>

        {/* New: Structured Sections (Tabs) */}
        <ResumeSections onChange={onSectionsChange} />

        {/* Submit */}
        <button type="submit" disabled={loading}>
          {loading ? "Rewriting…" : "Rewrite my resume"}
        </button>

        {/* Output / Error */}
        {error && <div className="error">{error}</div>}
        {output && (
          <pre className="output">
            {output}
          </pre>
        )}

        <p className="tip">
          Tip: upload picture & fonts later (export to Word/PDF), we’ll add that
          after we finalize the flow.
        </p>
      </form>

      <style jsx>{`
        main {
          max-width: 900px;
          margin: 30px auto 80px auto;
          padding: 0 16px;
        }
        h1 {
          font-size: 36px;
          line-height: 1.2;
          letter-spacing: -0.01em;
          margin: 0 0 18px 0;
        }
        .brand {
          color: #0f766e;
          font-weight: 700;
        }
        .form {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 16px;
        }
        .label {
          display: block;
          font-weight: 600;
          margin: 14px 0 6px;
        }
        input, select, textarea, button {
          font-size: 15px;
        }
        input, select, textarea {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 10px 12px;
          background: #fff;
        }
        .hint {
          color: #6b7280;
          display: block;
          margin-top: 4px;
          margin-bottom: 10px;
        }
        .advanced {
          margin: 14px 0;
        }
        .disclosure {
          background: transparent;
          border: none;
          cursor: pointer;
          font-weight: 600;
          padding: 6px 0;
        }
        .advancedBody {
          margin-top: 8px;
        }
        button[type="submit"] {
          margin-top: 14px;
          width: 100%;
          padding: 12px 16px;
          background: #111827;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }
        button[disabled] {
          opacity: 0.7;
          cursor: default;
        }
        .error {
          margin-top: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
        }
        .output {
          margin-top: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          border-radius: 10px;
          padding: 12px;
          white-space: pre-wrap;
        }
        .tip {
          color: #6b7280;
          font-size: 14px;
          margin-top: 8px;
        }
      `}</style>
    </main>
  );
}
