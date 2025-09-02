// pages/index.js
import Head from "next/head";
import Link from "next/link";

export default function Home() {
  const features = [
    {
      key: "hirehelper",
      name: "HireHelper",
      blurb: "Turn messy experience into recruiter-ready bullets. Quantified. STAR-tight.",
      cta: "Open HireHelper",
    },
    {
      key: "mailmate",
      name: "MailMate",
      blurb: "Write clear, outcome-driven emails with subject lines and variants.",
      cta: "Open MailMate",
    },
    {
      key: "planner",
      name: "Planner",
      blurb: "Break goals into doable tasks and schedules with realistic buffers.",
      cta: "Open Planner",
    },
    {
      key: "chat",
      name: "Progress Partner",
      blurb: "Your general assistant for life & work. Quick answers, no fuss.",
      cta: "Open Chat",
    },
  ];

  return (
    <>
      <Head>
        <title>AmplyAI — Progress Partner</title>
        <meta name="description" content="Less Stress. More Progress. Multi-tab AI that helps you land the job, write better emails, plan your week, and get answers fast." />
        <meta property="og:title" content="AmplyAI — Progress Partner" />
        <meta property="og:description" content="Less Stress. More Progress." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.amplyai.org/" />
        <meta property="og:image" content="https://www.amplyai.org/og.png" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-600 bg-white">
            MVP · Privacy-friendly · No sign-up required
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight">
            Less Stress. <span className="text-gray-500">More Progress.</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            A multi-tab AI that helps you <strong>land the job</strong>, <strong>write better emails</strong>, 
            <strong>plan your week</strong>, and <strong>get answers</strong> — all in one clean interface.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app?tab=hirehelper"
              className="px-5 py-3 rounded-xl bg-gray-900 text-white text-sm hover:opacity-90"
            >
              Try HireHelper
            </Link>
            <Link
              href="/app?tab=chat"
              className="px-5 py-3 rounded-xl border text-sm bg-white hover:bg-gray-50"
            >
              Open Progress Partner
            </Link>
          </div>
          <p className="mt-3 text-xs text-gray-500">No sign-up. Conversations stay on your device.</p>
        </section>

        {/* Feature grid */}
        <section className="max-w-6xl mx-auto px-6 pb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.key} className="rounded-2xl border bg-white p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold">{f.name}</h3>
                  <p className="mt-2 text-sm text-gray-600">{f.blurb}</p>
                </div>
                <Link
                  href={`/app?tab=${f.key}`}
                  className="mt-4 inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  {f.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Social proof / mini testimonials placeholders */}
        <section className="max-w-6xl mx-auto px-6 py-8">
          <div className="rounded-2xl border bg-white p-6">
            <p className="text-sm text-gray-600">
              “AmplyAI helped me turn my internship notes into clean resume bullets in minutes.” — <span className="font-medium">Beta user</span>
            </p>
            <p className="mt-2 text-sm text-gray-600">
              “Planner actually made my week doable. Saved me from over-scheduling.” — <span className="font-medium">Beta user</span>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-6xl mx-auto px-6 py-10">
          <h2 className="text-xl font-semibold">FAQ</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium">Do I need an account?</h3>
              <p className="text-sm text-gray-600 mt-1">No. The MVP stores conversations locally in your browser.</p>
            </div>
            <div>
              <h3 className="font-medium">Is my data private?</h3>
              <p className="text-sm text-gray-600 mt-1">We don’t collect personal data. Basic usage is measured via Plausible (privacy-first analytics).</p>
            </div>
            <div>
              <h3 className="font-medium">What’s coming next?</h3>
              <p className="text-sm text-gray-600 mt-1">Cloud history, account login, and pro templates for resumes, emails, and planning.</p>
            </div>
            <div>
              <h3 className="font-medium">Is it free?</h3>
              <p className="text-sm text-gray-600 mt-1">Yes, during soft launch. Paid tiers later.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-6xl mx-auto px-6 pb-16">
          <div className="rounded-2xl border bg-white p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <span className="text-sm text-gray-600">© {new Date().getFullYear()} AmplyAI — Progress Partner</span>
            <div className="flex gap-3">
              <Link href="/app?tab=chat" className="text-sm underline">Open App</Link>
              <Link href="mailto:hello@amplyai.org" className="text-sm underline">Contact</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
