// pages/api/google/oauth/callback.js
import { exchangeCodeForTokens, setAuthCookie } from "../../../../lib/googleClient";

function successHtml() {
  return `<!doctype html>
<html><body style="background:#0b0b10;color:#eaeaf2;font:14px/1.4 system-ui, sans-serif;">
<script>
  try {
    window.opener && window.opener.postMessage({source:"amply-google", ok:true}, "*");
  } catch (e) {}
  window.close();
  setTimeout(function(){ window.location.href="/settings?gcb=1"; }, 500);
</script>
Connecting… You can close this window.
</body></html>`;
}

function errorHtml(message) {
  return `<!doctype html>
<html><body style="background:#0b0b10;color:#eaeaf2;font:14px/1.4 system-ui, sans-serif;">
OAuth callback error: ${message}
</body></html>`;
}

export default async function handler(req, res) {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send(errorHtml("Missing code"));

    const tokens = await exchangeCodeForTokens(code);
    if (!tokens) return res.status(400).send(errorHtml("No tokens"));

    setAuthCookie(res, tokens);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(successHtml());
  } catch (e) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(500).send(errorHtml(e.message));
  }
}
