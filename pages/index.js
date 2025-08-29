// pages/index.jsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="container">
      <header className="topbar">
        <h1>
          AmplyAI — <span className="brand">Progress Partner</span>
        </h1>
      </header>

      <div className="chatbox">
        <p>Hey! I’m your Progress Partner. What do you want to do today?</p>
        <ul>
          <li>
            <Link href="/email">✉️ Write a great email (MailMate)</Link>
          </li>
          <li>
            <Link href="/resume">📄 Build/refresh your resume (HireHelper)</Link>
          </li>
          <li>💬 Or just ask me questions here.</li>
        </ul>
      </div>

      <style jsx>{`
        .container { max-width: 700px; margin: 40px auto; padding: 0 16px; }
        .topbar { margin-bottom: 16px; }
        .brand { color: #1e293b; }
        .chatbox {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
        }
        ul { margin: 12px 0 0; padding-left: 20px; }
        li { margin-bottom: 8px; }
        a { text-decoration: none; color: #0070f3; }
        a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
