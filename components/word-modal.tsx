"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SpeakButton } from "@/components/speak-button";

interface DailyWord {
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

interface WordModalProps {
  word: DailyWord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


const oxfordUrl = (s: string) => "https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(s.toLowerCase().trim());
export default function WordModal({ word, open, onOpenChange }: WordModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-xl sm:max-w-lg p-5 sm:p-6 gap-0"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {word.word}
            <SpeakButton word={word.word} />
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 pt-2">
          {/* IPA and PoS */}
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            {word.ipa && (
              <span className="text-base font-ipa tracking-tight">/{word.ipa}/</span>
            )}
            {word.pos && (
              <Badge variant="secondary" className="text-xs uppercase tracking-wider">
                {word.pos}
              </Badge>
            )}
          </div>

          {/* Definition */}
          {word.definition && (
            <div className="w-full">
              <p className="text-base leading-relaxed text-center px-2 text-foreground/85">
                {word.definition}
              </p>
            </div>
          )}

          {/* CEFR + Topic Badges */}
          {(word.cefr || word.topic) && (
            <div className="flex flex-wrap gap-2 justify-center">
              {word.cefr && (
                <Badge variant="outline" className="text-xs border-accent/40 text-accent bg-accent/5">
                  {word.cefr}
                </Badge>
              )}
              {word.topic && (
                <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                  {word.topic}
                </Badge>
              )}
            </div>
          )}

          {/* Examples */}
          {word.examples && word.examples.length > 0 && (
            <div className="w-full">
              <p className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Examples
              </p>
              <ul className="space-y-2 pl-0">
                {word.examples.map((ex: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground italic text-center">
                    &ldquo;{ex}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Etymology */}
          {word.etymology && (
            <div className="w-full">
              <p className="text-xs text-muted-foreground/70 italic text-center font-mono">
                {word.etymology}
              </p>
            </div>
          )}

          <Separator className="w-full" />

          {/* Thai Translations */}
          {word.thai_translations && word.thai_translations.length > 0 && (
            <div className="w-full">
              <p className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider mb-2 text-center">
                Thai
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {word.thai_translations.map((t: string) => (
                  <Badge
                    key={t}
                    variant="default"
                    className="text-sm px-3 py-1 font-medium bg-accent/10 text-accent border-accent/20"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="flex justify-center mt-3">
                <a href={"https://translate.google.com/?sl=en&tl=th&text=" + encodeURIComponent(word.word)} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1.5 text-xs font-medium text-accent border border-accent/20 rounded-lg px-3 py-1.5 bg-accent/5 hover:bg-accent/10 hover:border-accent/30 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10h-10V2z"/><path d="M2 12h10"/><path d="M12 2v10"/></svg>
                  Open in Google Translate
                </a>
              </div>
            </div>
          )}

          <Separator className="w-full" />

          {/* Synonyms */}
          <div className="w-full">
            <p className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider mb-3 text-center">
              Synonyms
            </p>
            {word.synonyms && word.synonyms.length > 0 ? (
              <div className="space-y-3">
                {/* STRONGEST */}
                {word.synonyms_strongest && word.synonyms_strongest.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">STRONGEST</p>
                    <div className="flex flex-wrap gap-2">
                      {word.synonyms_strongest.map((s: string) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="text-sm px-3 py-1 border-emerald-500 text-emerald-700 bg-emerald-50 dark:border-emerald-400 dark:text-emerald-200 dark:bg-emerald-950/40"
                        ><a href={oxfordUrl(s)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {s}
                        </a></Badge>
                      ))}
                    </div>
                  </div>
                )}
                {/* STRONG */}
                {word.synonyms_strong && word.synonyms_strong.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5">STRONG</p>
                    <div className="flex flex-wrap gap-2">
                      {word.synonyms_strong.map((s: string) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="text-sm px-3 py-1 border-blue-500 text-blue-700 bg-blue-50 dark:border-blue-400 dark:text-blue-200 dark:bg-blue-950/40"
                        ><a href={oxfordUrl(s)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {s}
                        </a></Badge>
                      ))}
                    </div>
                  </div>
                )}
                {/* WEAK */}
                {word.synonyms_weak && word.synonyms_weak.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground/60 mb-1.5">WEAK</p>
                    <div className="flex flex-wrap gap-2">
                      {word.synonyms_weak.map((s: string) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="text-sm px-3 py-1 border-muted-foreground/20 text-muted-foreground/70 bg-muted/50"
                        ><a href={oxfordUrl(s)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {s}
                        </a></Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground/50 text-sm">
                No synonyms available.
              </p>
            )}
          </div>

          {/* Antonyms */}
          <div className="w-full">
            <p className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider mb-3 text-center">
              Antonyms
            </p>
            {word.antonyms && word.antonyms.length > 0 ? (
              <div className="space-y-3">
                {word.antonyms_strongest && word.antonyms_strongest.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">STRONGEST</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {word.antonyms_strongest.map((a: string) => (
                        <Badge key={a} variant="outline" className="text-sm px-3 py-1 border-emerald-500 text-emerald-700 bg-emerald-50"><a href={oxfordUrl(a)} target="_blank" rel="noopener noreferrer" className="hover:underline">{a}</a></Badge>
                      ))}
                    </div>
                  </div>
                )}
                {word.antonyms_strong && word.antonyms_strong.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5">STRONG</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {word.antonyms_strong.map((a: string) => (
                        <Badge key={a} variant="outline" className="text-sm px-3 py-1 border-blue-500 text-blue-700 bg-blue-50"><a href={oxfordUrl(a)} target="_blank" rel="noopener noreferrer" className="hover:underline">{a}</a></Badge>
                      ))}
                    </div>
                  </div>
                )}
                {word.antonyms_weak && word.antonyms_weak.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground/60 mb-1.5">WEAK</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {word.antonyms_weak.map((a: string) => (
                        <Badge key={a} variant="outline" className="text-sm px-3 py-1 border-muted-foreground/20 text-muted-foreground/70 bg-muted/50"><a href={oxfordUrl(a)} target="_blank" rel="noopener noreferrer" className="hover:underline">{a}</a></Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground/50 text-sm">
                No antonyms available.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
