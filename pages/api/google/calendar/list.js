import { listUpcomingEvents } from '../../../../lib/calendar';

/**
 * POST /api/google/calendar/list
 * Body: { tokens, maxResults?, timeMinISO? }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { tokens, maxResults = 10, timeMinISO } = req.body || {};
    if (!tokens) return res.status(401).json({ error: 'Not connected' });

    const result = await listUpcomingEvents(tokens, { maxResults, timeMinISO });
    if (result.error) return res.status(500).json(result);
    return res.status(200).json({ ok: true, events: result.events, refreshed: result.refreshed, tokens: result.tokens });
  } catch (e) {
    console.error('[calendar.list] fatal', e);
    return res.status(500).json({ error: 'INTERNAL', message: e.message });
  }
}
