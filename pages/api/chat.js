// pages/api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { jobRole, layout, tone, resumeText } = req.body || {};
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
  }
  if (!resumeText || !jobRole) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Build the prompt from your new form fields
  const system = `
You are an expert resume writer. Restructure and improve the user's resume content.
Follow the requested layout (“${layout || 'Standard 1-column'}”) and keep content concise, factual, and ATS-friendly.
If some details are missing, insert clear placeholders the user can fill later (e.g., [ORGANISATION NAME], [DATES], [REFEREE]).
${tone ? `Maintain a ${tone.toLowerCase()} tone.` : ''}
Return only the rewritten resume text—no extra commentary.
`;

  const user = `
Job role they’re applying for: ${jobRole}

Current resume text (raw):
${resumeText}
`;

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system.trim() },
          { role: 'user', content: user.trim() },
        ],
        temperature: 0.3,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return res.status(resp.status).json({ error: err || 'OpenAI API error' });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || '';

    return res.status(200).json({ result: content });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unexpected error' });
  }
}
