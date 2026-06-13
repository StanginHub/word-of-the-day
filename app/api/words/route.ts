import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get("offset") || "0");
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("daily_words")
      .select("id,word,fetched_date,thai_translations,definition,pos,ipa,cefr,topic")
      .order("fetched_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
