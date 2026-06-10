"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

export default function WordModal({ word, open, onOpenChange }: WordModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="sm:max-w-md max-h-[85vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {word.word}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 pt-2">
          {/* IPA and PoS */}
          <div className="flex items-center justify-center gap-3 text-zinc-500">
            {word.ipa && (
              <span className="text-base font-mono">/{word.ipa}/</span>
            )}
            {word.pos && (
              <Badge variant="secondary" className="text-sm">
                {word.pos}
              </Badge>
            )}
          </div>

          {/* Definition */}
          {word.definition && (
            <div className="w-full">
              <p className="text-base text-zinc-700 leading-relaxed text-center px-2">
                {word.definition}
              </p>
            </div>
          )}

          {/* CEFR + Topic Badges */}
          {(word.cefr || word.topic) && (
            <div className="flex flex-wrap gap-2 justify-center">
              {word.cefr && (
                <Badge variant="outline" className="text-xs border-purple-500 text-purple-700">
                  CEFR {word.cefr}
                </Badge>
              )}
              {word.topic && (
                <Badge variant="outline" className="text-xs border-indigo-500 text-indigo-700">
                  {word.topic}
                </Badge>
              )}
            </div>
          )}

          {/* Examples */}
          {word.examples && word.examples.length > 0 && (
            <div className="w-full">
              <p className="text-sm font-medium text-zinc-500 mb-2">
                🗣️ Examples:
              </p>
              <ul className="space-y-1.5 pl-2">
                {word.examples.map((ex: string, i: number) => (
                  <li key={i} className="text-sm text-zinc-600 italic">
                    &ldquo;{ex}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Etymology */}
          {word.etymology && (
            <div className="w-full">
              <p className="text-sm text-zinc-500 italic">
                📖 {word.etymology}
              </p>
            </div>
          )}

          <Separator className="w-full" />

          {/* Thai Translations */}
          {word.thai_translations && word.thai_translations.length > 0 && (
            <div className="w-full">
              <p className="text-sm font-medium text-zinc-500 mb-2">
                🇹🇭 คำแปล:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {word.thai_translations.map((t: string) => (
                  <Badge
                    key={t}
                    variant="default"
                    className="text-sm px-3 py-1 bg-amber-100 text-amber-800 border-amber-200"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator className="w-full" />

          {/* Synonyms */}
          <div className="w-full">
            <p className="text-sm font-medium text-zinc-500 mb-3">Synonyms</p>
            {word.synonyms && word.synonyms.length > 0 ? (
              <div className="space-y-3">
                {/* STRONGEST */}
                {word.synonyms_strongest && word.synonyms_strongest.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 mb-1.5">STRONGEST</p>
                    <div className="flex flex-wrap gap-2">
                      {word.synonyms_strongest.map((s: string) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="text-sm px-3 py-1 border-emerald-500 text-emerald-700 bg-emerald-50"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {/* STRONG */}
                {word.synonyms_strong && word.synonyms_strong.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-600 mb-1.5">STRONG</p>
                    <div className="flex flex-wrap gap-2">
                      {word.synonyms_strong.map((s: string) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="text-sm px-3 py-1 border-blue-500 text-blue-700 bg-blue-50"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {/* WEAK */}
                {word.synonyms_weak && word.synonyms_weak.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 mb-1.5">WEAK</p>
                    <div className="flex flex-wrap gap-2">
                      {word.synonyms_weak.map((s: string) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="text-sm px-3 py-1 border-zinc-400 text-zinc-600 bg-zinc-50"
                        >
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
          </div>

          {/* Antonyms */}
          <div className="w-full">
            <p className="text-sm font-medium text-zinc-500 mb-3">Antonyms</p>
            {word.antonyms && word.antonyms.length > 0 ? (
              <div className="space-y-3">
                {word.antonyms_strongest && word.antonyms_strongest.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 mb-1.5">STRONGEST</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {word.antonyms_strongest.map((a: string) => (
                        <Badge key={a} variant="outline" className="text-sm px-3 py-1 border-emerald-500 text-emerald-700 bg-emerald-50">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {word.antonyms_strong && word.antonyms_strong.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-600 mb-1.5">STRONG</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {word.antonyms_strong.map((a: string) => (
                        <Badge key={a} variant="outline" className="text-sm px-3 py-1 border-blue-500 text-blue-700 bg-blue-50">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {word.antonyms_weak && word.antonyms_weak.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 mb-1.5">WEAK</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {word.antonyms_weak.map((a: string) => (
                        <Badge key={a} variant="outline" className="text-sm px-3 py-1 border-zinc-400 text-zinc-600 bg-zinc-50">{a}</Badge>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
