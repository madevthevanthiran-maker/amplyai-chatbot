// pages/index.jsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Less Stress. <span className="text-blue-500">More Progress.</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          A multi-tab AI that helps you{" "}
          <span className="font-semibold text-gray-200">land the job</span>,{" "}
          <span className="font-semibold text-gray-200">write better emails</span>,{" "}
          <span className="font-semibold text-gray-200">plan your week</span>, and{" "}
          <span className="font-semibold text-gray-200">get answers</span> — all in
          one clean interface.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/app">
            <button className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 font-medium">
              Open App
            </button>
          </Link>
          <a
            href="#features"
            className="px-6 py-3 rounded-full border border-gray-700 hover:bg-gray-800 font-medium"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8">
        <FeatureCard
          title="HireHelper"
          desc="Turn messy experience into recruiter-ready bullets. Quantified, STAR-tight."
          link="/app?tab=hirehelper"
        />
        <FeatureCard
          title="MailMate"
          desc="Write clear, outcome-driven emails with subject lines and variants."
          link="/app?tab=mailmate"
        />
        <FeatureCard
          title="Planner"
          desc="Break goals into doable tasks and schedules with realistic buffers."
          link="/app?tab=planner"
        />
        <FeatureCard
          title="Progress Partner"
          desc="Your general assistant for life & work. Quick answers, no fuss."
          link="/app?tab=chat"
        />
      </section>

      {/* Testimonials */}
      <section className="bg-gray-900 py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <blockquote className="bg-gray-800 p-6 rounded-xl text-gray-300 italic">
            “I dumped my messy internship notes into AmplyAI and it turned them into
            clean, recruiter-ready bullets in minutes. Way easier than staring at a
            blank page.” <span className="block mt-2 text-gray-400">— Beta user</span>
          </blockquote>
          <blockquote className="bg-gray-800 p-6 rounded-xl text-gray-300 italic">
            “The Planner actually made my week doable. It helped me avoid
            over-scheduling and added real buffers around things. Total lifesaver.”{" "}
            <span className="block mt-2 text-gray-400">— Beta user</span>
          </blockquote>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-500">
        © {new Date().getFullYear()} AmplyAI · Privacy-friendly · No sign-up required
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc, link }) {
  return (
    <div className="p-6 rounded-xl border border-gray-800 bg-gray-900 shadow hover:shadow-lg transition">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 mb-4">{desc}</p>
      <Link href={link}>
        <button className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-sm font-medium">
          Open {title}
        </button>
      </Link>
    </div>
  );
}
