// /components/FloatingSettingsButton.jsx
import { useEffect } from "react";

export default function FloatingSettingsButton() {
  // Keyboard shortcut: Ctrl+, to open /settings
  useEffect(() => {
    function onKey(e) {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      if (isCtrlOrMeta && e.key === ",") {
        e.preventDefault();
        window.location.href = "/settings";
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <a
      href="/settings"
      title="Settings (Ctrl+,)"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-2xl px-4 py-2
                 bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700
                 shadow-xl backdrop-blur transition"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M19 12a7.05 7.05 0 0 0-.06-.92l1.83-1.43-1.9-3.29-2.19.88a7.14 7.14 0 0 0-1.6-.93l-.33-2.34h-3.8l-.33 2.34c-.57.22-1.11.52-1.6.93l-2.19-.88-1.9 3.29L5.06 11.1A7.05 7.05 0 0 0 5 12c0 .31.02.62.06.92l-1.83 1.43 1.9 3.29 2.19-.88c.49.41 1.03.71 1.6.93l.33 2.34h3.8l.33-2.34c.57-.22 1.11-.52 1.6-.93l2.19.88 1.9-3.29-1.83-1.43c.04-.3.06-.61.06-.92Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
      <span className="text-sm font-medium">Settings</span>
    </a>
  );
}
