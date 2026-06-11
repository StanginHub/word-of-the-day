import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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
    const sb = createClient(su, sk);
    const resp = await fetch("https://feeds.feedburner.com/OLD-WordOfTheDay",{
      headers:{"User-Agent":"Mozilla/5.0"},signal:AbortSignal.timeout(15000)});
    if (!resp.ok) return NextResponse.json({error:"Feed: "+resp.status},{status:502});
    const xml = await resp.text();
    const entries = xml.split("<entry>").slice(1);
    const items: Array<{word:string;definition:string|null;pos:string|null;fetched_date:string}> = [];
    for (const block of entries) {
      const end = block.indexOf("</entry>"); if (end<0) continue;
      const e = block.slice(0,end);
      const title = e.match(/<title>(.*?)<\/title>/)?.[1]?.trim();
      if (!title) continue;
      const summary = e.match(/<summary>(.*?)<\/summary>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g,"").trim()||"";
      const date = e.match(/<updated>(\d{4}-\d{2}-\d{2})T/)?.[1]||"";
      const pos = summary.match(/^(\w+)/)?.[1]||null;
      items.push({word:title,definition:summary||null,pos,fetched_date:date});
    }
    if (!items.length) return NextResponse.json({error:"No entries"},{status:400});
    const {error: upsertErr} = await sb.from("daily_words").upsert(items,{onConflict:"fetched_date"});
    if (upsertErr) return NextResponse.json({error:upsertErr.message},{status:500});

    // Auto-enrich: run each word through the full Oxford/Thesaurus/Translate pipeline
    const origin = new URL(request.url).origin;
    const secret = process.env.CRON_SECRET;
    let enriched = 0, failed = 0;
    for (const item of items) {
      try {
        const enrichRes = await fetch(origin+"/api/cron/fetch-word",{
          method:"POST",
          headers:{"Authorization":B+secret,"Content-Type":"application/json"},
          body:JSON.stringify({word:item.word,date:item.fetched_date}),
          signal:AbortSignal.timeout(30000),
        });
        const data = await enrichRes.json();
        if (data.success) enriched++; else failed++;
      } catch { failed++; }
    }

    return NextResponse.json({
      success:true,
      imported:items.length,
      enriched,
      failed,
    });
  } catch(e:unknown) {
    return NextResponse.json({error:e instanceof Error?e.message:String(e)},{status:500});
  }
}
