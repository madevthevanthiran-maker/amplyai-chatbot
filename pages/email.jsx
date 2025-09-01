import { useMemo, useRef, useState } from "react";
import Head from "next/head";

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "persuasive", label: "Persuasive" },
  { value: "casual", label: "Casual" },
];

const LENGTHS = [
  { value: "short", label: "Short (~50 words)" },
  { value: "medium", label: "Medium (~100 words)" },
  { value: "long", label: "Long (~200+ words)" },
];

const SUGGESTIONS = [
  "Write a polite follow-up after a product demo.",
  "Decline a meeting but keep the door open.",
  "Introduce myself to a recruiter (brief + confident).",
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op
    }
  }

  return (
    <button className="btn btn-secondary" onClick={onCopy} title="Copy">
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function DownloadButton({ filename = "mailmate-draft.txt", text }) {
  function onDownload() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button className="btn btn-secondary" onClick={onDownload} title="Download .txt">
      Download
    </button>
  );
}

export default function MailMate() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState(TONES[0].value);
  const [length, setLength] = useState(LENGTHS[1].value);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [drafts, setDrafts] = useState([]); // array of strings
  const formRef = useRef(null);

  const isDisabled = useMemo(() => loading || !prompt.trim(), [loading, prompt]);

  async function generate() {
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), tone, length }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      // Expecting { drafts: string[] } (but handle single string too)
      const newDrafts = Array.isArray(data?.drafts)
        ? data.drafts
        : data?.text
        ? [data.text]
        : [];

      if (!newDrafts.length) {
        throw new Error("No drafts returned");
      }

      setDrafts(newDrafts);
    } catch (err) {
      setErrorMsg(
        "MailMate hit a snag 🤕. Please try again in a few seconds, or tweak your prompt."
      );
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!isDisabled) {
      generate();
    }
  }

  function useSuggestion(s) {
    setPrompt(s);
    // focus the input for quick edit
    formRef.current?.querySelector("textarea")?.focus();
  }

  return (
    <>
      <Head>
        <title>MailMate — AmplyAI</title>
      </Head>

      <main className="container">
        {/* Top nav back to chatbot + tabs */}
        <div className="topbar">
          <a href="/" className="link">
            ← Back to Progress Partner
          </a>
          <div className="tabs">
            <a href="/email" className="pill pill-active">MailMate</a>
            <a href="/hire-helper" className="pill">HireHelper</a>
            <a href="/planner" className="pill">Planner</a>
          </div>
        </div>

        <section className="card">
          <header className="card-header">
            <h1>MailMate</h1>
            <p className="muted">
              Give me context and goal, then choose tone & length. I’ll draft a clean, actionable email.
            </p>
          </header>

          <form ref={formRef} onSubmit={onSubmit} className="stack gap-md">
            <div className="grid-2 gap-md">
              <div className="field">
                <label className="label">Tone</label>
                <select
                  className="input"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label">Length</label>
                <select
                  className="input"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                >
                  {LENGTHS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label className="label">What should the email do?</label>
              <textarea
                className="input"
                rows={5}
                placeholder="e.g., Cold outreach to a hiring manager; goal: request a 15-min intro call; include: shipped MVP with early traction; tone: concise & confident."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="row gap-sm wrap">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="chip"
                  onClick={() => useSuggestion(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="row gap-sm">
              <button className="btn btn-primary" disabled={isDisabled}>
                {loading ? "Generating…" : "Generate"}
              </button>
              {errorMsg && (
                <>
                  <span className="error">{errorMsg}</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={generate}
                  >
                    Retry
                  </button>
                </>
              )}
            </div>
          </form>
        </section>

        {!!drafts.length && (
          <section className="stack gap-md">
            {drafts.map((d, i) => (
              <article className="card" key={i}>
                <header className="card-header row space">
                  <strong>Email Draft {i + 1}</strong>
                  <div className="row gap-sm">
                    <CopyButton text={d} />
                    <DownloadButton
                      filename={`mailmate-draft-${i + 1}.txt`}
                      text={d}
                    />
                  </div>
                </header>
                <pre className="output">{d}</pre>
              </article>
            ))}
          </section>
        )}
      </main>

      <style jsx>{`
        .container {
          max-width: 980px;
          margin: 2rem auto;
          padding: 0 1rem 4rem;
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          gap: 1rem;
        }
        .tabs {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .pill,
        .pill-active {
          padding: 0.5rem 0.9rem;
          border-radius: 999px;
          border: 1px solid var(--border, #2c2f3a);
          color: var(--text, #e6e9ef);
          text-decoration: none;
          font-size: 0.9rem;
          background: var(--surface-2, rgba(255, 255, 255, 0.02));
        }
        .pill-active {
          background: var(--brand-600, #4b6bfb);
          border-color: var(--brand-600, #4b6bfb);
          color: white;
        }
        .link {
          color: var(--text, #e6e9ef);
          text-decoration: none;
          opacity: 0.9;
        }
        .card {
          background: var(--surface-1, rgba(255, 255, 255, 0.03));
          border: 1px solid var(--border, #2c2f3a);
          border-radius: 16px;
          padding: 1.1rem;
        }
        .card + .card {
          margin-top: 1rem;
        }
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .muted {
          opacity: 0.8;
          margin: 0.25rem 0 0;
        }
        .stack {
          display: grid;
        }
        .gap-md {
          row-gap: 1rem;
        }
        .row {
          display: flex;
          align-items: center;
        }
        .wrap {
          flex-wrap: wrap;
        }
        .gap-sm {
          gap: 0.5rem;
        }
        .space {
          justify-content: space-between;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (max-width: 720px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }
        .label {
          font-size: 0.9rem;
          opacity: 0.85;
          margin-bottom: 0.35rem;
          display: inline-block;
        }
        .input {
          width: 100%;
          color: var(--text, #e6e9ef);
          background: var(--surface-2, rgba(255, 255, 255, 0.02));
          border: 1px solid var(--border, #2c2f3a);
          border-radius: 12px;
          padding: 0.75rem 0.9rem;
          outline: none;
        }
        textarea.input {
          line-height: 1.45;
          resize: vertical;
          min-height: 120px;
        }
        .btn {
          border: 1px solid var(--border, #2c2f3a);
          background: var(--surface-2, rgba(255, 255, 255, 0.02));
          color: var(--text, #e6e9ef);
          padding: 0.6rem 0.9rem;
          border-radius: 10px;
          cursor: pointer;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-primary {
          background: var(--brand-600, #4b6bfb);
          border-color: var(--brand-600, #4b6bfb);
          color: white;
        }
        .btn-secondary {
          background: var(--surface-3, rgba(255, 255, 255, 0.06));
        }
        .chip {
          background: var(--surface-2, rgba(255, 255, 255, 0.04));
          border: 1px solid var(--border, #2c2f3a);
          color: var(--text, #e6e9ef);
          border-radius: 999px;
          padding: 0.45rem 0.8rem;
          cursor: pointer;
        }
        .error {
          color: #ffb4b4;
          margin-left: 0.5rem;
          font-size: 0.95rem;
        }
        .output {
          white-space: pre-wrap;
          line-height: 1.5;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
            Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
          background: var(--surface-2, rgba(255, 255, 255, 0.02));
          border: 1px solid var(--border, #2c2f3a);
          border-radius: 12px;
          padding: 0.9rem;
        }
      `}</style>
    </>
  );
}
