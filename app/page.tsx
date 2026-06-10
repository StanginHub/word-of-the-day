import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { WordBrowser } from "@/components/word-browser";

export interface DailyWord {
  id: string;
  word: string;
  pos: string | null;
  ipa: string | null;
  definition: string | null;
  synonyms: string[] | null;
  synonyms_strongest: string[] | null;
  synonyms_strong: string[] | null;
  synonyms_weak: string[] | null;
  antonyms: string[] | null;
  antonyms_strongest: string[] | null;
  antonyms_strong: string[] | null;
  antonyms_weak: string[] | null;
  thai_translations: string[] | null;
  examples: string[] | null;
  etymology: string | null;
  cefr: string | null;
  topic: string | null;
  fetched_date: string;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Fetch all words ordered by fetched_date descending
  const { data: words, error } = await supabase
    .from("daily_words")
    .select("*")
    .order("fetched_date", { ascending: false });

  if (error || !words || words.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center px-4 py-12">
        <div className="w-full max-w-3xl text-center py-16">
          <h1 className="text-2xl font-semibold text-zinc-700">
            No words available yet.
          </h1>
          <p className="mt-2 text-zinc-500">
            Check back soon — new words are on their way!
          </p>
        </div>
      </div>
    );
  }

  // Determine initial date: URL param > today > most recent word
  const today = new Date().toISOString().split("T")[0];
  const initialDate = params.date || today;

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col items-center px-4 py-12">
          <div className="w-full max-w-3xl text-center py-16">
            <p className="text-zinc-500">Loading words...</p>
          </div>
        </div>
      }
    >
      <WordBrowser words={words as DailyWord[]} initialDate={initialDate} />
    </Suspense>
  );
}
