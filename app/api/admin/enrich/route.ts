import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const B = String.fromCharCode(66, 101, 97, 114, 101, 114) + " ";
function check(req: Request): boolean {
  const h = req.headers.get("Authorization")||""; if(!h.startsWith(B))return false;
  return h.slice(B.length).trim()===process.env.CRON_SECRET?.trim();
}
const unauth = () => NextResponse.json({error:"Unauthorized"},{status:401});

async function backTranslate(thai: string): Promise<string[]> {
  try {
    const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=th&tl=en&dt=t&q="+encodeURIComponent(thai.slice(0,80));
    const res = await fetch(url, {signal: AbortSignal.timeout(5000)});
    if (!res.ok) return [];
    const data = await res.json();
    const words: string[] = [];
    if (Array.isArray(data?.[0])) {
      for (const item of data[0]) {
        if (Array.isArray(item) && item[0] && typeof item[0]==="string") {
          words.push(item[0].trim().toLowerCase());
        }
      }
    }
    return words;
  } catch { return []; }
}

function defKeywords(def: string): string[] {
  return def.toLowerCase()
    .replace(/[^a-z\s]/g,"")
    .split(/\s+/)
    .filter(w => w.length>3 && !["that","with","this","which","from","about","what","when","where","than","there","their","would","could","should","after","before","between","without","through","during","because","about","being","having","doing","something","someone","somebody","itself","themselves","himself","herself","itself","yourself","myself"].includes(w));
}

export async function POST(request: Request) {
  if (!check(request)) return unauth();
  const su = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sk = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!su || !sk) return NextResponse.json({error:"DB not configured"},{status:500});
  try {
    const sb = createClient(su, sk);
    const { data: words } = await sb.from("daily_words").select("word,fetched_date").order("fetched_date",{ascending:false});
    if (!words || words.length === 0) return NextResponse.json({success:true, enriched:0});

    const origin = new URL(request.url).origin;
    const secret = process.env.CRON_SECRET;
    let done = 0, fail = 0, filtered = 0;

    for (const w of words) {
      try {
        // Fetch enriched data (includes thai_translations + definition)
        const res = await fetch(origin+"/api/cron/fetch-word",{
          method:"POST",
          headers:{"Authorization":B+secret,"Content-Type":"application/json"},
          body:JSON.stringify({word:w.word,date:w.fetched_date}),
          signal:AbortSignal.timeout(30000),
        });
        const data = await res.json();
        if (!data.success) { fail++; continue; }

        const translations: string[] = data.thai_translations || [];
        const def: string = data.definition || "";

        if (translations.length === 0) { done++; continue; }

        // Round-trip validation: keep only translations whose back-translated
        // English overlaps with the Oxford definition
        const keywords = defKeywords(def);
        const validated: string[] = [];

        for (const t of translations) {
          const back = await backTranslate(t);
          // Check if any back-translated word overlaps with definition keywords
          const match = back.some(bw => keywords.some(kw => bw.includes(kw) || kw.includes(bw)));
          if (match || keywords.length === 0) {
            validated.push(t);
          } else {
            filtered++;
          }
        }

        // Update DB with validated translations only
        if (validated.length > 0 && validated.length !== translations.length) {
          await sb.from("daily_words").update({thai_translations: validated}).eq("fetched_date", w.fetched_date);
        }

        done++;
      } catch { fail++; }
    }

    return NextResponse.json({success:true, enriched:done, failed:fail, filtered});
  } catch(e:unknown) {
    return NextResponse.json({error:e instanceof Error?e.message:String(e)},{status:500});
  }
}
