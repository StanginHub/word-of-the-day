import { NextResponse } from "next/server";
const B = String.fromCharCode(66, 101, 97, 114, 101, 114) + " ";
function check(req: Request): boolean {
  const h = req.headers.get("Authorization") || "";
  if (!h.startsWith(B)) return false;
  return h.slice(B.length).trim() === process.env.CRON_SECRET?.trim();
}
function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!check(request)) return unauth();
  try {
    const res = await fetch("https://feeds.feedburner.com/OLD-WordOfTheDay", {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    const xml = await res.text();
    const count = (xml.match(/<entry>/g) || []).length;
    return NextResponse.json({ success: true, status: res.status, items: count, feedLength: xml.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
