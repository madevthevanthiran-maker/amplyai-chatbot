// lib/analytics.js
export function track(eventName, props = {}) {
  try {
    if (typeof window !== "undefined" && window.plausible) {
      window.plausible(eventName, { props });
    }
  } catch {}
}
