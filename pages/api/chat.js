export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobRole, tone, resumeText } = req.body;

  if (!jobRole || !tone || !resumeText) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert resume writer. Rewrite resumes to match the job role and tone requested.",
          },
          {
            role: "user",
            content: `Job role: ${jobRole}\nTone: ${tone}\nResume: ${resumeText}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const output = data.choices[0].message.content.trim();
    return res.status(200).json({ result: output });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
