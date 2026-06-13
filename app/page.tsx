import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { WordBrowser } from "@/components/word-browser";
import { AnnouncementBanner } from "@/components/announcement-banner";

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

export default async function HomePage() {
  const supabase = await createClient();

  const { data: words, error } = await supabase
    .from("daily_words")
    .select("*")
    .order("fetched_date", { ascending: false })
    .limit(31);

  if (error || !words || words.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center px-4 py-16">
        <div className="w-full max-w-3xl text-center py-16">
          <h1 className="text-2xl font-semibold text-foreground">No words yet.</h1>
          <p className="mt-2 text-muted-foreground">Check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col items-center px-4 py-16">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <AnnouncementBanner />
      <WordBrowser words={words as DailyWord[]} />
    </Suspense>
  );
}
