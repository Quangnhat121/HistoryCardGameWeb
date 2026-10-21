import type { GamePlayer } from "../types";

interface PlayerBarProps {
  players: GamePlayer[];
  currentPlayerId: string;
  selfPlayerId: string;
  drawPileCount: number;
}

export function PlayerBar({ players, currentPlayerId, selfPlayerId, drawPileCount }: PlayerBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-2 backdrop-blur sm:justify-between">
      <div className="flex flex-wrap justify-center gap-2">
        {players.map((player) => {
          const active = player.id === currentPlayerId;
          return (
            <div key={player.id} className={`rounded-xl border px-3 py-2 text-xs transition sm:text-sm ${active ? "border-gold bg-gold/15 text-amber-100 shadow-[0_0_14px_rgba(213,170,85,.25)]" : "border-white/10 bg-white/5 text-slate-300"}`}>
              <span className="font-bold">{player.name}{player.id === selfPlayerId ? " (Bạn)" : ""}</span>
              <span className="ml-2 text-slate-400">{player.handCount} thẻ</span>
            </div>
          );
        })}
      </div>
      <div className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300 sm:text-sm">
        Chồng bốc: <strong className="text-white">{drawPileCount}</strong>
      </div>
    </div>
  );
}
