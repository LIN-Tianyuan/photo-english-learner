import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const client = new Anthropic();

export interface DialogueLine {
  speaker: "Friend" | "Me";
  english: string;
  chinese: string;
}

export interface ConversationResult {
  story: { english: string; chinese: string };
  smalltalk: DialogueLine[];
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, words } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }

    const wordList = (words as { word: string }[]).map((w) => w.word).join(", ");

    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data: imageBase64 },
            },
            {
              type: "text",
              text: `Look at this photo. Some English words identified in it: ${wordList}.

Generate two things:

1. MY STORY: A natural 3-4 sentence first-person narrative about this scene — as if the user is describing it to a friend. Casual tone, naturally use 1-2 of the identified words. Great for WeChat captions or telling a colleague about your day.

2. SMALL TALK: A realistic 3-exchange casual dialogue where a friend/colleague asks about what they see in this photo, and the user responds naturally. The kind of conversation that happens at school or work.

Return ONLY valid JSON, no markdown:
{
  "story": {
    "english": "...",
    "chinese": "..."
  },
  "smalltalk": [
    { "speaker": "Friend", "english": "...", "chinese": "..." },
    { "speaker": "Me",     "english": "...", "chinese": "..." },
    { "speaker": "Friend", "english": "...", "chinese": "..." },
    { "speaker": "Me",     "english": "...", "chinese": "..." },
    { "speaker": "Friend", "english": "...", "chinese": "..." },
    { "speaker": "Me",     "english": "...", "chinese": "..." }
  ]
}`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
    const result: ConversationResult = JSON.parse(cleaned);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Conversation error:", error);
    return NextResponse.json({ error: "Failed to generate conversation" }, { status: 500 });
  }
}
