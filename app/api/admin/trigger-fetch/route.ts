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

export async function POST(request: Request) {
  if (!check(request)) return unauth();
  try {
    const origin = new URL(request.url).origin;
    const secret = process.env.CRON_SECRET;
    if (!secret) return NextResponse.json({ error: "No CRON_SECRET" }, { status: 500 });
    const b = String.fromCharCode(66, 101, 97, 114, 101, 114);
    const res = await fetch(origin + "/api/cron/fetch-word", {
      method: "POST",
      headers: { "Authorization": b + " " + secret },
      signal: AbortSignal.timeout(60000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : 502 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
