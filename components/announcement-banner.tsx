"use client";
import { useState, useEffect, useRef } from "react";

const LS_KEY = "ann_hash";

export function AnnouncementBanner({ initialAnnouncement }: { initialAnnouncement?: {title:string;body:string} | null }) {
  const [data, setData] = useState<{title:string;body:string} | null>(null);
  const savedRef = useRef<{title:string;body:string} | null>(null);

  // SSR data: only show if localStorage hash != current content
  useEffect(() => {
    if (!initialAnnouncement) return;
    const body = initialAnnouncement.body;
    const hash = body.length + "-" + body.slice(0, 20);
    if (localStorage.getItem(LS_KEY) === hash) return;
    setData(initialAnnouncement);
    savedRef.current = initialAnnouncement;
  }, [initialAnnouncement]);

  // Bell click: always re-show from saved data
  useEffect(() => {
    const show = () => {
      if (savedRef.current) setData(savedRef.current);
    };
    window.addEventListener("show-announcement", show);
    return () => window.removeEventListener("show-announcement", show);
  }, []);

  if (!data) return null;

  const dismiss = () => {
    const hash = data.body.length + "-" + data.body.slice(0, 20);
    localStorage.setItem(LS_KEY, hash);
    setData(null);
  };

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
