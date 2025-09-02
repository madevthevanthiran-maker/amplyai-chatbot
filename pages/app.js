// pages/app.js  (only the relevant additions shown)
import Head from "next/head";
import React from "react";
import CommandMenu from "@/components/CommandMenu";
import FeedbackButton from "@/components/FeedbackButton";
// …your other imports

export default function AppPage() {
  // you already have these states; adapt names if different
  const [tab, setTab] = React.useState("chat"); // or whatever you use
  const tabs = [
    { key: "chat", label: "Chat (general)" },
    { key: "mailmate", label: "MailMate (email)" },
    { key: "hirehelper", label: "HireHelper (resume)" },
    { key: "planner", label: "Planner (study/work)" },
  ];

  const [cmdOpen, setCmdOpen] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onSelectTab = (key) => {
    if (key === "__noop__") return;
    setTab(key);
    try { window?.track?.("tab_select", { tab: key }); } catch {}
  };

  return (
    <>
      <Head><title>Progress Partner</title></Head>

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 bg-blue-500 rounded-full" />
          <span className="font-semibold">AmplyAI</span>
          <span className="text-gray-400">— Progress Partner</span>

          {/* tab pills (your existing UI) */}
          <div className="ml-auto flex items-center gap-2">
            {/* feedback button */}
            <FeedbackButton tabId={tab} />
            <button
              onClick={() => setCmdOpen(true)}
              className="px-3 py-1.5 rounded-full border border-gray-700 text-xs text-gray-200 hover:bg-gray-800/70"
              title="Open command menu (⌘/Ctrl+K)"
            >
              ⌘K
            </button>
          </div>
        </div>
      </div>

      {/* … your existing body renders the selected tab … */}

      {/* Command menu overlay */}
      <CommandMenu
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        tabs={tabs}
        current={tab}
        onSelect={onSelectTab}
      />
    </>
  );
}
