import { useState } from "react";
import { isMuted, playClick, setMuted } from "../sounds";

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
      className="fixed bottom-4 right-4 z-[80] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-ink/85 text-lg text-parchment shadow-xl backdrop-blur transition hover:border-gold/50 hover:text-gold"
      aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
      title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
    >
      <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
    </button>
  );
}
