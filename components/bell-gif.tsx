"use client";
import { useEffect, useState, useCallback } from "react";

export function BellGif() {
  const [bounce, setBounce] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Re-show the bell if it was hidden by clicking it
    const handler = () => {
      // only re-show if announcement is gone
    };
    window.addEventListener("announcement-dismissed", handler);
    return () => window.removeEventListener("announcement-dismissed", handler);
  }, []);

  const handleClick = useCallback(() => {
    setBounce(true);
    setTimeout(() => setBounce(false), 300);
    // Dispatch event for AnnouncementBanner to listen
    window.dispatchEvent(new CustomEvent("show-announcement"));
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-4 right-4 z-40 w-20 h-20 sm:w-24 sm:h-24 transition-transform duration-200 hover:scale-110 active:scale-90 ${bounce ? "scale-110" : ""}`}
      title="View announcement"
    >
      <img
        src="/stang-bell.gif"
        alt="Announcement"
        className="w-full h-full pointer-events-none select-none"
      />
    </button>
  );
}
