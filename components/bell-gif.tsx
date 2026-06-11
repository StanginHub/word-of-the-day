"use client";

export function BellGif() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("show-announcement"));
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-4 right-4 z-40 w-20 h-20 sm:w-24 sm:h-24 hover:scale-110 active:scale-90 transition-transform duration-200 cursor-pointer"
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
