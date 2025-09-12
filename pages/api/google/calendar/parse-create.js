import { createCalendarEvent } from '../../../../lib/calendar';
import { parseFocus } from '../../../../utils/parseFocus';

/**
 * POST /api/google/calendar/parse-create
 * Body: { text: string, tokens: {...}, timezone? }
 * NOTE: If you store tokens in a cookie/session, you can fetch them here instead of reading from body.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { text, tokens, timezone } = req.body || {};
    if (!text) return res.status(400).json({ error: 'Missing text' });
    if (!tokens) return res.status(401).json({ error: 'Not connected' });

    const parsed = parseFocus(text, { timezone });
    if (parsed.error) return res.status(400).json({ error: 'PARSE_ERROR', detail: parsed });

    const { title, startISO, endISO, allDay, timezone: tz } = parsed;
    const result = await createCalendarEvent(tokens, {
      summary: title,
      description: allDay ? 'All-day block (auto)' : 'Created by AmplyAI',
      startISO, endISO, timeZone: tz,
    });

    if (result.error) return res.status(500).json(result);
    return res.status(200).json({ ok: true, parsed, event: result.event, refreshed: result.refreshed, tokens: result.tokens });
  } catch (e) {
    console.error('[parse-create] fatal', e);
    return res.status(500).json({ error: 'INTERNAL', message: e.message });
  }
}
