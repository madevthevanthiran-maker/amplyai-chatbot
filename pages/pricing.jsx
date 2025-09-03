// pages/pricing.jsx
import Head from "next/head";
import Link from "next/link";
import React from "react";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Head>
        <title>Pricing (Beta Preview) — AmplyAI</title>
        <meta
          name="description"
          content="Affordable, privacy-friendly AI Progress Partner. Beta pricing preview."
        />
        <meta property="og:title" content="AmplyAI — Pricing (Beta Preview)" />
        <meta property="og:description" content="Affordable, privacy-friendly AI Progress Partner." />
        <meta property="og:image" content="/og.png" />
      </Head>

      <header className="border-b border-gray-800 bg-gray-950/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="font-semibold hover:opacity-90">AmplyAI</Link>
          <span className="text-gray-500">— Pricing Preview</span>
          <nav className="ml-auto flex items-center gap-3 text-sm">
            <Link className="hover:text-gray-300" href="/">Home</Link>
            <Link className="hover:text-gray-300" href="/app">Open App</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <section className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">Affordable from day one</h1>
          <p className="text-gray-400">
            You’re in control. AmplyAI helps with resumes, emails, and planning — without the $30/mo price tag.
          </p>
          <div className="mt-3 inline-block rounded-full border border-yellow-700 bg-yellow-900/30 px-3 py-1 text-yellow-200 text-xs">
            Beta Pricing Preview — subject to change
          </div>
        </section>

        {/* Tiers */}
        <section className="grid md:grid-cols-3 gap-6">
          <Plan
            name="Free"
            price="$0"
            tagline="Try it out"
            comingSoon
            features={[
              "Chat + 1 tool (rotates)",
              "5 messages/day",
              "Local-only storage",
              "Privacy-friendly (no signup)",
            ]}
          />
          <Plan
            name="Starter"
            price="~$7/mo"
            tagline="Everything you need"
            highlight
            comingSoon
            features={[
              "All tabs: HireHelper, MailMate, Planner, Chat",
              "Unlimited messages (fair use)",
              "Save & export conversations",
              "Priority model for short tasks",
            ]}
          />
          <Plan
            name="Pro"
            price="~$15/mo"
            tagline="For power users"
            comingSoon
            features={[
              "Faster responses + longer contexts",
              "Custom system prompts per tab",
              "Early access to Finance/Fitness",
              "Email support",
            ]}
          />
        </section>

        {/* Teams */}
        <section className="mt-12 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-2xl font-semibold mb-2">Teams (coming later)</h2>
          <p className="text-gray-400 mb-4">
            Shared workspace for small teams, schools, and career services.
          </p>
          <ul className="list-disc ml-6 text-gray-300 space-y-1">
            <li>Shared plans, templates, and progress dashboards</li>
            <li>Admin controls, usage analytics</li>
            <li>Pricing: <span className="text-gray-200">$30–$50 / seat</span></li>
          </ul>
          <div className="mt-4 text-sm text-gray-400">
            Interested? Email{" "}
            <a
              href="mailto:hello@amplyai.org?subject=AmplyAI%20Teams%20Interest"
              className="underline text-blue-400"
            >
              hello@amplyai.org
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12 grid md:grid-cols-2 gap-6">
          <FAQ q="Will prices change after beta?">
            We may adjust as we learn, but AmplyAI will remain affordable. Early users keep generous terms.
          </FAQ>
          <FAQ q="Do I need an account?">
            No — you can use AmplyAI without signup. Chats are stored in your browser.
          </FAQ>
          <FAQ q="How do you handle privacy?">
            We’re privacy-friendly by default. We don’t sell data. See our{" "}
            <Link href="/privacy" className="underline">Privacy</Link> page.
          </FAQ>
          <FAQ q="Which models do you use?">
            We optimize for cost + quality (e.g., GPT-4o-mini). Pro may get faster/larger contexts.
          </FAQ>
        </section>

        <div className="text-center mt-12">
          <Link href="/app">
            <button className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 font-medium">
              Keep using AmplyAI
            </button>
          </Link>
        </div>
      </main>

      <footer className="text-center py-8 text-sm text-gray-500">
        © {new Date().getFullYear()} AmplyAI · Privacy-friendly · No sign-up required
      </footer>
    </div>
  );
}

function Plan({ name, price, tagline, features, highlight, comingSoon }) {
  return (
    <div
      className={`rounded-2xl border p-6 shadow transition ${
        highlight ? "border-blue-700 bg-blue-950/30" : "border-gray-800 bg-gray-900"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-semibold">{name}</h3>
        <div className="text-2xl font-bold">{price}</div>
      </div>
      <p className="text-gray-400 text-sm mt-1">{tagline}</p>
      <ul className="mt-4 space-y-2 text-sm text-gray-300">
        {features.map((f, i) => (
          <li key={i} className="flex gap-2">
            <span>•</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 w-full rounded-full px-4 py-2 text-sm font-medium border border-gray-700 text-center text-gray-400">
        {comingSoon ? "Coming soon" : "Available"}
      </div>
      {highlight && (
        <div className="mt-3 text-xs text-blue-200">Likely the best fit for most users.</div>
      )}
    </div>
  );
}

function FAQ({ q, children }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="font-medium">{q}</div>
      <div className="mt-1 text-sm text-gray-300">{children}</div>
    </div>
  );
}
