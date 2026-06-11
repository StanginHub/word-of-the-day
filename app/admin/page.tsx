import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AdminPanel } from "@/components/admin-panel";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: words, error } = await supabase
    .from("daily_words")
    .select("*")
    .order("fetched_date", { ascending: false });

  const totalWords = words?.length || 0;
  const latestWord = words?.[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="border border-border rounded-lg p-4 bg-card">
            <p className="text-muted-foreground text-sm">Total Words</p>
            <p className="text-3xl font-bold">{totalWords}</p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card">
            <p className="text-muted-foreground text-sm">Latest Word</p>
            <p className="text-2xl font-bold">{latestWord?.word || "-"}</p>
            <p className="text-xs text-muted-foreground">
              {latestWord?.fetched_date || "No data"}
            </p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card">
            <p className="text-muted-foreground text-sm">Last Updated</p>
            <p className="text-xs font-mono">{latestWord?.fetched_date || "Never"}</p>
          </div>
        </div>

        {/* Admin Actions */}
        <Suspense fallback={<p>Loading...</p>}>
          <AdminPanel />
        </Suspense>

        {/* Recent Words Table */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Recent Words</h2>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Word</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Definition</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">POS</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Synonyms</th>
                </tr>
              </thead>
              <tbody>
                {words && words.length > 0 ? (
                  words.slice(0, 10).map((word) => (
                    <tr key={word.id} className="border-t border-border hover:bg-muted/50">
                      <td className="px-4 py-2 text-sm font-mono">{word.fetched_date}</td>
                      <td className="px-4 py-2 text-sm font-bold">{word.word}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground truncate max-w-xs">
                        {word.definition?.substring(0, 50)}...
                      </td>
                      <td className="px-4 py-2 text-sm">{word.pos || "-"}</td>
                      <td className="px-4 py-2 text-sm">
                        {word.synonyms?.length ? `${word.synonyms.length} items` : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-2 text-center text-muted-foreground">
                      No words yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
