import { useState } from "react";

export default function Home() {
  const [jobRole, setJobRole] = useState("");
  const [tone, setTone] = useState("Professional");
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOutput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_role: jobRole,
          tone,
          resume_text: resumeText,
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Request failed: ${res.status}`);
      }

      const data = await res.json();
      // Expecting { text: "..." } from /api/chat
      setOutput(data.text ?? JSON.stringify(data));
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: 24,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      }}
    >
      <h1 style={{ marginBottom: 6 }}>AmplyAI — Resume Helper (DIY)</h1>
      <p style={{ color: "#666", marginTop: 0 }}>
        Paste your resume, pick a tone, and tell me the job role. I’ll rewrite it.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Job role you’re applying for</span>
          <input
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            placeholder="e.g., Product Manager"
            required
            style={{
              padding: "10px 12px",
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Desired tone</span>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          >
            <option>Professional</option>
            <option>Creative</option>
            <option>Friendly</option>
            <option>Straightforward</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Current resume text</span>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume here…"
            required
            rows={12}
            style={{
              padding: 12,
              border: "1px solid #ccc",
              borderRadius: 8,
              fontFamily: "inherit",
            }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 16px",
            border: "1px solid transparent",
            background: "#111",
            color: "#fff",
            borderRadius: 10,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Rewriting…" : "Rewrite my resume"}
        </button>
      </form>

      {error && (
        <div
          style={{
            marginTop: 18,
            padding: 12,
            background: "#ffe8e8",
            border: "1px solid #ffb3b3",
            borderRadius: 8,
            color: "#b10000",
          }}
        >
          {error}
        </div>
      )}

      {output && (
        <section style={{ marginTop: 24 }}>
          <h2>Improved Resume</h2>
          <textarea
            readOnly
            value={output}
            rows={14}
            style={{
              width: "100%",
              padding: 12,
              border: "1px solid #ccc",
              borderRadius: 8,
              fontFamily: "inherit",
            }}
          />
        </section>
      )}
    </main>
  );
}
