import { NextResponse } from "next/server";
const B = String.fromCharCode(66, 101, 97, 114, 101, 114) + " ";
function check(req: Request): boolean {
  const h = req.headers.get("Authorization")||""; if(!h.startsWith(B))return false;
  return h.slice(B.length).trim()===process.env.CRON_SECRET?.trim();
}
const unauth = () => NextResponse.json({error:"Unauthorized"},{status:401});

export async function POST(request: Request) {
  if (!check(request)) return unauth();
  try {
    const { word } = await request.json();
    if (!word) return NextResponse.json({error:"Missing word"},{status:400});

    // Try DeepL first
    const deeplKey = process.env.DEEPL_API_KEY;
    if (deeplKey) {
      const res = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: { "Authorization": "DeepL-Auth-Key " + deeplKey, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ text: word, target_lang: "TH" }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const d = await res.json();
        return NextResponse.json({translation: d.translations?.[0]?.text || ""});
      }
    }

    // Fallback Google
    const gRes = await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=" + encodeURIComponent(word));
    if (gRes.ok) {
      const d = await gRes.json();
      return NextResponse.json({translation: d[0]?.[0]?.[0] || ""});
    }
    return NextResponse.json({error:"Translation failed"},{status:502});
  } catch(e:unknown) {
    return NextResponse.json({error:e instanceof Error?e.message:String(e)},{status:500});
  }
}
