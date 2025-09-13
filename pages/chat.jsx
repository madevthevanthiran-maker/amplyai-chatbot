import Head from "next/head";
import dynamic from "next/dynamic";

/**
 * SINGLE chat stack page
 * ----------------------
 * Renders ONE thing only: <ChatPanel />.
 * If you previously rendered any of these on this page, REMOVE them:
 *  - PresetBar
 *  - ModeTabs
 *  - ChatBox
 *  - QuickActions / duplicate preset rows
 *
 * ChatPanel already contains its own tabs + ONE preset bar + input.
 */

const ChatPanel = dynamic(() => import("@/components/ChatPanel"), { ssr: false });

export default function ChatPage() {
  return (
    <>
      <Head>
        <title>AmplyAI — Chat</title>
        <meta name="description" content="AmplyAI assistant chat" />
      </Head>

      <main className="min-h-screen bg-[#0b0f1a] text-white">
        {/* Keep the wrapper simple—no extra preset bars or mode tabs here */}
        <div className="mx-auto max-w-5xl px-3 md:px-6 py-4">
          <ChatPanel />
        </div>
      </main>
    </>
  );
}
