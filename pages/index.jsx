// pages/index.jsx
import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Head>
        <title>AmplyAI — Progress Partner</title>
        <meta
          name="description"
          content="AmplyAI is your affordable AI Progress Partner. Resumes, emails, plans — all in one place."
        />
        <meta property="og:title" content="AmplyAI — Progress Partner" />
        <meta
          property="og:description"
          content="Less stress. More progress. Resumes, emails, planning — all in one affordable AI partner."
        />
        <meta property="og:image" content="/og.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <span className="font-semibold">AmplyAI</span>
          <span className="text-gray-500">— Progress Partner</span>
          <nav className="ml-auto flex items-center gap-4 text-sm">
            <Link href="/pricing" className="hover:text-gray-300">
              Pricing
            </Link>
            <Link href="/privacy" className="hover:text-gray-300">
              Privacy
            </Link>
            <Link href="/app">
              <button className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-sm font-medium">
                Open App
              </button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Less Stress. <span className="text-blue-500">More Progress.</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          AmplyAI is your affordable AI Progress Partner. Write better{" "}
          <span className="text-gray-200 font-semibold">resumes</span>, craft
          clearer <span className="text-gray-200 font-semibold">emails</span>,
          plan your <span className="text-gray-200 font-semibold">weeks</span>,
          and get help with <span className="text-gray-200 font-semibold">anything</span>.
        </p>
        <Link href="/app">
          <button className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 font-medium">
            Try Free →
          </button>
        </Link>
      </section>

      {/* Current Features */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-6 text-center">What you can do today</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <FeatureCard
            title="HireHelper"
            desc="Turn messy notes into recruiter-ready bullets. Action verbs, quantified results."
          />
          <FeatureCard
            title="MailMate"
            desc="Write clear, outcome-driven emails with strong subject lines."
          />
          <FeatureCard
            title="Planner"
            desc="Break goals into realistic tasks with buffers and schedules."
          />
          <FeatureCard
            title="Progress Partner"
            desc="Your general AI assistant — quick answers, no fuss."
          />
        </div>
      </section>

      {/* Roadmap */}
      <section className="bg-gray-900 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Coming soon</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <RoadmapCard
              title="Finance Planner"
              desc="Budgeting, savings, and goal tracking — affordable and simple."
            />
            <RoadmapCard
              title="Fitness Planner"
              desc="Custom workout splits, nutrition guidance, and progress tracking."
            />
            <RoadmapCard
              title="Study Tools"
              desc="Turn notes into quizzes, flashcards, and summaries for faster learning."
            />
            <RoadmapCard
              title="Habits Dashboard"
              desc="Daily check-ins, streaks, and a clear progress overview."
            />
          </div>
        </div>
      </section>

      {/* Why AmplyAI */}
      <section className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl font-bold mb-6">Why AmplyAI?</h2>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div className="p-4 rounded-xl border border-gray-800 bg-gray-900">
            <h3 className="font-semibold mb-2">Affordable</h3>
            <p className="text-gray-400">
              No $30/mo wall. Plans will start as low as $7/mo.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-gray-800 bg-gray-900">
            <h3 className="font-semibold mb-2">Privacy-friendly</h3>
            <p className="text-gray-400">
              No signup required. Your chats stay in your browser.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-gray-800 bg-gray-900">
            <h3 className="font-semibold mb-2">You’re in control</h3>
            <p className="text-gray-400">
              AI assists you. You make the decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-900 py-12 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <blockquote className="bg-gray-800 p-6 rounded-xl text-gray-300 italic">
            “I dumped my messy internship notes into AmplyAI and it turned them
            into clean bullets in minutes.”
            <span className="block mt-2 text-gray-400">— Beta user</span>
          </blockquote>
          <blockquote className="bg-gray-800 p-6 rounded-xl text-gray-300 italic">
            “The Planner actually made my week doable. It helped me avoid
            over-scheduling and added real buffers around things.”
            <span className="block mt-2 text-gray-400">— Beta user</span>
          </blockquote>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-500">
        <div className="space-x-4">
          <Link href="/privacy" className="underline hover:text-gray-300">
            Privacy
          </Link>
          <Link href="/pricing" className="underline hover:text-gray-300">
            Pricing
          </Link>
          <Link href="/app" className="underline hover:text-gray-300">
            Open App
          </Link>
        </div>
        <div className="mt-2">
          © {new Date().getFullYear()} AmplyAI · Privacy-friendly · No sign-up required
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div className="p-6 rounded-xl border border-gray-800 bg-gray-900 shadow hover:shadow-lg transition">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{desc}</p>
    </div>
  );
}

function RoadmapCard({ title, desc }) {
  return (
    <div className="p-6 rounded-xl border border-gray-800 bg-gray-950 shadow hover:shadow-lg transition">
      <div className="text-sm uppercase text-blue-400 mb-2">Coming soon</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{desc}</p>
    </div>
  );
}
