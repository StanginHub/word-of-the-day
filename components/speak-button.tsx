"use client";
import { useState, useCallback } from "react";

export function SpeakButton({ word }: { word: string }) {
  const [playing, setPlaying] = useState(false);

  const speak = useCallback(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "en-GB";
    u.rate = 0.85;
    u.onstart = () => setPlaying(true);
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(u);
  }, [word]);

  return (
    <button onClick={speak} disabled={playing}
      className={"inline-flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150 " +
        (playing
          ? "bg-accent/15 text-accent scale-95"
          : "text-muted-foreground/50 hover:text-accent hover:bg-accent/8 active:scale-90"
        )}
      title="Listen to pronunciation">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    </button>
  );
}
