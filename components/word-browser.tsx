"use client";

import { useState, useCallback, useMemo } from "react";
import type { DailyWord } from "@/app/page";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import WordModal from "@/components/word-modal";
import { cn } from "@/lib/utils";

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function isToday(dateStr: string, todayStr: string): boolean {
  return dateStr === todayStr;
}

function todayStr(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

// ----- Separator Component -----
function Dot({ className }: { className?: string }) {
  return <span className={cn("mx-2 text-muted-foreground/40", className)} aria-hidden="true">·</span>;
}

export function WordBrowser({ words }: { words: DailyWord[] }) {
  const today = todayStr();
  const sorted = useMemo(() => [...words].sort(
    (a, b) => new Date(b.fetched_date).getTime() - new Date(a.fetched_date).getTime()
  ), [words]);

  const todayWord = sorted.find((w) => isToday(w.fetched_date, today)) || sorted[0];
  const pastWords = sorted.filter((w) => w !== todayWord);

  const [modalWord, setModalWord] = useState<DailyWord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = useCallback((w: DailyWord) => {
    setModalWord(w);
    setModalOpen(true);
  }, []);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center px-4 py-16">
        <p className="text-muted-foreground">No words available yet. Check back tomorrow.</p>
      </div>
    );
  }

  const w = todayWord;

  // ----- Section renders -----
  const SynonymsSection = (word: DailyWord) => (
    <Tabs defaultValue="synonyms">
      <TabsList className="mx-auto mb-4">
        <TabsTrigger value="synonyms">Synonyms</TabsTrigger>
        <TabsTrigger value="antonyms">Antonyms</TabsTrigger>
      </TabsList>
      <TabsContent value="synonyms">
        {word.synonyms && word.synonyms.length > 0 ? (
          <div className="space-y-4">
            {word.synonyms_strongest && word.synonyms_strongest.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-600 mb-2">STRONGEST</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {word.synonyms_strongest.map((s: string) => (
                    <Badge key={s} variant="outline" className="text-sm px-3 py-1 border-emerald-500 text-emerald-700 bg-emerald-50">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {word.synonyms_strong && word.synonyms_strong.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-blue-600 mb-2">STRONG</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {word.synonyms_strong.map((s: string) => (
                    <Badge key={s} variant="outline" className="text-sm px-3 py-1 border-blue-500 text-blue-700 bg-blue-50">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {word.synonyms_weak && word.synonyms_weak.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground/60 mb-2">WEAK</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {word.synonyms_weak.map((s: string) => (
                    <Badge key={s} variant="outline" className="text-sm px-3 py-1 border-muted-foreground/20 text-muted-foreground/70 bg-muted/50">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground/50 text-sm">No synonyms available.</p>
        )}
      </TabsContent>
      <TabsContent value="antonyms">
        {word.antonyms && word.antonyms.length > 0 ? (
          <div className="space-y-4">
            {word.antonyms_strongest && word.antonyms_strongest.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-600 mb-2">STRONGEST</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {word.antonyms_strongest.map((s: string) => (
                    <Badge key={s} variant="outline" className="text-sm px-3 py-1 border-emerald-500 text-emerald-700 bg-emerald-50">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {word.antonyms_strong && word.antonyms_strong.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-blue-600 mb-2">STRONG</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {word.antonyms_strong.map((s: string) => (
                    <Badge key={s} variant="outline" className="text-sm px-3 py-1 border-blue-500 text-blue-700 bg-blue-50">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {word.antonyms_weak && word.antonyms_weak.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground/60 mb-2">WEAK</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {word.antonyms_weak.map((s: string) => (
                    <Badge key={s} variant="outline" className="text-sm px-3 py-1 border-muted-foreground/20 text-muted-foreground/70 bg-muted/50">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground/50 text-sm">No antonyms available.</p>
        )}
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="flex flex-1 flex-col items-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="w-full max-w-3xl">

        {/* ═══ TODAY'S WORD — full details inline ═══ */}
        <section className="mb-14 text-center">

          {/* Word */}
          <h1 className="font-bold tracking-tight text-primary mb-3" style={{fontSize: "clamp(2.5rem, 5vw, 3.75rem)", lineHeight: 1.1, letterSpacing: "-0.03em"}}>
            {w.word}
          </h1>

          {/* IPA + PoS */}
          <div className="flex items-center justify-center gap-3 text-muted-foreground mb-8">
            {w.ipa && <span className="text-lg font-mono tracking-tight">/{w.ipa}/</span>}
            {w.pos && <Badge variant="secondary" className="text-xs uppercase tracking-wider">{w.pos}</Badge>}
          </div>

          {/* Definition */}
          {w.definition && (
            <p className="text-lg leading-relaxed text-center max-w-prose mx-auto text-foreground/85 mb-8">
              {w.definition}
            </p>
          )}

          {/* Metadata block */}
          {(w.cefr || w.topic || (w.examples?.length ?? 0) > 0 || w.etymology) && (
            <div className="mb-8 space-y-3">
              {(w.cefr || w.topic) && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {w.cefr && <Badge variant="outline" className="text-xs border-accent/40 text-accent bg-accent/5">{w.cefr}</Badge>}
                  {w.topic && <Badge variant="outline" className="text-xs border-border text-muted-foreground">{w.topic}</Badge>}
                </div>
              )}
              {(w.examples?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider mb-2 text-center">Examples</p>
                  <ul className="space-y-2">
                    {w.examples!.slice(0, 2).map((ex, i) => (
                      <li key={i} className="text-sm text-muted-foreground italic text-center max-w-prose mx-auto">&ldquo;{ex}&rdquo;</li>
                    ))}
                  </ul>
                </div>
              )}
              {w.etymology && (
                <p className="text-xs text-muted-foreground/70 italic text-center font-mono">{w.etymology}</p>
              )}
            </div>
          )}

          {/* Thai */}
          {w.thai_translations && w.thai_translations.length > 0 && (
            <div className="mb-10 bg-muted/30 border border-border/50 rounded-lg p-5 sm:p-6">
              <p className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider mb-3 text-center">Thai</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {w.thai_translations.map((t: string) => (
                  <Badge key={t} variant="default" className="text-sm px-3 py-1 font-medium bg-accent/10 text-accent border-accent/20 hover:bg-accent/15">{t}</Badge>
                ))}
              </div>
            </div>
          )}

          <Separator className="mb-8" />

          {/* Synonyms / Antonyms */}
          {SynonymsSection(w)}

          <Separator className="mt-8 mb-6" />

          {/* View Details */}
          <Button variant="default" onClick={() => openModal(w)}>
            View All Details
          </Button>
        </section>

        {/* ═══ PAST WORDS — compact clickable list ═══ */}
        {pastWords.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Separator className="flex-1" />
              <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider shrink-0">Previous</span>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-2">
              {pastWords.map((pw) => (
                <button
                  key={pw.id}
                  onClick={() => openModal(pw)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border border-border/40 hover:border-accent/30 hover:bg-muted/50 transition-all cursor-pointer group"
                >
                  <span className="text-xs font-mono text-muted-foreground w-14 shrink-0">{formatDateLabel(pw.fetched_date)}</span>
                  <span className="text-base font-semibold text-foreground group-hover:text-accent transition-colors">{pw.word}</span>
                  {pw.definition && (
                    <>
                      <span className="text-muted-foreground/30 hidden sm:inline">·</span>
                      <span className="text-sm text-muted-foreground/60 truncate hidden sm:block max-w-md">{pw.definition}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Modal for past word details */}
      {modalWord && (
        <WordModal word={modalWord} open={modalOpen} onOpenChange={(o) => { setModalOpen(o); if (!o) setModalWord(null); }} />
      )}
    </div>
  );
}
