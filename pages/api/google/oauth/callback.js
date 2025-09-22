import { exchangeCodeAndStore } from '@/lib/googleClient';

export default async function handler(req, res) {
  const PROD_ORIGIN = 'https://amplyai-chatbot.vercel.app';

  const { code, state: rawState } = req.query;
  if (!code || !rawState) {
    res.status(400).send('Missing code/state');
    return;
  }

  let state;
  try {
    state = JSON.parse(decodeURIComponent(rawState));
  } catch {
    res.status(400).send('Bad state');
    return;
  }

  // CSRF check
  const csrfCookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('g_csrf='));
  const csrf = csrfCookie?.split('=')[1];
  if (!csrf || csrf !== state.csrf) {
    res.status(400).send('CSRF failed');
    return;
  }

  const redirectUri = `${PROD_ORIGIN}/api/google/oauth/callback`;

  try {
    // This should set your session/tokens cookies for the **prod domain**
    await exchangeCodeAndStore({ req, res, code, redirectUri });

    // Go back to where the user started (preview/local/prod) or default to prod settings
    const back = state.returnTo || `${PROD_ORIGIN}/settings`;
    res.writeHead(302, { Location: back });
    res.end();
  } catch (e) {
    console.error(e);
    res.status(500).send('OAuth exchange failed');
  }
}
