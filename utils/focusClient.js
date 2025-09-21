// Small client that tries the canonical endpoint first, then aliases.
export async function createEventFromText(text, timezone) {
  const tz =
    timezone ||
    (typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC");

  const payload = { text, timezone: tz };

  const tryFetch = (url) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

  let res = await tryFetch("/api/google/calendar/parse-create");
  let data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    res = await tryFetch("/api/google/calendar/focus");
    data = await res.json().catch(() => ({}));
  }
  if (!res.ok || !data?.ok) {
    res = await tryFetch("/api/google/focus");
    data = await res.json().catch(() => ({}));
  }
  if (!res.ok || !data?.ok) {
    throw new Error(data?.message || `HTTP ${res.status}`);
  }
  return data; // { ok, parsed, created }
}
