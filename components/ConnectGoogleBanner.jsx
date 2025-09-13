import { useState } from "react";

/**
 * ConnectGoogleBanner
 * -------------------
 * Small non-intrusive card that appears when Google isn't connected.
 * Renders a “Connect Google” button that starts the OAuth flow.
 *
 * Props:
 *  - onConnect?: () => void   // optional; defaults to redirecting to /api/google/oauth/start
 *  - className?: string
 *  - message?: string         // override default copy
 */
export default function ConnectGoogleBanner({
  onConnect,
  className = "",
  message = "Connect Google Calendar to create events right from chat.",
}) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);

    try {
      if (onConnect) {
        await onConnect();
      } else {
        // default: kick off OAuth in the same tab and return to /chat
        const returnTo = typeof window !== "undefined" ? window.location.pathname : "/chat";
        const url = `/api/google/oauth/start?returnTo=${encodeURIComponent(returnTo)}`;
        window.location.href = url;
      }
    } catch {
      // swallow; the redirect path covers most cases
    } finally {
      // NOTE: we usually won't hit this after redirect, but it's safe.
      setBusy(false);
    }
  };

  return (
    <div
      className={[
        "rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3",
        "flex items-center justify-between gap-3",
        className,
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <GoogleCalendarIcon className="h-5 w-5" />
        <div className="text-sm text-white/90">{message}</div>
      </div>

      <button
        onClick={handleClick}
        disabled={busy}
        className="shrink-0 rounded-lg border border-indigo-500 bg-indigo-600 px-3 py-1.5 text-sm text-white disabled:opacity-60"
      >
        {busy ? "Opening…" : "Connect Google"}
      </button>
    </div>
  );
}

function GoogleCalendarIcon(props) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="a" x1="5.5" x2="42.1" y1="14.6" y2="35.1" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4285f4" />
          <stop offset="1" stopColor="#2a56c6" />
        </linearGradient>
      </defs>
      <rect width="40" height="34" x="4" y="10" rx="6" fill="url(#a)" />
      <rect width="32" height="26" x="8" y="14" rx="4" fill="#fff" />
      <rect width="12" height="4" x="18" y="6" rx="2" fill="#1a73e8" />
      <circle cx="17" cy="26" r="2" fill="#1a73e8" />
      <rect width="14" height="2.5" x="21" y="25" rx="1.25" fill="#1a73e8" />
      <rect width="14" height="2.5" x="21" y="31" rx="1.25" fill="#1a73e8" />
    </svg>
  );
}
