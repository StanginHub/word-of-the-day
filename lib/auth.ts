export function checkAuth(request: Request): boolean {
  const auth = request.headers.get("Authorization") || "";
  const prefix = String.fromCharCode(66, 101, 97, 114, 101, 114) + " ";
  if (!auth.startsWith(prefix)) return false;
  const token = auth.slice(prefix.length).trim();
  return token === process.env.CRON_SECRET?.trim();
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
