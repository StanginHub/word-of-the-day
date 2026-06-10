"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface WordItem {
  id: string;
  word: string;
  fetched_date: string;
}

interface DateSelectorProps {
  words: WordItem[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  return `${month} ${day}`;
}

export default function DateSelector({
  words,
  selectedDate,
  onSelect,
}: DateSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll the active chip into view on mount / selection change
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      // Only scroll if the element is not fully visible
      if (
        elRect.left < containerRect.left ||
        elRect.right > containerRect.right
      ) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedDate]);

  // Sort words by fetched_date descending
  const sorted = [...words].sort(
    (a, b) =>
      new Date(b.fetched_date).getTime() - new Date(a.fetched_date).getTime()
  );

  return (
    <div className="w-full mb-8">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scroll-smooth scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {sorted.map((w) => {
          const isActive = w.fetched_date === selectedDate;
          return (
            <button
              key={w.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSelect(w.fetched_date)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                "border cursor-pointer",
                isActive
                  ? "bg-accent text-white border-accent shadow-sm"
                  : "bg-white text-muted-foreground border-border hover:border-accent/60 hover:text-accent"
              )}
            >
              <span className="font-semibold">{formatDateLabel(w.fetched_date)}</span>
              <span className="mx-1.5 text-muted-foreground/40">—</span>
              <span>{w.word}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
