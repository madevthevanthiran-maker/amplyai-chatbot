// pages/index.js

import { useState } from "react";

export default function Home() {
  const [jobRole, setJobRole] = useState("software engineer");
  const [tone, setTone] = useState("Professional");
  const [resumeText, setResumeText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setOutput("");

    // simple client-side validation that matches the server
    if (!jobRole || !tone || !resumeText) {
      setErrorMsg("Please fill in the job role, tone, and current resume text.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobRole,
          tone,
          resumeText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // if your API returns { error: "..." }
        setErrorMsg(data?.error || "Something went wrong.");
      } else if (data?.error) {
        setErrorMsg(data.error);
      } else {
        setOutput(data?.result || "");
      }
    } catch (err) {
      setErrorMsg(err?.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>
        AmplyAI — Resume Helper (DIY)
      </h1>
      <p style={{ color: "#444", marginBottom: 24 }}>
        Paste your resume, pick a tone, and tell me the job role. I’ll rewrite it.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Job Role */}
        <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
          Job role you’re applying for
        </label>
        <input
          type="text"
          value={jobRole}
          onChange={(e) => setJobRole(e.target.value)}
          placeholder="e.g., Software Engineer"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 18,
          }}
        />

        {/* Tone */}
        <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
          Desired tone
        </label>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 18,
          }}
        >
          <option>Professional</option>
          <option>Friendly</option>
          <option>Confident</option>
          <option>Concise</option>
          <option>Enthusiastic</option>
        </select>

        {/* Resume Text */}
        <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
          Current resume text
        </label>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={12}
          placeholder="Paste the section you want improved…"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 18,
            fontFamily: "inherit",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 18px",
            borderRadius: 10,
            background: "#000",
            color: "#fff",
            border: "none",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            marginBottom: 16,
          }}
        >
          {loading ? "Rewriting…" : "Rewrite my resume"}
        </button>
      </form>

      {/* Error Message */}
      {errorMsg ? (
        <div
          style={{
            background: "#ffe6e6",
            color: "#a30000",
            border: "1px solid #ffc9c9",
            padding: "12px 14px",
            borderRadius: 8,
            marginTop: 8,
          }}
        >
          {errorMsg}
        </div>
      ) : null}

      {/* Output */}
      {output ? (
        <div
          style={{
            background: "#f8f9fb",
            border: "1px solid #e6e8ef",
            padding: "16px 18px",
            borderRadius: 8,
            marginTop: 16,
            whiteSpace: "pre-wrap",
          }}
        >
          {output}
        </div>
      ) : null}

      {/* Small helper note */}
      <p style={{ color: "#777", marginTop: 18, fontSize: 13 }}>
        Tip: try tones like <em>Confident</em> or <em>Concise</em>, and be specific
        about the role (e.g., “Frontend Engineer (React)”, “Backend Engineer (Node)”, etc.).
      </p>
    </div>
  );
}
