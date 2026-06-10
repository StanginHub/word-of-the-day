import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the most recent word
    const { data: latest } = await supabase
      .from("daily_words")
      .select("word, fetched_date, ipa, definition")
      .order("fetched_date", { ascending: false })
      .limit(1)
      .single();

    // Count total words
    const { count } = await supabase
      .from("daily_words")
      .select("*", { count: "exact", head: true });

    // Check today's word
    const today = new Date().toISOString().split("T")[0];
    const { data: todayWord } = await supabase
      .from("daily_words")
      .select("word")
      .eq("fetched_date", today)
      .maybeSingle();

    return NextResponse.json({
      status: "ok",
      today_fetched: !!todayWord,
      today_word: todayWord?.word || null,
      latest_word: latest?.word || null,
      latest_date: latest?.fetched_date || null,
      total_words: count || 0,
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: String(err) },
      { status: 500 }
    );
  }
}
