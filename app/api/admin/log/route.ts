import { NextResponse } from "next/server";
const B = String.fromCharCode(66, 101, 97, 114, 101, 114) + " ";
function check(req: Request): boolean {
  const h = req.headers.get("Authorization")||""; if(!h.startsWith(B))return false;
  return h.slice(B.length).trim()===process.env.CRON_SECRET?.trim();
}
const unauth = () => NextResponse.json({error:"Unauthorized"},{status:401});

const su = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sk = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(su!, sk!);
}

export async function GET(request: Request) {
  if (!check(request)) return unauth();
  try {
    const sb = await getClient();
    const { data } = await sb.from("activity_log").select("*").order("created_at", {ascending: false}).limit(50);
    return NextResponse.json({logs: data || []});
  } catch(e:unknown) {
    return NextResponse.json({error:e instanceof Error?e.message:String(e)},{status:500});
  }
}

export async function POST(request: Request) {
  if (!check(request)) return unauth();
  try {
    const { action, detail } = await request.json();
    if (!action) return NextResponse.json({error:"Missing action"},{status:400});
    const sb = await getClient();
    await sb.from("activity_log").insert({ action, detail: detail || null });
    return NextResponse.json({success:true});
  } catch(e:unknown) {
    return NextResponse.json({error:e instanceof Error?e.message:String(e)},{status:500});
  }
}
