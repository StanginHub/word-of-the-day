"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DailyWord } from "@/app/page";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import DateSelector from "@/components/date-selector";
import WordModal from "@/components/word-modal";
import { cn } from "@/lib/utils";

interface WordBrowserProps {
  words: DailyWord[];
  initialDate: string;
}

function findWordByDate(words: DailyWord[], date: string): DailyWord | undefined {
  return words.find((w) => w.fetched_date === date);
}

export function WordBrowser({ words, initialDate }: WordBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [modalOpen, setModalOpen] = useState(false);

  const selectedWord = findWordByDate(words, selectedDate);

  const handleDateSelect = useCallback(
    (date: string) => {
      setSelectedDate(date);
      // Update URL without navigation
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", date);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  if (!selectedWord) {
    return (
      <div className="flex flex-1 flex-col items-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <DateSelector
            words={words}
            selectedDate={selectedDate}
            onSelect={handleDateSelect}
          />
          <div className="text-center py-16">
            <p className="text-zinc-500">No word found for this date.</p>
          </div>
        </div>
      </div>
    );
  }

  const w = selectedWord;

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-3xl">
        {/* Date Selector */}
        <DateSelector
          words={words}
          selectedDate={selectedDate}
          onSelect={handleDateSelect}
        />

        {/* Word Header */}
        <div className="text-center mb-8">
          <h1 className="font-bold tracking-tight text-primary mb-3" style={{fontSize: "clamp(2.5rem, 5vw, 3.75rem)", lineHeight: 1.1, letterSpacing: "-0.03em"}}>
            {w.word}
          </h1>
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            {w.ipa && (
              <span className="text-lg font-mono tracking-tight">/{w.ipa}/</span>
            )}
            {w.pos && (
              <Badge variant="secondary" className="text-xs uppercase tracking-wider">
                {w.pos}
              </Badge>
            )}
          </div>
        </div>

        {/* Definition */}
        {w.definition && (
          <div className="mb-6">
            <p className="text-lg leading-relaxed text-center max-w-prose mx-auto text-foreground/85">
              {w.definition}
            </p>
          </div>
        )}

        {/* CEFR + Topic Badges */}
        {(w.cefr || w.topic) && (
          <div className="mb-5 flex flex-wrap gap-2 justify-center">
            {w.cefr && (
              <Badge variant="outline" className="text-xs border-accent/40 text-accent bg-accent/5">
                {w.cefr}
              </Badge>
            )}
            {w.topic && (
              <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                {w.topic}
              </Badge>
            )}
          </div>
        )}

        {/* Examples */}
        {w.examples && w.examples.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider mb-2 text-center">
              Examples
            </p>
            <ul className="space-y-2">
              {w.examples.slice(0, 2).map((ex: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground italic text-center max-w-prose mx-auto">
                  &ldquo;{ex}&rdquo;
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Etymology */}
        {w.etymology && (
          <div className="mb-5">
            <p className="text-xs text-muted-foreground/70 italic text-center font-mono">
              {w.etymology}
            </p>
          </div>
        )}

        {/* Thai Translations */}
        {w.thai_translations && w.thai_translations.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider mb-3 text-center">
              Thai
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {w.thai_translations.map((t: string) => (
                <Badge
                  key={t}
                  variant="default"
                  className={cn(
                    "text-sm px-3 py-1 font-medium",
                    "bg-accent/10 text-accent border-accent/20 hover:bg-accent/15"
                  )}
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator className="mb-8" />

        {/* Synonyms / Antonyms Tabs */}
        <Tabs defaultValue="synonyms" className="mb-6">
          <TabsList className="mx-auto mb-4">
            <TabsTrigger value="synonyms">Synonyms</TabsTrigger>
            <TabsTrigger value="antonyms">Antonyms</TabsTrigger>
          </TabsList>
          <TabsContent value="synonyms">
            {w.synonyms && w.synonyms.length > 0 ? (
              <div className="space-y-4">
                {/* STRONGEST */}
                {w.synonyms_strongest && w.synonyms_strongest.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 mb-2">STRONGEST</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {w.synonyms_strongest.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-sm px-3 py-1 border-emerald-500 text-emerald-700 bg-emerald-50">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {/* STRONG */}
                {w.synonyms_strong && w.synonyms_strong.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-600 mb-2">STRONG</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {w.synonyms_strong.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-sm px-3 py-1 border-blue-500 text-blue-700 bg-blue-50">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {/* WEAK */}
                {w.synonyms_weak && w.synonyms_weak.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 mb-2">WEAK</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {w.synonyms_weak.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-sm px-3 py-1 border-zinc-400 text-zinc-600 bg-zinc-50">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-zinc-400 text-sm">
                No synonyms available.
              </p>
            )}
          </TabsContent>
          <TabsContent value="antonyms">
            {w.antonyms && w.antonyms.length > 0 ? (
              <div className="space-y-4">
                {w.antonyms_strongest && w.antonyms_strongest.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 mb-2">STRONGEST</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {w.antonyms_strongest.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-sm px-3 py-1 border-emerald-500 text-emerald-700 bg-emerald-50">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {w.antonyms_strong && w.antonyms_strong.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-600 mb-2">STRONG</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {w.antonyms_strong.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-sm px-3 py-1 border-blue-500 text-blue-700 bg-blue-50">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {w.antonyms_weak && w.antonyms_weak.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 mb-2">WEAK</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {w.antonyms_weak.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-sm px-3 py-1 border-zinc-400 text-zinc-600 bg-zinc-50">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-zinc-400 text-sm">
                No antonyms available.
              </p>
            )}
          </TabsContent>
        </Tabs>

        <Separator className="mb-6" />

        {/* View Details Button */}
        <div className="flex justify-center">
          <Button variant="default" onClick={() => setModalOpen(true)}>
            View Details
          </Button>
        </div>

        {/* Modal */}
        <WordModal
          word={w}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      </div>
    </div>
  );
}
