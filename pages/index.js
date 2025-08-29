// pages/index.jsx
import Link from "next/link";

function Row({ emoji, children }) {
  return (
    <li>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <div>{children}</div>
    </li>
  );
}

export default function Home() {
  return (
    <main className="container">
      <header className="topbar">
        <h1>AmplyAI — Progress Partner</h1>
      </header>

      <section className="card">
        <p style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>
          Hey! I’m your <strong>Progress Partner</strong>. What do you want to
          do today?
        </p>

        <ul className="choices">
          <Row emoji="✉️">
            <Link href="/email">Write a great email (MailMate)</Link>
            <div style={{ color: "#64748b", fontSize: 14 }}>
              Compose crisp outreach, follow-ups, or updates in seconds.
            </div>
          </Row>

          <Row emoji="📄">
            <Link href="/hire-helper">Build/refresh your resume (HireHelper)</Link>
            <div style={{ color: "#64748b", fontSize: 14 }}>
              Pick a layout, add roles, and let AI polish the draft.
            </div>
          </Row>

          <Row emoji="💬">
            <span>Or just ask me questions here.</span>
            <div style={{ color: "#64748b", fontSize: 14 }}>
              (Q&A chat coming next — we’ll plug it in soon.)
            </div>
          </Row>
        </ul>
      </section>
    </main>
  );
}
