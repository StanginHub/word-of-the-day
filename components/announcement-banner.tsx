"use client";
import { useState, useEffect } from "react";

export function AnnouncementBanner() {
  const [data, setData] = useState<{title:string;body:string;enabled:boolean} | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/announcement").then(r => r.json()).then(d => {
      if (d.enabled) setData(d);
    }).catch(() => {});
  }, []);

  if (!data || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm">{data.title}</h3>
          <button onClick={() => setDismissed(true)}
            className="text-muted-foreground/50 hover:text-foreground transition p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{data.body}</p>
        </div>
        <div className="px-5 py-3 border-t border-border flex justify-end">
          <button onClick={() => setDismissed(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
