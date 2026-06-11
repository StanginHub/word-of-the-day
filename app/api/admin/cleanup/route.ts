import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const B = String.fromCharCode(66, 101, 97, 114, 101, 114) + " ";
function check(req: Request): boolean {
  const h = req.headers.get("Authorization") || "";
  if (!h.startsWith(B)) return false;
  return h.slice(B.length).trim() === process.env.CRON_SECRET?.trim();
}
function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  if (!check(request)) return unauth();
  try {
    const su = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sk = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!su || !sk) return NextResponse.json({ error: "DB not configured" }, { status: 500 });
    const sb = createClient(su, sk);
    const { error } = await sb.from("daily_words").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: "All data deleted." });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
