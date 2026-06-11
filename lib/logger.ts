const su = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
const sk = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function logAction(action: string, detail?: string) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    if (!su() || !sk()) return;
    const sb = createClient(su()!, sk()!);
    await sb.from("activity_log").insert({ action, detail: detail || null });
  } catch { /* silent */ }
}
