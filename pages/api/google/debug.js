import { diag } from "../../../lib/googleClient";

export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    diag: diag(req),
    note:
      "If connect/login shows 500, this endpoint helps confirm env + cookie state. " +
      "redirectUri must match Google Cloud Console exactly (Authorized redirect URI).",
  });
}
