// /utils/focusClient.js
import { parseFocusText } from "./parseFocus";

function getLocalTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

async function readResponse(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return { json: await res.json(), raw: null };
    } catch {
      // fall through to raw
    }
  }
  const raw = await res.text();
  try {
    return { json: JSON.parse(raw), raw };
  } catch {
    return { json: null, raw };
  }
}

export async function tryHandleFocusCommand(rawText) {
  if (!/^block\s/i.test(rawText || "")) return { handled: false };

  const parsed = parseFocusText(rawText);
  if (!parsed?.ok) {
    return { handled: true, ok: false, message: parsed?.error || "Could not parse that focus command." };
  }

  const evt = parsed.data;
  const timezone = evt.timezone || getLocalTimezone();

  // Safety check: the parser should give ISO without timezone suffix
  if (!evt.startISO || !evt.endISO) {
    return { handled: true, ok: false, message: "Parsed times were incomplete. Try: block 2-4pm today for Deep Work" };
  }

  try {
    const res = await fetch("/api/google/calendar/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // same-origin fetch sends cookies by default (needed for your OAuth tokens)
      body: JSON.stringify({
        title: evt.title,
        description: "Created via chat Focus command",
        start: evt.startISO,   // "YYYY-MM-DDTHH:mm:ss"
        end: evt.endISO,
        timezone,              // e.g., "Australia/Melbourne"
        location: "Focus",
      }),
    });

    // Not connected → API returns 401 + {authUrl}
    if (res.status === 401) {
      const { json } = await readResponse(res);
      if (json?.authUrl) {
        // Kick the user into the connect flow
        window.location.href = json.authUrl;
        return { handled: true, ok: false, message: "Redirecting to connect Google…" };
      }
      return { handled: true, ok: false, message: "Google not connected." };
    }

    const { json, raw } = await readResponse(res);

    if (!res.ok) {
      const serverMsg = json?.error || raw || `Server error ${res.status}`;
      return { handled: true, ok: false, message: serverMsg };
    }

    if (json?.htmlLink) {
      try {
        const w = window.open(json.htmlLink, "_blank", "noopener,noreferrer");
        // If popup blocked, still show success message below
        if (!w) console.debug("Popup likely blocked; event link:", json.htmlLink);
      } catch {}
    }

    return { handled: true, ok: true, message: "✅ Focus block created" };
  } catch (err) {
    console.error("focusClient network error:", err);
    return { handled: true, ok: false, message: "Network error while creating the event." };
  }
}
