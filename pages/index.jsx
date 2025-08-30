// pages/index.jsx
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function ProgressPartner() {
  const router = useRouter();
  const [messages, setMessages] = useState([
    { id: "m0", from: "bot", text: "What do you want to do today?" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  function push(role, text) {
    setMessages((m) => [...m, { id: String(Date.now() + Math.random()), from: role, text }]);
  }

  function routeTo(path, msg) {
    push("bot", msg);
    setTimeout(() => router.push(path), 300);
  }

  function detectIntent(t) {
    const s = t.toLowerCase();
    const email = ["email", "mail", "outreach", "follow up", "mailmate"].some((w) => s.includes(w));
    const resume = ["resume", "cv", "hirehelper", "hire helper"].some((w) => s.includes(w));
    const plan = ["plan", "planner", "schedule", "study", "work plan"].some((w) => s.includes(w));
    if (email) return "email";
    if (resume) return "resume";
    if (plan) return "planner";
    return "unknown";
  }

  async function onSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    push("user", text);

    const intent = detectIntent(text);
    if (intent === "email") return routeTo("/email", "Opening MailMate… ✉️");
    if (intent === "resume") return routeTo("/hire-helper", "Opening HireHelper… 📄");
    if (intent === "planner") return routeTo("/planner", "Opening Planner… 🗓️");

    // simple fallback reply
    setIsTyping(true);
    setTimeout(() => {
      push(
        "bot",
        "I can help with:\n• MailMate (email)\n• HireHelper (resume)\n• Planner (study/work)\nWhich one should I open?"
      );
      setIsTyping(false);
    }, 250);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold">AmplyAI — Progress Partner</h1>
          <nav className="flex gap-2 text-sm">
            <Link href="/email" className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">MailMate</Link>
            <Link href="/hire-helper" className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">HireHelper</Link>
            <Link href="/planner" className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">Planner</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          {/* chat */}
          <div className="max-h-[55vh] overflow-auto rounded-xl border bg-gray-50 p-4">
            {messages.map((m) => (
              <div key={m.id} className={`mb-3 flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  m.from === "user" ? "bg-blue-600 text-white" : "bg-white border"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="mb-3 flex justify-start">
                <div className="rounded-2xl bg-white border px-4 py-2 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "120ms" }} />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "240ms" }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* quick chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/email" className="rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50">MailMate (email)</a>
            <a href="/hire-helper" className="rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50">HireHelper (resume)</a>
            <a href="/planner" className="rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50">Planner (study/work)</a>
          </div>

          {/* composer */}
          <form onSubmit={onSubmit} className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type what you want to do…"
              className="flex-1 rounded-xl border px-3 py-2 outline-none ring-blue-200 focus:ring"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.shiftKey) return; // allow newline later if needed
              }}
            />
            <button type="submit" className="rounded-xl bg-black px-4 py-2 text-white">Send</button>
          </form>
        </div>
      </main>
    </div>
  );
}
