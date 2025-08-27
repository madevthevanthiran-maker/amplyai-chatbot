// pages/index.js
import { useState } from "react";

export default function Home() {
  const [jobRole, setJobRole] = useState("");
  const [tone, setTone] = useState("Professional");
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [output, setOutput] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setOutput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRole: jobRole.trim(),
          tone,
          resumeText: resumeText.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data?.error ||
            `Request failed with status ${res.status} ${res.statusText}`
        );
      }

      const data = await res.json();
      // Accept either { content: "..."} or { message: "..."} or raw text
      const text =
        data?.content || data?.message || (typeof data === "string" ? data : "");
      setOutput(text);
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "32px 20px 56px",
        lineHeight: 1.5,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      }}
    >
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
        AmplyAI — Resume Helper (DIY)
      </h1>
      <p style={{ marginBottom: 28, color: "#444" }}>
        Paste your resume, pick a tone, and tell me the job role. I’ll rewrite
        it.
      </p>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        {/* Job role */}
        <div style={{ marginBottom: 18 }}>
          <label
            htmlFor="job-role"
            style={{ display: "block", fontWeight: 700, marginBottom: 6 }}
          >
            Job role you’re applying for
          </label>
          <input
            id="job-role"
            type="text"
            placeholder="e.g., Software Engineer"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #ccc",
              outline: "none",
              fontSize: 16,
            }}
          />
        </div>

        {/* Desired tone */}
        <div style={{ marginBottom: 18 }}>
          <label
            htmlFor="tone"
            style={{ display: "block", fontWeight: 700, marginBottom: 6 }}
          >
            Desired tone
          </label>
          <select
            id="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #ccc",
              outline: "none",
              fontSize: 16,
              background: "#fff",
            }}
          >
            <option>Professional</option>
            <option>Friendly</option>
            <option>Confident</option>
            <option>Concise</option>
            <option>Creative</option>
            <option>Straightforward</option>
          </select>
        </div>

        {/* Current resume text + instruction block */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <label
              htmlFor="resume-text"
              style={{ fontWeight: 800, fontSize: 26 }}
            >
              Current resume text
            </label>
          </div>

          {/* Instruction block */}
          <div
            style={{
              marginTop: 8,
              marginBottom: 10,
              color: "#555",
              fontSize: 14,
              background: "#fafafa",
              border: "1px solid #eee",
              borderRadius: 10,
              padding: "10px 12px",
            }}
          >
            Please provide as much of the following as possible (you can paste
            an existing resume or type details):
            <ul style={{ marginTop: 6, marginBottom: 6, paddingLeft: 20 }}>
              <li>
                <strong>Work experience</strong> — organisation, position,
                last-drawn salary, job description, length of employment, reason
                for leaving
              </li>
              <li>
                <strong>Education</strong> — school, degree, field of study,
                dates, achievements
              </li>
              <li>
                <strong>Certifications</strong> — name, issuer, date/expiry
              </li>
              <li>
                <strong>Skills &amp; achievements</strong>
              </li>
              <li>
                <strong>Referees</strong> (at least 2) — name, position,
                company, contact, relationship
              </li>
              <li>
                <strong>Hobbies / Interests</strong>
              </li>
            </ul>
            If some sections don’t apply, feel free to leave them out.
          </div>

          <textarea
            id="resume-text"
            placeholder="Paste your current resume text or details here…"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            required
            style={{
              width: "100%",
              minHeight: 220,
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid #bbb",
              outline: "none",
              fontSize: 16,
              resize: "vertical",
              boxShadow:
                "inset 0 1px 0 rgba(0,0,0,0.03), 0 0 0 rgba(0,0,0,0)",
            }}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 18px",
            borderRadius: 12,
            border: "none",
            background: "#111",
            color: "#fff",
            fontSize: 18,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Rewriting…" : "Rewrite my resume"}
        </button>
      </form>

      {/* Error */}
      {errorMsg && (
        <div
          style={{
            background: "#ffecec",
            border: "1px solid #f5c2c7",
            color: "#b02a37",
            padding: "12px 14px",
            borderRadius: 10,
            marginTop: 12,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Output */}
      {output && (
        <div
          style={{
            marginTop: 18,
            background: "#f7f7f7",
            border: "1px solid #e5e5e5",
            padding: "18px 20px",
            borderRadius: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {output}
        </div>
      )}

      {/* Tiny tip */}
      <p style={{ marginTop: 20, color: "#777", fontSize: 13 }}>
        Tip: try tones like <em>Confident</em> or <em>Concise</em>, and be
        specific about the role (e.g., “Frontend Engineer (React)”, “Backend
        Engineer (Node)”, etc.).
      </p>
    </main>
  );
}
