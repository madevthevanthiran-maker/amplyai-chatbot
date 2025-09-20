import { calendarClientFromCookie, safeDiag } from "../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const r = await calendarClientFromCookie(req);
    if (!r.ok) {
      return res.status(200).json({
        ok: true,
        status: { connected: false, reason: r.reason },
        diag: safeDiag(),
      });
    }
    // Quick no-op to verify token is usable (don’t call external API here)
    return res.status(200).json({
      ok: true,
      status: { connected: true },
      diag: safeDiag(),
    });
  } catch (e) {
    return res.status(200).json({
      ok: false,
      error: e.message,
      diag: safeDiag(),
    });
  }
}
