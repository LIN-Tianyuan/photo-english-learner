import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const client = new Anthropic();

export interface WordItem {
  word: string;
  translation: string;
  pronunciation: string;
  example: string;
  exampleTranslation: string;
  x: number; // percentage from left
  y: number; // percentage from top
}

export type DifficultyLevel = "any" | "beginner" | "intermediate" | "advanced";

const DIFFICULTY_INSTRUCTIONS: Record<DifficultyLevel, string> = {
  any: "Choose the most interesting and varied words from the image — no restriction on difficulty.",
  beginner:
    "Choose only A1/A2 level words — very common everyday words that a complete beginner would learn first (e.g. cup, chair, tree, door).",
  intermediate:
    "Choose B1/B2 level words — useful but slightly less common words that an intermediate learner would benefit from (e.g. faucet, curtain, pavement, blossom).",
  advanced:
    "Choose C1/C2 level words — precise, nuanced, or domain-specific vocabulary that would challenge an advanced learner (e.g. foliage, fixture, cobblestone, canopy).",
};

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, difficulty = "any" } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }

    const difficultyInstruction = DIFFICULTY_INSTRUCTIONS[difficulty as DifficultyLevel] ?? DIFFICULTY_INSTRUCTIONS.any;

    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `Analyze this image and identify 3-5 objects or things that an English learner would benefit from knowing.

Difficulty: ${difficultyInstruction}

For each item, provide its position in the image as a percentage (0-100) from the top-left corner.

Return ONLY a valid JSON array with no markdown formatting, no code blocks, just raw JSON:
[
  {
    "word": "the English word",
    "translation": "中文翻译",
    "pronunciation": "pronunciation hint like /wɜːrd/",
    "example": "A natural example sentence using the word.",
    "exampleTranslation": "例句的中文翻译",
    "x": 50,
    "y": 30
  }
]

The x and y values represent where the word label should appear on the image as a percentage of the image dimensions. Choose positions close to the actual object.`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
    const words: WordItem[] = JSON.parse(cleaned);

    return NextResponse.json({ words });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
  }
}
