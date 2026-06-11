"use client";
import { useState, useEffect } from "react";

export function AnnouncementBanner() {
  const [data, setData] = useState<{title:string;body:string;enabled:boolean} | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/announcement");
        const d = await res.json();
        if (!d.enabled) return;
        // Simple hash that works with all Unicode
        const key = d.title + "|" + d.body + "|" + (d.enabled ? "1" : "0");
        const hash = key.length + "-" + key.slice(0, 20);
        if (sessionStorage.getItem("ann_hash") === hash) return;
        sessionStorage.setItem("ann_hash", hash);
        setData(d);
      } catch {}
    };
    check();
    window.addEventListener("show-announcement", check);
    return () => window.removeEventListener("show-announcement", check);
  }, []);

  if (!data) return null;

  const dismiss = () => setData(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="bg-background border border-border rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[80vh]">
        <div className="text-center px-6 pt-6 pb-3">
          <h2 className="text-lg font-bold text-foreground">{data.title}</h2>
        </div>
        <div className="px-6 pb-4 overflow-y-auto flex-1 min-h-0">
          <div className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{__html: data.body}} />
        </div>
        <div className="px-6 py-3 border-t border-border flex justify-center">
          <button onClick={dismiss}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
