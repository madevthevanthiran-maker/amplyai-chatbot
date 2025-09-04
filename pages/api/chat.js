// pages/api/chat.js
export default async function handler(req, res) {
  try {
    const { text, mode } = req.body || {};
    // TODO: Replace with your model call.
    // This is a stub to show different formatting hints per mode.
    let prefix = "";
    if (mode === "mailmate") {
      prefix = "📧 MailMate draft\n\n";
    } else if (mode === "hirehelper") {
      prefix = "🧰 HireHelper bullets\n\n";
    } else if (mode === "planner") {
      prefix = "🗓️ Planner plan\n\n";
    } else {
      prefix = "";
    }

    const reply =
      prefix +
      `You said:\n\n${text}\n\n(Replace this with your model output.)`;

    res.status(200).json({ ok: true, message: reply });
  } catch (e) {
    res.status(200).json({ ok: true, message: "Error. Please try again." });
  }
}
