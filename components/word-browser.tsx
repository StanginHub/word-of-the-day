"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import type { DailyWord } from "@/app/page";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SpeakButton } from "@/components/speak-button";
import { cn } from "@/lib/utils";

const WordModal = dynamic(() => import("@/components/word-modal"), {
  ssr: false,
  loading: () => null,
});

// ----- helpers -----
function fmt(d: string): string {
  const date = new Date(d + "T00:00:00");
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][date.getMonth()] + " " + date.getDate();
}
function isToday(d: string, t: string) { return d === t; }
function today() { return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }); }

async function copyToClipboard(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

// ----- strength badge groups -----
function BadgesOf({ words, color }: { words: string[] | null; color: "emerald" | "blue" | "muted" }) {
  if (!words || words.length === 0) return null;
  const map = {
    emerald: "border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100",
    blue:    "border-blue-500   text-blue-700   bg-blue-50   hover:bg-blue-100",
    muted:   "border-muted-foreground/20 text-muted-foreground/70 bg-muted/50 hover:bg-muted/80",
  };
  const base = (s: string) => {
    // Skip Oxford link for multi-word phrases (would 404)
    if (s.includes(" ")) return null;
    return "https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(s.toLowerCase());
  };
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {words.map((s, i) => {
        const url = base(s);
        const badge = <Badge variant="outline" className={cn("text-sm px-3 py-1 cursor-pointer transition-colors", map[color])}>{s}</Badge>;
        return url ? <a key={s + i} href={url} target="_blank" rel="noopener noreferrer">{badge}</a> : <span key={s + i}>{badge}</span>;
      })}
    </div>
  );
}

export function WordBrowser({ words }: { words: DailyWord[] }) {
  const todayStr = today();
  const sorted = useMemo(() => [...words].sort((a, b) => new Date(b.fetched_date).getTime() - new Date(a.fetched_date).getTime()), [words]);
  const tw = sorted.find((w) => isToday(w.fetched_date, todayStr)) || sorted[0];
  const past = sorted.filter((w) => w !== tw);

  const [modalWord, setModalWord] = useState<DailyWord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const open = useCallback((w: DailyWord) => { setModalWord(w); setModalOpen(true); }, []);

  const handleCopy = useCallback(async () => {
    if (!tw) return;
    const ok = await copyToClipboard(`${tw.word} — ${tw.definition || ""}`);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1800); }
  }, [tw]);

  const handleRandom = useCallback(() => {
    if (past.length === 0) return;
    const pick = past[Math.floor(Math.random() * past.length)];
    open(pick);
  }, [past, open]);

  // ----- Thesaurus -----
  const Thesaurus = (w: DailyWord) => {
    const hasData = w.synonyms && w.synonyms.length > 0;
    const hasAnt = w.antonyms && w.antonyms.length > 0;
    if (!hasData && !hasAnt) return null;

    return (
      <Tabs defaultValue="synonyms" className="w-full">
        <TabsList className="mx-auto mb-5">
          <TabsTrigger value="synonyms">Synonyms</TabsTrigger>
          {hasAnt && <TabsTrigger value="antonyms">Antonyms</TabsTrigger>}
        </TabsList>

        <TabsContent value="synonyms">
          {hasData ? (
            <div className="space-y-4">
              {w.synonyms_strongest && w.synonyms_strongest.length > 0 && (
                <div className="bg-emerald-50/40 rounded-xl p-3 sm:p-4 border border-emerald-200/40">
                <p className="text-[11px] font-semibold text-emerald-700 tracking-wider uppercase mb-2">Strongest</p>
                <BadgesOf words={w.synonyms_strongest} color="emerald" />
              </div>
            )}
            {w.synonyms_strong && w.synonyms_strong.length > 0 && (
              <div className="bg-blue-50/40 rounded-xl p-3 sm:p-4 border border-blue-200/40">
                  <p className="text-[11px] font-semibold text-blue-700 tracking-wider uppercase mb-2">Strong</p>
                  <BadgesOf words={w.synonyms_strong} color="blue" />
                </div>
              )}
              {w.synonyms_weak && w.synonyms_weak.length > 0 && (
                <div className="bg-muted/40 rounded-xl p-3 sm:p-4 border border-border/50">
                  <p className="text-[11px] font-semibold text-muted-foreground/60 tracking-wider uppercase mb-2">Weak</p>
                  <BadgesOf words={w.synonyms_weak} color="muted" />
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground/50 text-sm">No synonyms available.</p>
          )}
        </TabsContent>

        {hasAnt && (
          <TabsContent value="antonyms">
            {w.antonyms && w.antonyms.length > 0 ? (
              <div className="space-y-4">
                {w.antonyms_strongest && w.antonyms_strongest.length > 0 && (
                  <div className="bg-emerald-50/40 rounded-xl p-3 sm:p-4 border border-emerald-200/40">
                    <p className="text-[11px] font-semibold text-emerald-700 tracking-wider uppercase mb-2">Strongest</p>
                    <BadgesOf words={w.antonyms_strongest!} color="emerald" />
                  </div>
                )}
                {w.antonyms_strong && w.antonyms_strong.length > 0 && (
                  <div className="bg-blue-50/40 rounded-xl p-3 sm:p-4 border border-blue-200/40">
                    <p className="text-[11px] font-semibold text-blue-700 tracking-wider uppercase mb-2">Strong</p>
                    <BadgesOf words={w.antonyms_strong!} color="blue" />
                  </div>
                )}
                {w.antonyms_weak && w.antonyms_weak.length > 0 && (
                  <div className="bg-muted/40 rounded-xl p-3 sm:p-4 border border-border/50">
                    <p className="text-[11px] font-semibold text-muted-foreground/60 tracking-wider uppercase mb-2">Weak</p>
                    <BadgesOf words={w.antonyms_weak!} color="muted" />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground/50 text-sm">No antonyms available.</p>
            )}
          </TabsContent>
        )}
      </Tabs>
    );
  };

  if (sorted.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 animate-in fade-in duration-700">
        <p className="text-lg text-muted-foreground">Ready for the first word.</p>
        <p className="text-sm text-muted-foreground/50 mt-2">Words arrive daily — check back tomorrow.</p>
      </div>
    );
  }

  const w = tw;

  return (
    <div className="flex flex-1 flex-col items-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-in fade-in duration-500">
      <div className="w-full max-w-3xl">

        {/* ═══ TODAY ═══ */}
        <section className="mb-16 text-center">

          {/* word header row */}
          <div className="relative inline-block mb-1 group">
            <h1
              className="font-bold tracking-tight text-primary"
              style={{fontSize: "clamp(2.5rem, 5vw, 3.75rem)", lineHeight: 1.1, letterSpacing: "-0.03em", textWrap: "balance"}}
            >
              <a href={"https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(w.word.toLowerCase())} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-accent/30 underline-offset-4 transition-all duration-200 hover:text-accent">
                {w.word}
              </a>
              <SpeakButton word={w.word} />
            </h1>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-[3px] rounded-full bg-accent/40" />

          {/* copy row */}
          <div className="flex items-center justify-center gap-3 sm:p-4 mt-1 mb-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground/40 hover:text-accent active:text-accent transition-colors"
              aria-label="Copy word"
              title="Copy word + definition"
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                </>
              )}
            </button>
          </div>
          </div>

          {/* IPA + PoS */}
          <div className="flex items-center justify-center gap-3 text-muted-foreground mt-4 mb-8">
            {w.ipa && <span className="text-base font-ipa tracking-tight">/{w.ipa}/</span>}
            {w.pos && <Badge variant="secondary" className="text-[11px] uppercase tracking-wider">{w.pos}</Badge>}
          </div>

          {/* Definition */}
          {w.definition && (
            <p className="text-base leading-relaxed max-w-prose mx-auto text-foreground/85">
              {w.definition}
            </p>
          )}

          {/* Metadata: CEFR + topic + examples + etymology */}
          {(w.cefr || w.topic || (w.examples?.length ?? 0) > 0 || w.etymology) && (
            <div className="mt-8 mb-8 space-y-3">
              {(w.cefr || w.topic) && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {w.cefr && <Badge variant="outline" className="text-[11px] border-accent/40 text-accent bg-accent/5">{w.cefr}</Badge>}
                  {w.topic && <Badge variant="outline" className="text-[11px] border-border text-muted-foreground">{w.topic}</Badge>}
                </div>
              )}
              {(w.examples?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider mb-2 text-center">Examples</p>
                  <ul className="space-y-1.5">
                    {w.examples!.slice(0, 2).map((ex, i) => (
                      <li key={i} className="text-sm text-muted-foreground/90 italic text-center max-w-prose mx-auto">&ldquo;{ex}&rdquo;</li>
                    ))}
                  </ul>
                </div>
              )}
              {w.etymology && <p className="text-xs text-muted-foreground/60 italic text-center font-mono">{w.etymology}</p>}
            </div>
          )}

          {/* Thai highlight box */}
          {w.thai_translations && w.thai_translations.length > 0 && (
            <div className="mb-10 bg-accent/5 border border-accent/15 rounded-xl p-5 sm:p-6">
              <p className="text-[11px] font-mono font-medium text-accent uppercase tracking-wider mb-3 text-center">Translation (Thai)</p>
              <div className="flex flex-wrap gap-2.5 justify-center">
                {w.thai_translations.map((t) => (
                  <Badge key={t} variant="default" className="text-sm px-3.5 py-1.5 font-medium bg-accent/10 text-accent border-accent/20 hover:bg-accent/15">{t}</Badge>
                ))}
              </div>
              <div className="flex justify-center mt-3 gap-2">
                <a href={"https://translate.google.com/?sl=en&tl=th&text=" + encodeURIComponent(w.word)} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1.5 text-xs font-medium text-accent border border-accent/20 rounded-lg px-3 py-1.5 bg-accent/5 hover:bg-accent/10 hover:border-accent/30 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10h-10V2z"/><path d="M2 12h10"/><path d="M12 2v10"/></svg>
                  Open in Google Translate
                </a>
              </div>
            </div>
          )}

          <Separator className="mb-8" />

          {/* Thesaurus */}
          {Thesaurus(w)}

          <Separator className="mt-8 mb-6" />

          <div className="flex items-center justify-center gap-3">
            <Button variant="default" onClick={() => open(w)}>
              View All Details
            </Button>
            {past.length > 0 && (
              <Button variant="outline" onClick={handleRandom}>
                Random
              </Button>
            )}
          </div>
        </section>

        {/* ═══ PAST WORDS ═══ */}
        {past.length > 0 && (
          <section className="animate-in slide-in-from-bottom-4 fade-in duration-500 delay-150">
            <div className="flex items-center gap-3 mb-5">
              <Separator className="flex-1" />
              <span className="text-[11px] font-mono font-medium text-muted-foreground/50 uppercase tracking-widest shrink-0">
                {past.length} Previous
              </span>
              <Separator className="flex-1" />
            </div>

            <div className="rounded-xl border border-border/40 divide-y divide-border/30 overflow-hidden">
              {past.map((pw) => {
                const thaiPreview = pw.thai_translations?.slice(0, 2) ?? [];
                return (
                  <button
                    key={pw.id}
                    onClick={() => open(pw)}
                    className="w-full text-left flex items-center gap-3 px-5 py-4 hover:bg-muted/60 transition-colors cursor-pointer group active:bg-muted/80"
                  >
                    {/* date */}
                    <span className="text-xs font-mono text-muted-foreground/50 font-medium w-10 shrink-0">{fmt(pw.fetched_date)}</span>
                    {/* word */}
                    <span className="text-base font-semibold text-foreground group-hover:text-accent transition-colors shrink-0">{pw.word}</span>
                    {/* definition (hidden on mobile) */}
                    <span className="text-muted-foreground/20 hidden sm:inline">·</span>
                    <span className="text-sm text-muted-foreground/50 truncate hidden sm:block max-w-xs">{pw.definition}</span>
                    {/* GT link icon */}
                    <span className="ml-1 shrink-0 hidden sm:inline-block">
                      <a href={"https://translate.google.com/?sl=en&tl=th&text=" + encodeURIComponent(pw.word)} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground/30 hover:text-accent hover:bg-accent/5 transition-all"
                         title="Open in Google Translate"
                         onClick={e => e.stopPropagation()}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10h-10V2z"/><path d="M2 12h10"/><path d="M12 2v10"/></svg>
                      </a>
                    </span>
                    {/* Thai badges (right side) */}
                    <div className="ml-auto flex gap-1.5 shrink-0">
                      {thaiPreview.map((t, i) => (
                        <span key={t + i} className="text-[11px] px-2 py-0.5 rounded-full bg-accent/8 text-accent/70 border border-accent/15 font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

      </div>

      {modalWord && (
        <WordModal
          word={modalWord}
          open={modalOpen}
          onOpenChange={(o) => { setModalOpen(o); if (!o) setModalWord(null); }}
        />
      )}
    </div>
  );
}
