// /utils/focusClient.js
import { parseFocusText } from "./parseFocus";

export async function tryHandleFocusCommand(rawText) {
  if (!/^block\s/i.test(rawText || "")) return { handled: false };

  const parsed = parseFocusText(rawText);
  if (!parsed.ok) {
    return { handled: true, ok: false, message: parsed.error };
  }

  const evt = parsed.data;
  const res = await fetch("/api/google/calendar/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: evt.title,
      description: "Created via chat Focus command",
      start: evt.startISO,
      end: evt.endISO,
      timezone: evt.timezone,
      location: "Focus",
    }),
  });

  if (res.status === 401) {
    const { authUrl } = await res.json().catch(() => ({}));
    if (authUrl) {
      window.location.href = authUrl;
      return { handled: true, ok: false, message: "Redirecting to connect Google…" };
    }
    return { handled: true, ok: false, message: "Google not connected" };
  }

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { error: text }; }

  if (!res.ok) {
    return { handled: true, ok: false, message: data.error || `Server error ${res.status}` };
  }

  if (data.htmlLink) window.open(data.htmlLink, "_blank", "noopener,noreferrer");
  return { handled: true, ok: true, message: "Focus block created" };
}
