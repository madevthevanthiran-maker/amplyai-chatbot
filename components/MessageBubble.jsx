/**
 * Presentational-only bubble. No logic changes.
 */
export default function MessageBubble({ role, children }) {
  const isUser = role === "user";
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] md:max-w-[75%] whitespace-pre-wrap leading-relaxed",
          "rounded-2xl px-4 py-3 shadow-sm",
          isUser
            ? "bg-indigo-600/20 text-indigo-100 border border-indigo-400/20"
            : "bg-white/10 text-white border border-white/10",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
