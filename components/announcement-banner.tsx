"use client";
import { useState, useEffect, useRef } from "react";

export function AnnouncementBanner({ initialAnnouncement }: { initialAnnouncement?: {title:string;body:string} | null }) {
  const [data, setData] = useState<{title:string;body:string} | null>(null);
  const savedRef = useRef<{title:string;body:string} | null>(null);

  // Check hash against initial SSR data
  useEffect(() => {
    if (!initialAnnouncement) return;
    const key = initialAnnouncement.title + "|" + initialAnnouncement.body;
    const hash = key.length + "-" + key.slice(0, 20);
    // Show only if NOT dismissed this specific content
    if (sessionStorage.getItem("ann_hash") === hash) return;
    setData(initialAnnouncement);
    savedRef.current = initialAnnouncement;
  }, [initialAnnouncement]);

  // Register bell click listener once
  useEffect(() => {
    const show = () => {
      if (savedRef.current) setData(savedRef.current);
    };
    window.addEventListener("show-announcement", show);
    return () => window.removeEventListener("show-announcement", show);
  }, []);

  if (!data) return null;

  const dismiss = () => {
    // Store the current content's hash so it won't show again on refresh
    const key = data.title + "|" + data.body;
    const hash = key.length + "-" + key.slice(0, 20);
    sessionStorage.setItem("ann_hash", hash);
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
