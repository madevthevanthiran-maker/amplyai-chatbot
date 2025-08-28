// AmplyAI Email Composer — drop-in page component
// Framework: Next.js (App Router or Pages works), TailwindCSS
// Libraries: shadcn/ui optional (not required here); no external deps
// Usage: place this file as app/email/page.tsx (App Router) or pages/email.tsx (Pages Router)
// API route expected at /api/email (see below in this doc)

import React, { useMemo, useState } from "react";

// --- UI PRIMITIVES (minimal to keep portable) ---
const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string }>
  = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={
      `px-4 py-2 rounded-2xl text-sm font-medium border transition shadow-sm ` +
      (active
        ? "bg-black text-white border-black"
        : "bg-white text-black border-gray-200 hover:border-gray-300")
    }
  >
    {label}
  </button>
);

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }>
  = ({ label, hint, children }) => (
  <div className="space-y-2">
    <div className="flex items-baseline justify-between">
      <label className="text-sm font-semibold">{label}</label>
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </div>
    {children}
  </div>
);

const Card: React.FC<{ title?: string; children: React.ReactNode }>
  = ({ title, children }) => (
  <div className="rounded-2xl border border-gray-200 p-5 shadow-sm bg-white">
    {title && <h3 className="text-base font-semibold mb-3">{title}</h3>}
    {children}
  </div>
);

// --- PAGE COMPONENT ---
export default function EmailComposerPage() {
  const [tab, setTab] = useState("Intent");

  // Form state
  const [intent, setIntent] = useState("Cold outreach");
  const [recipient, setRecipient] = useState("Hiring Manager");
  const [goal, setGoal] = useState("Request a 15-min intro call about the role");

  const [context, setContext] = useState(
    "I'm a sophomore building AmplyAI. We shipped an MVP and have traffic from PH."
  );
  const [details, setDetails] = useState(
    "Job: Product Marketing Intern at Glide. My strengths: copy, tooling, short-form."
  );

  const [tone, setTone] = useState("Concise, confident, friendly");
  const [length, setLength] = useState("120-160 words");

  const [signature, setSignature] = useState(
    "Madev Thevan\nFounder, AmplyAI\nwww.amplyai.org | madev@amplyai.org"
  );

  const [constraints, setConstraints] = useState(
    "No fluff. Clear CTA. Subject line options. Two variants: A/B."
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    subjects: string[];
    versions: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tabs = ["Intent", "Context", "Style", "Review", "Output"] as const;

  const previewPrompt = useMemo(() => {
    return `Compose an email.\nIntent: ${intent}\nPrimary recipient: ${recipient}\nGoal: ${goal}\n\nContext: ${context}\nSpecifics: ${details}\n\nTone & length: ${tone}; ${length}\nSignature to use:\n${signature}\n\nConstraints: ${constraints}\nReturn JSON with keys subjects (array of 3) and versions (array of 2).`;
  }, [intent, recipient, goal, context, details, tone, length, signature, constraints]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
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
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setResult(data);
      setTab("Output");
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
      setTab("Output");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AmplyAI — Mail Mate</h1>
          <p className="text-gray-600 text-sm">Turn intent → crisp email with A/B variants + subject lines.</p>
        </div>
        <div className="flex gap-2">
          {tabs.map((t) => (
            <TabButton key={t} active={tab === t} onClick={() => setTab(t)} label={t} />
          ))}
        </div>
      </header>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {tab === "Intent" && (
            <Card title="Intent & Target">
              <div className="space-y-4">
                <Field label="Email intent" hint="e.g., Cold outreach, Follow-up, Request, Update">
                  <input value={intent} onChange={(e) => setIntent(e.target.value)} className="w-full rounded-xl border p-3" />
                </Field>
                <Field label="Recipient" hint="Who are you writing to?">
                  <input value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full rounded-xl border p-3" />
                </Field>
                <Field label="Goal" hint="One clear call-to-action">
                  <input value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full rounded-xl border p-3" />
                </Field>
              </div>
            </Card>
          )}

          {tab === "Context" && (
            <Card title="Context & Specifics">
              <div className="space-y-4">
                <Field label="Background/context">
                  <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={4} className="w-full rounded-xl border p-3" />
                </Field>
                <Field label="Key details">
                  <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} className="w-full rounded-xl border p-3" />
                </Field>
              </div>
            </Card>
          )}

          {tab === "Style" && (
            <Card title="Style & Constraints">
              <div className="space-y-4">
                <Field label="Tone">
                  <input value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded-xl border p-3" />
                </Field>
                <Field label="Length">
                  <input value={length} onChange={(e) => setLength(e.target.value)} className="w-full rounded-xl border p-3" />
                </Field>
                <Field label="Signature">
                  <textarea value={signature} onChange={(e) => setSignature(e.target.value)} rows={3} className="w-full rounded-xl border p-3" />
                </Field>
                <Field label="Constraints">
                  <textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} rows={3} className="w-full rounded-xl border p-3" />
                </Field>
              </div>
            </Card>
          )}

          {tab === "Review" && (
            <Card title="Prompt Preview (what gets sent to the API)">
              <textarea value={previewPrompt} readOnly rows={16} className="w-full rounded-xl border p-3 font-mono text-xs" />
              <div className="pt-4 flex gap-3">
                <button onClick={handleGenerate} disabled={loading} className="px-4 py-2 rounded-xl bg-black text-white font-semibold disabled:opacity-60">
                  {loading ? "Generating…" : "Generate Email"}
                </button>
                <button onClick={() => setTab("Style")} className="px-4 py-2 rounded-xl border">Back</button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card title="Live Preview">
            <div className="prose max-w-none">
              <p className="text-sm text-gray-600">This mirrors your inputs. Click <span className="font-semibold">Generate</span> on Review to get model-written drafts.</p>
              <hr className="my-3" />
              <p className="text-xs text-gray-500">To: {recipient}</p>
              <p className="text-xs text-gray-500">Intent: {intent} • Goal: {goal}</p>
              <hr className="my-3" />
              <p><strong>Context</strong>: {context}</p>
              <p><strong>Details</strong>: {details}</p>
              <p><strong>Tone</strong>: {tone} • <strong>Length</strong>: {length}</p>
              <hr className="my-3" />
              <pre className="whitespace-pre-wrap text-sm">{signature}</pre>
              <p className="text-xs text-gray-500">Constraints: {constraints}</p>
            </div>
          </Card>

          <Card title="Output">
            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
            {!result && !error && (
              <div className="text-sm text-gray-500">No output yet. Go to <strong>Review</strong> and click <strong>Generate</strong>.</div>
            )}
            {result && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Subject ideas</h4>
                  <ul className="list-disc pl-5 text-sm">
                    {result.subjects.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-6">
                  {result.versions.map((v, i) => (
                    <div key={i} className="border rounded-xl p-4 bg-gray-50">
                      <div className="text-xs text-gray-500 mb-2">Version {i + 1}</div>
                      <pre className="whitespace-pre-wrap text-sm">{v}</pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------- API ROUTE (Next.js App Router) ----------------
// Create file at app/api/email/route.ts
// If you're on Pages Router, use pages/api/email.ts with the same handler logic.

// Below is the handler code (TypeScript). Copy to app/api/email/route.ts
// ---------------------------------------------------------------
/*
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      intent, recipient, goal, context, details,
      tone, length, signature, constraints,
    } = body;

    // --- Compose a robust system + user prompt ---
    const sys = `You are AmplyAI's Email Composer. Write crisp, high-converting emails. Return JSON only.`;
    const user = `Compose an email based on the following inputs.\nIntent: ${intent}\nRecipient: ${recipient}\nGoal: ${goal}\nContext: ${context}\nDetails: ${details}\nTone: ${tone}\nLength: ${length}\nSignature: ${signature}\nConstraints: ${constraints}\nReturn JSON with keys \'subjects\' (3 strings) and \'versions\' (2 strings).`;

    // --- Call your model provider (OpenAI, etc.) ---
    // Example with OpenAI Responses API (Node 18+). Replace with your provider if needed.
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // const completion = await openai.chat.completions.create({
    //   model: "gpt-4o-mini",
    //   messages: [ { role: "system", content: sys }, { role: "user", content: user } ],
    //   response_format: { type: "json_object" },
    // });
    // const json = JSON.parse(completion.choices[0].message.content ?? "{}");

    // --- Temporary mock (so page works without a key) ---
    const json = {
      subjects: [
        "Quick intro: AmplyAI + a 15‑min idea",
        "Exploring the Product Marketing Intern role",
        "Could we connect this week?"
      ],
      versions: [
        `Hi ${recipient},\n\nI’m building AmplyAI and wanted to quickly introduce myself. ${goal}.\n\n${context}\n${details}\n\nIf it’s helpful, I can share a one‑pager beforehand. Does Tue 3–5pm SGT work?\n\n${signature}`,
        `Hello ${recipient},\n\nReaching out about the role — short version: ${goal}.\n\n${context}\n${details}\n\nHappy to adapt if there’s a better time.\n\n${signature}`,
      ],
    };

    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Unknown error" }, { status: 500 });
  }
}
*/
