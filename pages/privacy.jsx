// pages/privacy.jsx
import Head from "next/head";
import Link from "next/link";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Head>
        <title>Privacy — AmplyAI</title>
        <meta name="description" content="Privacy policy for AmplyAI. Privacy-friendly by default." />
        <meta property="og:title" content="AmplyAI — Privacy" />
        <meta property="og:description" content="Privacy-friendly by default. No sign-up required." />
      </Head>

      <header className="border-b border-gray-800 bg-gray-950/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="font-semibold hover:opacity-90">AmplyAI</Link>
          <span className="text-gray-500">— Privacy</span>
          <nav className="ml-auto flex items-center gap-3 text-sm">
            <Link className="hover:text-gray-300" href="/">Home</Link>
            <Link className="hover:text-gray-300" href="/pricing">Pricing</Link>
            <Link className="hover:text-gray-300" href="/app">Open App</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <section>
          <h1 className="text-3xl font-bold mb-2">Privacy policy</h1>
          <p className="text-gray-400">
            AmplyAI is built to be privacy-friendly. You can use it without signing up; your
            chats are stored locally in your browser (LocalStorage/IndexedDB) and never shared by us.
          </p>
        </section>

        <section className="space-y-3 text-gray-300">
          <h2 className="text-xl font-semibold">What we store</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li><span className="text-gray-200">Your chats:</span> stored locally on your device.</li>
            <li><span className="text-gray-200">Analytics:</span> we use privacy-friendly, cookie-free analytics to understand usage at a high level (page views, feature clicks). No personal profiles.</li>
            <li><span className="text-gray-200">Feedback:</span> if you submit feedback or email us, we’ll keep that to follow up.</li>
          </ul>
        </section>

        <section className="space-y-3 text-gray-300">
          <h2 className="text-xl font-semibold">Model usage</h2>
          <p>
            When you ask AmplyAI to generate text, your prompt is sent to our model provider solely
            to produce the response. We don’t sell or share your data with third parties for advertising.
          </p>
        </section>

        <section className="space-y-3 text-gray-300">
          <h2 className="text-xl font-semibold">Your choices</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>Clear your conversations any time from the app (“New chat” / future “Clear all”).</li>
            <li>Export your chats from the app (“Copy chat” / “Download .md”).</li>
          </ul>
        </section>

        <section className="space-y-3 text-gray-300">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p>Questions? Email <a className="underline text-blue-400" href="mailto:hello@amplyai.org">hello@amplyai.org</a>.</p>
        </section>
      </main>

      <footer className="text-center py-8 text-sm text-gray-500">
        © {new Date().getFullYear()} AmplyAI · Privacy-friendly · No sign-up required
      </footer>
    </div>
  );
}
