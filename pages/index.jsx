// pages/index.jsx
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
        <meta
          name="description"
          content="Less Stress. More Progress. Multi-tab AI to land the job, write better emails, plan your week, and get answers — in a clean dark interface."
        />
        <meta property="og:title" content="AmplyAI — Progress Partner" />
        <meta property="og:description" content="Less Stress. More Progress." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.amplyai.org/" />
        <meta property="og:image" content="/og.png" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 text-gray-100">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950/70 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 bg-blue-500 rounded-full" />
              <span className="font-semibold">AmplyAI</span>
              <span className="text-gray-400">— Progress Partner</span>
            </div>
            <nav className="flex gap-2">
              <Link href="/app?tab=chat" legacyBehavior>
                <a className="px-4 py-1.5 rounded-full text-sm font-medium bg-gray-800/60 text-gray-200 hover:bg-gray-700/60">
                  Open App
                </a>
              </Link>
              <Link href="/privacy" legacyBehavior>
                <a className="px-4 py-1.5 rounded-full text-sm font-medium bg-gray-800/60 text-gray-300 hover:bg-gray-700/60">
                  Privacy
                </a>
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-800 bg-gray-900/70 px-3 py-1 text-xs text-gray-300">
            MVP · Privacy-friendly · No sign-up required
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight">
            Less Stress. <span className="text-gray-400">More Progress.</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            A multi-tab AI that helps you <strong>land the job</strong>, <strong>write better emails</strong>,
            <strong> plan your week</strong>, and <strong>get answers</strong> — all in one clean interface.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/app?tab=hirehelper" legacyBehavior>
              <a className="px-5 py-3 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-500">
                Try HireHelper
              </a>
            </Link>
            <Link href="/app?tab=chat" legacyBehavior>
              <a className="px-5 py-3 rounded-full border border-gray-700 bg-gray-900/70 text-sm text-gray-200 hover:bg-gray-800/70">
                Open Progress Partner
              </a>
            </Link>
          </div>
          <p className="mt-3 text-xs text-gray-400">No sign-up. Conversations stay on your device.</p>
        </section>

        {/* Feature grid */}
        <section className="max-w-6xl mx-auto px-4 pb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div
                key={f.key}
                className="rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur p-4 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <h3 className="font-semibold text-gray-100">{f.name}</h3>
                  <p className="mt-2 text-sm text-gray-300">{f.blurb}</p>
                </div>
                <Link href={`/app?tab=${f.key}`} legacyBehavior>
                  <a className="mt-4 inline-flex items-center justify-center rounded-full border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-800/70">
                    {f.cta}
                  </a>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Social proof */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur p-6 shadow-lg">
            <p className="text-sm text-gray-300">
              “AmplyAI helped me turn my internship notes into clean resume bullets in minutes.” —{" "}
              <span className="font-medium text-gray-200">Beta user</span>
            </p>
            <p className="mt-2 text-sm text-gray-300">
              “Planner actually made my week doable. Saved me from over-scheduling.” —{" "}
              <span className="font-medium text-gray-200">Beta user</span>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-xl font-semibold text-gray-100">FAQ</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
              <h3 className="font-medium text-gray-100">Do I need an account?</h3>
              <p className="text-sm text-gray-300 mt-1">No. The MVP stores conversations locally in your browser.</p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
              <h3 className="font-medium text-gray-100">Is my data private?</h3>
              <p className="text-sm text-gray-300 mt-1">
                We don’t collect personal data. Basic usage is measured via Plausible (privacy-first analytics).
              </p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
              <h3 className="font-medium text-gray-100">What’s coming next?</h3>
              <p className="text-sm text-gray-300 mt-1">
                Cloud history, account login, and pro templates for resumes, emails, and planning.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
              <h3 className="font-medium text-gray-100">Is it free?</h3>
              <p className="text-sm text-gray-300 mt-1">Yes, during soft launch. Paid tiers later.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-6xl mx-auto px-4 pb-16">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
            <span className="text-sm text-gray-400">© {new Date().getFullYear()} AmplyAI — Progress Partner</span>
            <div className="flex gap-3">
              <Link href="/app?tab=chat" legacyBehavior>
                <a className="text-sm underline text-gray-300">Open App</a>
              </Link>
              <Link href="/privacy" legacyBehavior>
                <a className="text-sm underline text-gray-400">Privacy</a>
              </Link>
              <a href="mailto:hello@amplyai.org" className="text-sm underline text-gray-400">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
