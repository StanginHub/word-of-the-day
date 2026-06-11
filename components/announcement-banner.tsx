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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="bg-background border border-border rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="text-center px-6 pt-6 pb-3">
          <h2 className="text-lg font-bold text-foreground">{data.title}</h2>
        </div>
        {/* Scrollable body */}
        <div className="px-6 pb-4 overflow-y-auto flex-1 min-h-0">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: data.body}} />
        </div>
        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-center">
          <button onClick={() => setDismissed(true)}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
