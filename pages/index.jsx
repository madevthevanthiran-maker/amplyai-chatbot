// pages/index.jsx
import { useState } from "react";
import useLocalState from "../lib/useLocalState";
import Link from "next/link";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useLocalState("pp.messages", [
    {
      role: "assistant",
      text:
        "Hey! I’m your Progress Partner. What do you want to do today?\n• Write a great email (MailMate)\n• Build/refresh your resume (HireHelper)\n• Plan your study/work (Planner)\nOr just ask me something here.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;

    // append user message
    const next = [...messages, { role: "user", text: q }];
    setMessages(next);
    setInput("");

    // quick routes
    const qLower = q.toLowerCase();
    if (qLower.includes("mailmate") || qLower.includes("email")) {
      setMessages([
        ...next,
        {
          role: "assistant",
          text:
            "Opening MailMate… If it didn’t open, click here: /email",
        },
      ]);
      window.location.href = "/email";
      return;
    }
    if (
      qLower.includes("resume") ||
      qLower.includes("cv") ||
      qLower.includes("hirehelper")
    ) {
      setMessages([
        ...next,
        {
          role: "assistant",
          text:
            "Opening HireHelper… If it didn’t open, click here: /hire-helper",
        },
      ]);
      window.location.href = "/hire-helper";
      return;
    }
    if (qLower.includes("plan") || qLower.includes("planner")) {
      setMessages([
        ...next,
        {
          role: "assistant",
          text:
            "Opening Planner… If it didn’t open, click here: /planner",
        },
      ]);
      window.location.href = "/planner";
      return;
    }

    // otherwise ask the backend
    setLoading(true);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        body: JSON.stringify({ prompt: q }),
      });
      const data = await r.json();
      const text =
        data?.text ||
        data?.error ||
        "Sorry, I couldn’t produce a response.";
      setMessages((m) => [...m, { role: "assistant", text }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Network error. Try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <header className="topnav">
        <Link href="/email">MailMate</Link>
        <Link href="/hire-helper">HireHelper</Link>
        <Link href="/planner">Planner</Link>
      </header>

      <section className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.text}
          </div>
        ))}

        <form onSubmit={onSubmit} className="composer">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type what you want to do..."
            disabled={loading}
          />
          <button disabled={loading}>{loading ? "..." : "Send"}</button>
        </form>
      </section>
    </main>
  );
}
