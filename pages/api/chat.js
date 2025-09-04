// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { PROMPTS, type TabId } from "@/lib/prompts";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = req.body as {
      messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
      tabId?: TabId;
    };

    const chosenTab: TabId = (body.tabId as TabId) || "chat";
    const systemPrompt = PROMPTS[chosenTab];

    const modelMessages = [
      { role: "system" as const, content: systemPrompt },
      ...(body.messages ?? []),
    ];

    const temperature = chosenTab === "chat" ? 0.7 : 0.4;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // use your preferred model
      messages: modelMessages,
      temperature,
    });

    const content = completion.choices?.[0]?.message?.content ?? "";

    res.status(200).json({ content });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
}
