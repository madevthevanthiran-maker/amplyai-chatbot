import { useEffect } from "react";

/**
 * Toast
 * -----
 * Simple ephemeral toast with auto-dismiss.
 *
 * Props:
 *  - message: string (plain or markdown-like text)
 *  - link?: { href: string, label?: string }
 *  - onClose: () => void
 *  - duration?: number (ms, default 5000)
 */
export default function Toast({ message, link, onClose, duration = 5000 }) {
  useEffect(() => {
    const id = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(id);
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-fade-in">
      <div className="rounded-lg border border-white/10 bg-white/10 backdrop-blur-md px-4 py-3 text-sm text-white shadow-lg">
        <div className="mb-1">{message}</div>
        {link && (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md border border-indigo-400 bg-indigo-600/80 px-3 py-1 text-xs text-white hover:bg-indigo-600"
          >
            {link.label || "Open"}
          </a>
        )}
      </div>
      <style jsx>{`
        .animate-fade-in {
          animation: fade-in 0.25s ease-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
