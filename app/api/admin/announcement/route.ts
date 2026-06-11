import { NextResponse } from "next/server";
const B = String.fromCharCode(66, 101, 97, 114, 101, 114) + " ";
function check(req: Request): boolean {
  const h = req.headers.get("Authorization")||""; if(!h.startsWith(B))return false;
  return h.slice(B.length).trim()===process.env.CRON_SECRET?.trim();
}
const unauth = () => NextResponse.json({error:"Unauthorized"},{status:401});

export async function POST(request: Request) {
  if (!check(request)) return unauth();
  const su = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sk = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!su || !sk) return NextResponse.json({error:"DB not configured"},{status:500});
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(su, sk);
    const body = await request.json();
    const { title, body: content, enabled } = body;
    const { error } = await sb.from("announcements").update({
      title: title || "",
      body: content || "",
      enabled: typeof enabled === "boolean" ? enabled : false,
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) return NextResponse.json({error:error.message},{status:500});
    return NextResponse.json({success:true});
  } catch(e:unknown) {
    return NextResponse.json({error:e instanceof Error?e.message:String(e)},{status:500});
  }
}
