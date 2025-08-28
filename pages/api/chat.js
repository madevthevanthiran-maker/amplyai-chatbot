// pages/api/chat.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Optional: small helper to map your layout choice to formatting guidance
const layoutGuidance = (layout) => {
  switch ((layout || "").toLowerCase()) {
    case "modern ats":
    case "modern":
      return `
- Use clear section headings, short bullet points, and strong action verbs.
- Prioritize impact with metrics (e.g., "Reduced latency by 35%").
- Keep lines concise; avoid tables, columns, and graphics (ATS friendly).
- Prefer bold section headers and consistent date alignment (e.g., "Jan 2023 – Present").`;
    case "creative":
      return `
- Use engaging but readable formatting and concise storytelling.
- Keep bullets tight; you may add a 1–2 line "Value Proposition" above Summary.
- Still avoid tables/columns so output remains easy to copy into a doc.`;
    case "minimal":
      return `
- Keep it very clean and spare: short bullets, minimal styling.
- Favor compact sections and only essential details.`;
    case "classic":
    default:
      return `
- Standard professional layout with clear section headings and bullet points.
- Keep it readable and ATS-friendly (no tables/columns).`;
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { jobRole, layout, resumeText } = req.body || {};

    // Basic validation
    if (!jobRole || !resumeText) {
      return res.status(400).json({
        ok: false,
        error:
          "Missing required fields. Please provide both 'jobRole' and 'resumeText'.",
      });
    }

    const layoutHelp = layoutGuidance(layout);

    // System + user messages for Chat Completions
    const messages = [
      {
        role: "system",
        content: `
You are an expert resume writer and career coach. 
Your goals:
- Improve clarity, impact, and relevance for the target job role.
- Do NOT invent information. If information is missing, insert a clear TODO placeholder like: [TODO: Add organisation name].
- Keep output ATS-friendly (no tables/columns). Use Markdown headings and bullet points only.
- Use strong action verbs, quantifiable achievements where available, and crisp bullets (max ~1–2 lines each).
- Maintain a professional, readable tone appropriate for job applications.`,
      },
      {
        role: "user",
        content: `
Target job role: ${jobRole}
Desired layout: ${layout || "Classic"}

Apply the following layout guidance:
${layoutHelp}

Rewrite and structure the provided text into a polished resume in Markdown.
Output sections in this order (include only meaningful sections; use TODO placeholders if info is missing):
1. **Summary**
2. **Experience** (for each role: Organisation, Title, Location (optional), Dates (e.g., Jan 2022 – Mar 2024), concise bullets of impact; include "Reason for leaving" if provided)
3. **Education**
4. **Certifications**
5. **Skills** (group by categories if helpful)
6. **Achievements** (if applicable)
7. **Referees** (list at least two with placeholder fields if not provided)
8. **Hobbies / Interests** (optional, if relevant)

Important rules:
- Do not fabricate details. Use [TODO: ...] where data is missing (e.g., [TODO: Organisation], [TODO: Dates], [TODO: Reason for leaving], [TODO: Referee contact]).
- Make content concise and relevant to the "${jobRole}" role.
- Use Markdown headings (##) and bullet points (-).
- Keep the language professional and easy to paste into Word/Docs.

User-provided resume text (improve/transform it):
---
${resumeText}
---`,
      },
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 1200,
      messages,
    });

    const text =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a response.";

    return res.status(200).json({ ok: true, text });
  } catch (err) {
    console.error("API /chat error:", err);
    // Try to expose a helpful message when possible
    const msg =
      err?.response?.data?.error?.message ||
      err?.message ||
      "Unexpected error";
    return res.status(500).json({ ok: false, error: msg });
  }
}
