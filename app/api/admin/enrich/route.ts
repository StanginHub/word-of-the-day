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

export async function POST(request: Request) {
  if (!check(request)) return unauth();
  const su = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sk = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!su || !sk) return NextResponse.json({error:"DB not configured"},{status:500});
  try {
    const sb = createClient(su, sk);
    const { data: words } = await sb.from("daily_words").select("word,fetched_date,synonyms,synonyms_strongest,synonyms_strong,synonyms_weak,definition").order("fetched_date",{ascending:false});
    if (!words || words.length === 0) return NextResponse.json({success:true, enriched:0});

    const origin = new URL(request.url).origin;
    const secret = process.env.CRON_SECRET;
    let done = 0, fail = 0, filtered = 0;

    // Build a set of valid English words from thesaurus + definition
    type WordRow = {synonyms_strongest?:string[]|null;synonyms_strong?:string[]|null;synonyms_weak?:string[]|null;synonyms?:string[]|null;definition?:string|null;word?:string|null};
    function getValidWords(row: WordRow): Set<string> {
      const s = new Set<string>();
      // Add the word itself (e.g. "priority" → "priority" matches priority)
      if (row.word) s.add(row.word.toLowerCase());
      // Add all thesaurus synonyms for this word's specific meaning
      for (const list of [row.synonyms_strongest, row.synonyms_strong, row.synonyms_weak, row.synonyms]) {
        if (Array.isArray(list)) list.forEach((w: string) => s.add(w.toLowerCase()));
      }
      // Add definition words (short words too)
      if (row.definition) {
        row.definition.toLowerCase().replace(/[^a-z\s]/g,"").split(/\s+/).forEach((w: string) => {
          if (w.length > 2) s.add(w);
        });
      }
      return s;
    }

    for (const w of words) {
      try {
        // Fetch enriched data
        const res = await fetch(origin+"/api/cron/fetch-word",{
          method:"POST",
          headers:{"Authorization":B+secret,"Content-Type":"application/json"},
          body:JSON.stringify({word:w.word,date:w.fetched_date}),
          signal:AbortSignal.timeout(30000),
        });
        const data = await res.json();
        if (!data.success) { fail++; continue; }

        const translations: string[] = data.thai_translations || [];
        if (translations.length === 0) { done++; continue; }

        // Get valid English words for this word's specific meaning
        // Re-fetch from DB since the word data changed after cron upsert
        const { data: fresh } = await sb.from("daily_words")
          .select("synonyms_strongest,synonyms_strong,synonyms_weak,synonyms,definition")
          .eq("fetched_date", w.fetched_date).single();
        const validWords = getValidWords({
          word: w.word,
          synonyms_strongest: fresh?.synonyms_strongest || w.synonyms_strongest,
      synonyms_strong: fresh?.synonyms_strong || w.synonyms_strong,
      synonyms_weak: fresh?.synonyms_weak || w.synonyms_weak,
      synonyms: fresh?.synonyms || w.synonyms,
      definition: fresh?.definition || w.definition,
    });

        const validated: string[] = [];
        for (const t of translations) {
          const back = await backTranslate(t);
          const match = back.some(bw => {
            const b = bw.toLowerCase().trim();
            return Array.from(validWords).some(vw => b === vw || b.includes(vw) || vw.includes(b));
          });
          if (match) validated.push(t);
          else filtered++;
        }

        // Update DB with validated translations
        if (validated.length > 0) {
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
