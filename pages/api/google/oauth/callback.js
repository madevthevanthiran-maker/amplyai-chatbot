import { exchangeCodeAndSetCookie } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    await exchangeCodeAndSetCookie(req, res);
    // Small HTML that closes popup then notifies opener
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).end(`
<!doctype html><meta charset="utf-8">
<script>
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ source: "amply-google", ok: true }, "*");
    }
  } catch(e) {}
  window.close();
</script>
Connected. You can close this window.
`);
  } catch (e) {
    return res.status(400).send("OAuth callback error: " + e.message);
  }
}
