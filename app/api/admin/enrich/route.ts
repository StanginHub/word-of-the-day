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
    const { data: words } = await sb.from("daily_words").select("word,fetched_date").is("thai_translations", null).order("fetched_date",{ascending:false});
    if (!words || words.length === 0) return NextResponse.json({success:true, enriched:0});

    const origin = new URL(request.url).origin;
    const secret = process.env.CRON_SECRET;
    let done = 0, fail = 0;
    for (const w of words) {
      try {
        const res = await fetch(origin+"/api/cron/fetch-word",{
          method:"POST",
          headers:{"Authorization":B+secret,"Content-Type":"application/json"},
          body:JSON.stringify({word:w.word,date:w.fetched_date}),
          signal:AbortSignal.timeout(30000),
        });
        const data = await res.json();
        if (data.success) done++; else fail++;
      } catch { fail++; }
    }
    return NextResponse.json({success:true, enriched:done, failed:fail});
  } catch(e:unknown) {
    return NextResponse.json({error:e instanceof Error?e.message:String(e)},{status:500});
  }
}
