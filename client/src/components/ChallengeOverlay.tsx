import { useEffect, useState } from "react";
import type { ChallengeVisual } from "../types";
import { Card } from "./Card";

export function ChallengeOverlay({ result }: { result: ChallengeVisual | null }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setFlipped(false);
    if (!result) return;
    const frame = requestAnimationFrame(() => setFlipped(true));
    return () => cancelAnimationFrame(frame);
  }, [result]);

  if (!result) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`flex flex-col items-center gap-4 ${result.correct ? "" : "animate-return-card"}`}>
        <Card card={result.card} showBack={flipped} year={result.year} className="w-40 sm:w-48" />
        <div className={`rounded-2xl border px-6 py-3 text-center shadow-2xl ${result.correct ? "border-emerald-400/50 bg-emerald-950/90 text-emerald-300" : "border-red-400/50 bg-red-950/90 text-red-300"}`}>
          <strong className="block text-3xl font-black">{result.correct ? "Đúng!" : "Sai!"}</strong>
          <span className="mt-1 block text-sm text-white/80">{result.drawerName} bốc thêm 1 thẻ</span>
        </div>
      </div>
    </div>
  );
}
