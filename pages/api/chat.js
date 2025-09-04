// pages/api/chat.js
import OpenAI from "openai";
import { MODES } from "@/lib/modes";

export const config = {
  runtime: "edge",
};

function encode(str) {
  return new TextEncoder().encode(str);
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = await req.json();
  const { mode = "general", messages = [] } = body;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const systemPrompt = MODES[mode]?.system || MODES.general.system;

  const fullMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    // Stream with the Chat Completions API
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: fullMessages,
      temperature: 0.3,
      stream: true,
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of stream) {
            const token = part.choices?.[0]?.delta?.content || "";
            if (token) controller.enqueue(encode(token));
          }
        } catch (err) {
          controller.enqueue(encode("\n\n[Stream ended]"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    return new Response("OpenAI error", { status: 500 });
  }
}
