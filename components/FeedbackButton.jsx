// components/FeedbackButton.jsx
import React from "react";
import { loadMessages } from "@/lib/persistedChat";

export default function FeedbackButton({ tabId, to = "hello@amplyai.org" }) {
  const onClick = () => {
    const msgs = loadMessages(tabId).filter(m => m.role !== "system");
    const last = msgs.slice(-10); // keep it short
    const lines = last.map(m => `${m.role.toUpperCase()}: ${m.content}`);
    const body = [
      `AmplyAI feedback`,
      ``,
      `Tab: ${tabId}`,
      `---`,
      ...lines,
      ``,
      `Your thoughts:`,
    ].join("\n");

    const params = new URLSearchParams({
      subject: `AmplyAI feedback — ${tabId}`,
      body,
    });
    window.location.href = `mailto:${to}?${params.toString()}`;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full border border-gray-700 text-xs text-gray-200 hover:bg-gray-800/70"
      title="Send feedback"
    >
      Feedback
    </button>
  );
}
