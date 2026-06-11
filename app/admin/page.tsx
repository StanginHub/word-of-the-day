import { createClient } from "@/lib/supabase/server";
import { AdminPanel } from "@/components/admin-panel";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: words } = await supabase
    .from("daily_words")
    .select("id,word,fetched_date,definition,pos,ipa,cefr,topic,thai_translations,synonyms")
    .order("fetched_date", { ascending: false });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <AdminPanel initialWords={words || []} />
      </div>
    </div>
  );
}
