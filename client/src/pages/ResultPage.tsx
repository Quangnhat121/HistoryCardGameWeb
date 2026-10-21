import { useEffect } from "react";
import { Button } from "../components/Button";
import { playDefeat, playVictory } from "../sounds";

export function ResultPage({ winnerName, isSelf, onLobby }: { winnerName: string; isSelf: boolean; onLobby: () => void }) {
  useEffect(() => {
    if (isSelf) playVictory();
    else playDefeat();
  }, [isSelf]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-lg rounded-3xl border border-gold/20 bg-panel/95 p-8 text-center shadow-2xl sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-4xl">♛</div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-gold">Ván chơi kết thúc</p>
        <h1 className="mt-3 break-words text-4xl font-black leading-tight tracking-normal text-parchment">{isSelf ? "Bạn chiến thắng!" : `${winnerName} chiến thắng!`}</h1>
        <p className="mt-3 text-sm text-slate-400">Một hành trình xuyên lịch sử vừa khép lại.</p>
        <Button onClick={onLobby} className="mt-8 w-full py-3.5">Về sảnh</Button>
      </section>
    </main>
  );
}
