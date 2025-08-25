import { useState } from "react";

export default function Home() {
  const [jobRole, setJobRole] = useState("");
  const [tone, setTone] = useState("Professional");
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult("");

    // Build the chat messages for the OpenAI API
    const messages = [
      {
        role: "system",
        content:
          "You are a professional resume assistant. Improve resumes for specific roles. Output only the improved resume text, no explanations.",
      },
      {
        role: "user",
        content: `
Job role: ${jobRole}
Preferred tone: ${tone}
Current resume:
${resumeText}

Task: Rewrite and improve the resume to be more compelling and targeted to the job role. Keep it concise, metrics-driven where possible, and ATS-friendly. Output only the improved resume text.
        `.trim(),
      },
    ];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data.reply || "");
    } catch (err) {
      setResult(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={{ marginTop: 0 }}>AmplyAI — Resume Helper (DIY)</h1>

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>
            Job role you’re applying for
            <input
              style={styles.input}
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g., Product Manager"
              required
            />
          </label>

          <label style={styles.label}>
            Tone
            <select
              style={styles.input}
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option>Professional</option>
              <option>Creative</option>
              <option>Friendly</option>
              <option>Straightforward</option>
            </select>
          </label>

          <label style={styles.label}>
            Paste your current resume (or main bullets)
            <textarea
              style={{ ...styles.input, height: 160 }}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste resume text here…"
              required
            />
          </label>

          <button style={styles.button} disabled={loading}>
            {loading ? "Improving…" : "Improve Resume"}
          </button>
        </form>

        <div style={styles.output}>
          <h3>Improved Resume</h3>
          {result ? <pre style={styles.pre}>{result}</pre> : <p>No output yet.</p>}
        </div>
      </div>
      <footer style={{ marginTop: 24, opacity: 0.6 }}>
        Built with Next.js + OpenAI
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 24,
    background: "#0b0b0c",
    color: "#fff",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
  },
  card: {
    width: "100%",
    maxWidth: 820,
    background: "#121316",
    border: "1px solid #2a2b31",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  form: { display: "grid", gap: 12, marginBottom: 16 },
  label: { display: "grid", gap: 8, fontSize: 14 },
  input: {
    background: "#0e0f12",
    border: "1px solid #2a2b31",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 10,
    outline: "none",
  },
  button: {
    marginTop: 6,
    background: "#7c5cff",
    border: "none",
    color: "#fff",
    padding: "12px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  },
  output: {
    marginTop: 18,
    borderTop: "1px solid #2a2b31",
    paddingTop: 14,
  },
  pre: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    background: "#0e0f12",
    border: "1px solid #2a2b31",
    borderRadius: 10,
    padding: 12,
  },
};

