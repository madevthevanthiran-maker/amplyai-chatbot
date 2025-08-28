// pages/index.js
import { useState, useMemo } from "react";

export default function Home() {
  const [jobRole, setJobRole] = useState("");
  const [layout, setLayout] = useState("chronological");
  const [tone, setTone] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState("");

  const layoutOptions = useMemo(
    () => [
      {
        value: "chronological",
        label: "Chronological (standard)",
        blurb:
          "Most common. Work experience listed from most recent. Great if you have consistent experience."
      },
      {
        value: "functional",
        label: "Functional / Skills-based",
        blurb:
          "Highlights skill groups before employment history. Good for career pivots or limited experience."
      },
      {
        value: "combination",
        label: "Combination (skills + chronology)",
        blurb:
          "Top skills summary + detailed work history. Nice balance for experienced candidates."
      },
      {
        value: "academic_cv",
        label: "Academic CV",
        blurb:
          "Research, publications, conferences, teaching, grants. Use for academic roles."
      }
    ],
    []
  );

  const currentLayoutBlurb = useMemo(
    () => layoutOptions.find((o) => o.value === layout)?.blurb || "",
    [layout, layoutOptions]
  );

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOutput("");
    if (!jobRole.trim() || !resumeText.trim()) {
      setError("Please enter the job role and provide some resume content.");
      return;
    }
    setLoading(true);

    try {
      // Update your /api/chat to read `layout` and (optionally) `tone`.
      // Example server-side shape you can expect:
      // { job_role, layout, tone (optional), resume_text }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_role: jobRole,
          layout,
          // only include tone if user chose one
          ...(tone ? { tone } : {}),
          resume_text: resumeText
        })
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Request failed");
      }
      const data = await res.json().catch(() => null);
      // Support either {result: "..."} JSON or raw text
      const text = data?.result ?? (await res.text());
      setOutput(text || "No content returned.");
    } catch (err) {
      setError(
        err?.message ||
          "Something went wrong. Please try again or check server logs."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <main className="container">
        <h1 className="title">AmplyAI — Resume Helper</h1>
        <p className="subtitle">
          Paste your resume, choose a layout, and tell me the job role. I’ll
          restructure and improve it.
        </p>

        <form onSubmit={onSubmit} className="card">
          {/* Job role */}
          <label className="label">Job role you’re applying for</label>
          <input
            className="input"
            placeholder="e.g., Software Engineer, Marketing Manager, Registered Nurse"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
          />

          {/* Desired layout (primary) */}
          <div className="row">
            <div className="col">
              <label className="label">Desired layout</label>
              <select
                className="input"
                value={layout}
                onChange={(e) => setLayout(e.target.value)}
              >
                {layoutOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Layout blurb */}
          <p className="hint">{currentLayoutBlurb}</p>

          {/* Optional: Tone (advanced) */}
          <details
            className="details"
            open={showAdvanced}
            onToggle={(e) => setShowAdvanced(e.currentTarget.open)}
          >
            <summary className="detailsSummary">Advanced (optional): Tone</summary>
            <p className="hint">
              Choose a writing tone if you want the output to “sound” a certain
              way. Otherwise I’ll default to clear, professional language.
            </p>
            <select
              className="input inline"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="">No specific tone</option>
              <option value="professional">Professional</option>
              <option value="confident">Confident</option>
              <option value="concise">Concise</option>
              <option value="friendly">Friendly</option>
            </select>
          </details>

          {/* Resume text */}
          <label className="label withTop">Current resume text</label>
          <textarea
            className="textarea"
            rows={14}
            placeholder={`Paste the section you want improved…

To get the best result, include as much as you can from the following:

• Work Experience — organisation names, city/country, position held, last drawn salary (optional), key responsibilities, quantifiable achievements, length of employment (MM/YYYY – MM/YYYY), reason for leaving (optional)
• Education — school/college/university, program/degree, graduation year, notable coursework/honours
• Certifications — name, issuer, year, credential ID/url (if any)
• Skills — technical, tools, frameworks, languages, soft skills
• Projects — name, brief description, role, outcomes/metrics, link (optional)
• Awards — name, issuer, year
• Referees — name, title, organisation, email/phone (share only if you’re comfortable)
• Hobbies / Interests — what you enjoy in your free time (optional)

If you don’t have some of these, leave them out. I’ll keep placeholders or structure around what you provide.`}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />

          {/* Actions */}
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Rewriting…" : "Rewrite my resume"}
          </button>

          {/* Errors */}
          {error ? <div className="error">{error}</div> : null}
        </form>

        {/* Output */}
        {output && (
          <div className="card output">
            <pre className="pre">{output}</pre>
          </div>
        )}

        <p className="tinyTip">
          Tip: You can change the layout above to switch between chronological,
          functional, or combination structures without retyping your content.
        </p>
      </main>

      <style jsx>{`
        .page {
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
        }
        .container {
          max-width: 960px;
          margin: 0 auto;
        }
        .title {
          margin: 0 0 4px;
          font-size: 36px;
          letter-spacing: 0.2px;
        }
        .subtitle {
          margin: 0 0 24px;
          color: #475569;
        }
        .card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
          margin-bottom: 16px;
        }
        .label {
          font-weight: 600;
          margin: 14px 0 8px;
          display: block;
        }
        .withTop {
          margin-top: 18px;
        }
        .input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          background: #fff;
          outline: none;
        }
        .input:focus,
        .textarea:focus,
        .inline:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
        .textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          resize: vertical;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          line-height: 1.45;
          background: #fff;
        }
        .row {
          display: flex;
          gap: 12px;
        }
        .col {
          flex: 1;
        }
        .hint {
          color: #64748b;
          margin: 8px 2px 12px;
          font-size: 14px;
        }
        .details {
          margin: 6px 0 10px;
          border: 1px dashed #e2e8f0;
          border-radius: 10px;
          padding: 10px 12px;
          background: #fafafa;
        }
        .detailsSummary {
          cursor: pointer;
          font-weight: 600;
        }
        .inline {
          max-width: 320px;
        }
        .button {
          width: 100%;
          margin-top: 14px;
          padding: 12px 16px;
          border: none;
          border-radius: 12px;
          background: #111827;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
        }
        .button[disabled] {
          opacity: 0.7;
          cursor: default;
        }
        .error {
          margin-top: 10px;
          padding: 10px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          border-radius: 10px;
          font-size: 14px;
        }
        .output {
          white-space: pre-wrap;
        }
        .pre {
          margin: 0;
          white-space: pre-wrap;
        }
        .tinyTip {
          color: #64748b;
          font-size: 13px;
          margin-top: 6px;
        }
      `}</style>
    </div>
  );
}
