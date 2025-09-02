// lib/analytics.js
export function track(event, props = {}) {
  try {
    if (typeof window !== "undefined" && window.plausible) {
      window.plausible(event, { props });
    }
  } catch {}
}
