import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("announcements").select("*").eq("id", 1).single();
    return NextResponse.json({ title: data?.title || "", body: data?.body || "", enabled: data?.enabled || false });
  } catch {
    return NextResponse.json({ title: "", body: "", enabled: false });
  }
}
