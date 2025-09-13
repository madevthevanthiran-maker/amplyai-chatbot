import Head from "next/head";
import dynamic from "next/dynamic";

/**
 * SINGLE chat stack page
 * ----------------------
 * This page renders ONE component: <ChatPanel />.
 * ChatPanel already includes:
 *   - Mode tabs (general / mailmate / hirehelper / planner / focus)
 *   - One PresetBar wired to send messages
 *   - Enter-to-send via <ChatInput /> (Shift+Enter for newline)
 *   - Calendar routing (uses /api/chat and /api/google/*)
 *
 * IMPORTANT:
 * - Remove/ignore any other chat UIs on this route to avoid double wiring.
 * - If you previously imported ChatBox here, that’s now gone.
 */

// Dynamic import avoids any SSR/browser API mismatch in ChatPanel
const ChatPanel = dynamic(() => import("@/components/ChatPanel"), {
  ssr: false,
});

export default function ChatPage() {
  return (
    <>
      <Head>
        <title>AmplyAI — Chat</title>
        <meta name="description" content="AmplyAI assistant chat" />
      </Head>

      {/* Background wrapper (keeps the page consistent with app styling) */}
      <main className="min-h-screen bg-[#0b0f1a] text-white">
        <div className="mx-auto max-w-5xl px-3 md:px-6 py-4">
          <ChatPanel />
        </div>
      </main>
    </>
  );
}
