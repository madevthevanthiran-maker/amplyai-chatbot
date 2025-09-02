// pages/privacy.jsx
import Head from "next/head";
import Link from "next/link";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Head><title>Privacy — AmplyAI</title></Head>
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-3xl font-bold">Privacy</h1>
        <p className="text-gray-300">
          AmplyAI is privacy-friendly. We do not require sign-up. Conversations are
          stored locally in your browser and are not shared with us.
        </p>
        <ul className="list-disc ml-6 text-gray-400 space-y-2">
          <li>We use simple analytics in aggregate to improve the product.</li>
          <li>You can clear any chat with “New chat” or ⌘/Ctrl + L.</li>
          <li>
            Questions?{" "}
            <a className="underline" href="mailto:hello@amplyai.org">
              hello@amplyai.org
            </a>
          </li>
        </ul>
        <Link href="/" className="underline text-blue-400">
          ← Back to home
        </Link>
      </main>
    </div>
  );
}
