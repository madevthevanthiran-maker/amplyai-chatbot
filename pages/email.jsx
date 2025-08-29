import { useMemo, useState } from "react";

export default function MailMate() {
  // form state
  const [intent, setIntent] = useState("Cold outreach");
  const [recipient, setRecipient] = useState("Hiring Manager");
  const [goal, setGoal] = useState("Request a 15-min intro call");

  const [context, setContext] = useState(
    "I'm a sophomore building AmplyAI. We shipped an MVP and have traffic from PH."
  );
  const [details, setDetails] = useState(
    "Job: Product Marketing Intern at Glide. My strengths: copy, tooling, short-form."
  );

  const [tone, setTone] = useState("Concise, confident, friendly");
  const [length, setLength] = useState("120-160 words");
  const [signature, setSignature] = useState(
    `Madev Thevan\nFounder, AmplyAI\nwww.amplyai.org  |  madev@amplyai.org`
  );
  const [constraints, setConstraints] = useState(
    "No fluff. Clear CTA. Subject line options. Two variants: A/B."
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [versions, setVersions] = useState([]); // two strings

  // live preview text block
  const preview = useMemo(() => {
    return [
      `To: ${recipient}`,
      "",
      `Intent: ${intent} • Goal: ${goal}`,
      "",
      `Context: ${context}`,
      "",
      `Details: ${details}`,
      "",
      `Tone: ${tone} • Length: ${length}`,
      "",
      signature,
      "",
      `Constraints: ${constraints}`,
    ].join("\n");
  }, [intent, recipient, goal, context, details, tone, length, signature, constraints]);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setSubjects([]);
    setVersions([]);

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          recipient,
          goal,
          context,
          details,
          tone,
          length,
          signature,
          constraints,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Request failed");
      }

      const data = await res.json();
      // Expect: { subjects: string[], versions: string[] }
      setSubjects(Array.isArray(data.subjects) ? data.subjects.slice(0, 3) : []);
      setVersions(Array.isArray(data.versions) ? data.versions.slice(0, 2) : []);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">
            AmplyAI — <span className="text-indigo-600">MailMate</span>
          </h1>
          <a
            href="/"
            className="text-sm text-neutral-600 hover:text-neutral-900 transition"
          >
            ← Resume Helper
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <section className="space-y-6">
          <Card title="Intent & Target">
            <Field label="Email intent (e.g., Cold outreach, Follow-up, Request, Update)">
              <Input value={intent} onChange={setIntent} placeholder="Cold outreach" />
            </Field>
            <Field label="Recipient (Who are you writing to?)">
              <Input value={recipient} onChange={setRecipient} placeholder="Hiring Manager" />
            </Field>
            <Field label="Goal (One clear call-to-action)">
              <Input value={goal} onChange={setGoal} placeholder="Request a 15-min intro call" />
            </Field>
          </Card>

          <Card title="Context & Style">
            <Field label="Context">
              <Textarea value={context} onChange={setContext} rows={3} />
            </Field>
            <Field label="Details">
              <Textarea value={details} onChange={setDetails} rows={3} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Tone">
                <Input value={tone} onChange={setTone} placeholder="Concise, confident, friendly" />
              </Field>
              <Field label="Length">
                <Input value={length} onChange={setLength} placeholder="120-160 words" />
              </Field>
            </div>
            <Field label="Signature">
              <Textarea value={signature} onChange={setSignature} rows={3} />
            </Field>
            <Field label="Constraints">
              <Input value={constraints} onChange={setConstraints} placeholder="No fluff. Clear CTA…" />
            </Field>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? Spinner : null}
                {loading ? "Generating…" : "Generate"}
              </button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          </Card>
        </section>

        {/* Right: Preview & Output */}
        <section className="space-y-6">
          <Card title="Live Preview">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
              {preview}
            </pre>
          </Card>

          <Card title="Subject Lines (Top 3)">
            {subjects.length === 0 ? (
              <p className="text-sm text-neutral-500">Click Generate to get suggestions.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {subjects.map((s, i) => (
                  <li key={i} className="text-neutral-800">{s}</li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Drafts (A/B)">
            {versions.length === 0 ? (
              <p className="text-sm text-neutral-500">You’ll see two variants here after generation.</p>
            ) : (
              <div className="space-y-4">
                {versions.map((v, i) => (
                  <div key={i} className="rounded-lg border bg-white p-4">
                    <div className="mb-2 text-xs font-semibold text-neutral-500">Version {i === 0 ? "A" : "B"}</div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{v}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}

/* ---------- small UI helpers ---------- */
function Card({ title, children }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-neutral-900">{title}</h2>
      {children}
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-sm font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  );
}
function Input({ value, onChange, ...rest }) {
  return (
    <input
      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  );
}
function Textarea({ value, onChange, rows = 4, ...rest }) {
  return (
    <textarea
      rows={rows}
      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  );
}
const Spinner = (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);
