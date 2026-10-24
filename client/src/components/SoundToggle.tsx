import { useState } from "react";
import { isMuted, playClick, setMuted } from "../sounds";

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 9v6h4l5 4V5L9 9H5Z" />
      {muted ? (
        <>
          <path d="m17 9 4 6" />
          <path d="m21 9-4 6" />
        </>
      ) : (
        <>
          <path d="M17 9.5a4 4 0 0 1 0 5" />
          <path d="M19.5 7a7 7 0 0 1 0 10" />
        </>
      )}
    </svg>
  );
}

export function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted());

  const toggle = () => {
    const nextMuted = !muted;
    if (nextMuted) playClick();
    setMuted(nextMuted);
    setMutedState(nextMuted);
    if (!nextMuted) playClick();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-4 right-4 z-[80] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-ink/85 text-parchment shadow-xl backdrop-blur transition hover:border-gold/50 hover:text-gold"
      aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
      title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
      aria-pressed={muted}
    >
      <SpeakerIcon muted={muted} />
    </button>
  );
}
