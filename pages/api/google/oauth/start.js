import { getAuthUrl } from '@/lib/googleClient';

export default async function handler(req, res) {
  const PROD_ORIGIN = 'https://amplyai-chatbot.vercel.app';

  // where to send the user back after successful login
  const returnTo = typeof req.query.returnTo === 'string' && req.query.returnTo.startsWith('http')
    ? req.query.returnTo
    : PROD_ORIGIN;

  // state carries both CSRF and returnTo
  const state = {
    csrf: crypto.randomUUID(),
    returnTo,
  };

  // IMPORTANT: always use the prod redirect URI (must match Google Console)
  const redirectUri = `${PROD_ORIGIN}/api/google/oauth/callback`;

  const authUrl = getAuthUrl({ redirectUri, state });

  // Set a short-lived cookie to validate CSRF (optional but recommended)
  res.setHeader('Set-Cookie', [
    `g_csrf=${state.csrf}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
  ]);

  // Send user to Google
  res.writeHead(302, { Location: authUrl });
  res.end();
}
