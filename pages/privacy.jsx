// pages/privacy.jsx
import Head from "next/head";
import Link from "next/link";

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy — AmplyAI</title>
        <meta name="description" content="Privacy policy for AmplyAI — Progress Partner." />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <section className="max-w-3xl mx-auto px-6 py-12">
          <Link href="/" className="text-sm underline text-gray-600">← Back to Home</Link>

          <h1 className="mt-4 text-3xl font-bold">Privacy</h1>
          <p className="mt-2 text-sm text-gray-500">
            Last updated: 2 Sep 2025 (SGT)
          </p>

          <div className="mt-8 space-y-8">
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Our promise</h2>
              <p className="text-gray-700">
                AmplyAI is built to help you make progress with less stress. We keep the MVP simple:
                no accounts, no personal data collection, and conversations stored locally on your device
                (in your browser’s storage) — not on our servers.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold">What we store</h2>
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                <li><strong>Local conversations:</strong> Your chat history is saved in your browser’s localStorage per tool tab (HireHelper, MailMate, Planner, Chat). Clearing your browser storage or clicking “Clear” in the app removes it.</li>
                <li><strong>No account data:</strong> We don’t ask you to sign up in this MVP, so we don’t store names, emails, or passwords.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Analytics</h2>
              <p className="text-gray-700">
                We use <strong>Plausible</strong> (a privacy-first, cookie-free analytics tool) to measure basic usage,
                like page views and simple events (e.g., tab selections, message sends, generic errors, thumbs up/down).
                This helps us improve what matters without tracking you across the web.
              </p>
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                <li>No cookies, no cross-site tracking.</li>
                <li>Events are aggregated and anonymous.</li>
                <li>You can use a tracker blocker; the app still works.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Model & API usage</h2>
              <p className="text-gray-700">
                When you submit a message, the text is sent securely to our AI provider to generate a response.
                We do not log your message content on our own servers beyond what’s needed to process the request.
                We select providers and settings to minimize retention, but the AI provider may temporarily process data
                to deliver the response (standard for LLM APIs).
              </p>
              <p className="text-gray-700">
                Tip: avoid sharing sensitive personal information in prompts. If you must, remove identifiers.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Security</h2>
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                <li>Transport security via HTTPS.</li>
                <li>No server-side storage of your chat history in the MVP.</li>
                <li>Local control: you can clear conversations anytime.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Future changes</h2>
              <p className="text-gray-700">
                As we add accounts, cloud history, and pro features, we’ll update this page and highlight any changes.
                We’ll continue to favor minimal data collection and clear controls.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Contact</h2>
              <p className="text-gray-700">
                Questions or requests? Email <a href="mailto:hello@amplyai.org" className="underline">hello@amplyai.org</a>.
              </p>
            </section>
          </div>

          <footer className="mt-12">
            <div className="rounded-2xl border bg-white p-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">© {new Date().getFullYear()} AmplyAI — Progress Partner</span>
              <div className="flex gap-3">
                <Link href="/app?tab=chat" className="text-sm underline">Open App</Link>
                <Link href="/" className="text-sm underline">Home</Link>
              </div>
            </div>
          </footer>
        </section>
      </main>
    </>
  );
}
