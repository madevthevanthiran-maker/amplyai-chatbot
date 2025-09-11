// /utils/focusClient.js
import { parseFocusText } from "./parseFocus";

// Read text or JSON safely
async function readResponse(res) {
  const text = await res.text();
  try { return { json: JSON.parse(text), raw: text }; }
  catch { return { json: null, raw: text }; }
}

export async function tryHandleFocusCommand(rawText) {
  try {
    if (!/^block\s/i.test(rawText || "")) return { handled: false };

    // Normalize dashes early to avoid any .split() mishaps upstream
    const normalized = (rawText || "")
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, "-")
      .replace(/\u00A0|\u2007|\u202F/g, " ");

    const parsed = parseFocusText(normalized);
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
      const { json } = await readResponse(res);
      if (json?.authUrl) {
        window.location.href = json.authUrl;
        return { handled: true, ok: false, message: "Redirecting to connect Google…" };
      }
      return { handled: true, ok: false, message: "Google not connected" };
    }

    const { json, raw } = await readResponse(res);
    if (!res.ok) {
      const serverMsg = json?.error || raw || `Server error ${res.status}`;
      return { handled: true, ok: false, message: serverMsg };
    }

    if (json?.htmlLink) {
      try { window.open(json.htmlLink, "_blank", "noopener,noreferrer"); } catch {}
    }
    return { handled: true, ok: true, message: "Focus block created" };
  } catch (err) {
    // <- This prevents the raw “reading 'parse'” from bubbling to the UI
    const msg =
      err && typeof err.message === "string"
        ? err.message
        : "Unexpected error while creating the focus block.";
    return {
      handled: true,
      ok: false,
      message: `${msg} Try: block 2-4pm today for Deep Work`,
    };
  }
}
