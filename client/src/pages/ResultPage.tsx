import { useEffect } from "react";
import { Button } from "../components/Button";
import { playDefeat, playVictory } from "../sounds";
import { AntigravityCanvas } from "../components/AntigravityCanvas";

interface ResultPageProps {
  winnerName: string;
  isSelf: boolean;
  isHost: boolean;
  onRematch: () => void;
  onLeave: () => void;
}

export function ResultPage({ winnerName, isSelf, isHost, onRematch, onLeave }: ResultPageProps) {
  useEffect(() => {
    if (isSelf) playVictory();
    else playDefeat();
  }, [isSelf]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      {/* Victory: scattered gold particles floating up; Defeat: subtle floating cool tones */}
      {isSelf ? (
        <AntigravityCanvas
          particleCount={55}
          speedFactor={0.9}
          gravity={-0.06}
          shape="mixed"
          colors={["#e9bd67", "#f5e8ca", "#f0c86a", "#ffd700", "#d4a843", "#ffe680"]}
          friction={0.965}
          interactionRadius={160}
          zIndex={0}
          opacity={0.55}
        />
      ) : (
        <AntigravityCanvas
          particleCount={30}
          speedFactor={0.5}
          gravity={0.03}
          shape="mixed"
          colors={["#6b7280", "#4b5563", "#374151", "#9ca3af", "#8b9ab0"]}
          friction={0.98}
          interactionRadius={100}
          zIndex={0}
          opacity={0.20}
        />
      )}
      <section className="w-full max-w-lg rounded-3xl border border-gold/20 bg-panel/95 p-8 text-center shadow-2xl sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-4xl">♛</div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-gold">Ván chơi kết thúc</p>
        <h1 className="mt-3 break-words text-4xl font-black leading-tight tracking-normal text-parchment">{isSelf ? "Bạn chiến thắng!" : `${winnerName} chiến thắng!`}</h1>
        <p className="mt-3 text-sm text-slate-400">{isHost ? "Đưa mọi người về phòng chờ để bắt đầu ván mới." : "Bạn vẫn ở trong phòng. Hãy chờ chủ phòng mở ván tiếp theo."}</p>
        {isHost ? (
          <Button onClick={onRematch} className="mt-8 w-full py-3.5">Về phòng chờ</Button>
        ) : (
          <div className="mt-8 rounded-xl border border-gold/15 bg-black/20 p-3 text-sm text-slate-400">Đang chờ chủ phòng...</div>
        )}
        <Button onClick={onLeave} variant="danger" className="mt-3 w-full">Rời phòng</Button>
      </section>
    </main>
  );
}
