// pages/hire-helper.jsx
import Link from "next/link";

export default function HireHelper() {
  return (
    <main className="container">
      <header className="topbar">
        <h1>HireHelper — Resume Builder</h1>
        <Link href="/" className="back">← Back to Progress Partner</Link>
      </header>

      <section className="card">
        <label>Job role you’re applying for</label>
        <input placeholder="e.g., Software Engineer, Marketing Manager" />

        <label>Desired layout</label>
        <select defaultValue="Modern / Minimal">
          <option>Modern / Minimal</option>
          <option>ATS Friendly</option>
          <option>Academic CV</option>
        </select>

        <details>
          <summary>Advanced (optional): Tone</summary>
          <div className="chips">
            <button type="button">Professional</button>
            <button type="button">Friendly</button>
            <button type="button">Confident</button>
          </div>
        </details>
      </section>

      <section className="card">
        <h2>Work Experience</h2>
        <div className="grid">
          <input placeholder="Organisation" />
          <input placeholder="Position / Role" />
          <input placeholder="City" />
          <input placeholder="Country" />
          <input placeholder="Start (MM/YYYY)" />
          <input placeholder="End (MM/YYYY or Present)" />
        </div>
        <textarea placeholder="Job description / responsibilities" rows={5} />
      </section>
    </main>
  );
}
