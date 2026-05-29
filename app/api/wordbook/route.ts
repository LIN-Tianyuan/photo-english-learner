import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { WordItem } from "@/app/api/analyze/route";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("wordbook")
    .select("word, translation, pronunciation, example, example_translation, x, y")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const words: WordItem[] = (data ?? []).map((row) => ({
    word: row.word,
    translation: row.translation,
    pronunciation: row.pronunciation,
    example: row.example,
    exampleTranslation: row.example_translation,
    x: row.x,
    y: row.y,
  }));

  return NextResponse.json({ words });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const word: WordItem = await req.json();

  const { error } = await supabase.from("wordbook").upsert({
    user_id: userId,
    word: word.word,
    translation: word.translation,
    pronunciation: word.pronunciation,
    example: word.example,
    example_translation: word.exampleTranslation,
    x: word.x,
    y: word.y,
  }, { onConflict: "user_id,word" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { word } = await req.json();

  const { error } = await supabase
    .from("wordbook")
    .delete()
    .eq("user_id", userId)
    .eq("word", word);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
