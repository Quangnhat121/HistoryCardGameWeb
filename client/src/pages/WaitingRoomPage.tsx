import { useEffect, useRef, useState } from "react";
import type { RoomState } from "../types";
import { Button } from "../components/Button";
import { playClick, playPlayerJoin } from "../sounds";
import { AntigravityCanvas } from "../components/AntigravityCanvas";
import { SpeakingIndicator } from "../components/SpeakingIndicator";

interface WaitingRoomPageProps {
  room: RoomState;
  speakingPlayerIds: string[];
  onStart: () => void;
  onLeave: () => void;
}

export function WaitingRoomPage({ room, speakingPlayerIds, onStart, onLeave }: WaitingRoomPageProps) {
  const [copied, setCopied] = useState(false);
  const [showRoomCode, setShowRoomCode] = useState(true);
  const previousPlayerCount = useRef(room.players.length);
  const isHost = room.hostId === room.selfPlayerId;
  const canStart = !room.started && room.players.length >= 2 && room.players.length <= 4 && room.players.every((player) => player.connected);

  useEffect(() => {
    if (room.players.length > previousPlayerCount.current) playPlayerJoin();
    previousPlayerCount.current = room.players.length;
  }, [room.players.length]);

  const copyCode = async () => {
    playClick();
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-10">
      {/* Antigravity particle background */}
      <AntigravityCanvas
        particleCount={28}
        speedFactor={0.45}
        gravity={-0.035}
        shape="mixed"
        colors={["#e9bd67", "#f5e8ca", "#b08a3e", "#d4a843", "#c8963e"]}
        friction={0.98}
        interactionRadius={100}
        zIndex={0}
        opacity={0.13}
      />
      <section className="rounded-3xl border border-white/10 bg-panel/90 p-6 text-center shadow-2xl sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Phòng chờ</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-normal text-parchment">Mời đồng đội tham gia</h1>
        <div className="mx-auto mt-6 flex w-fit items-stretch gap-2">
          <button
            onClick={() => void copyCode()}
            aria-label="Sao chép mã phòng"
            className="group flex min-w-[220px] items-center justify-center gap-3 rounded-2xl border border-gold/25 bg-gold/10 px-5 py-3 transition hover:bg-gold/15"
          >
            <span className="font-mono text-3xl font-black tracking-[0.25em] text-amber-200">{showRoomCode ? room.code : "•••••"}</span>
            <span className="text-xs text-gold">{copied ? "Đã chép!" : "Sao chép"}</span>
          </button>
          <button
            onClick={() => { playClick(); setCopied(false); setShowRoomCode((visible) => !visible); }}
            aria-label={showRoomCode ? "Ẩn mã phòng" : "Hiện mã phòng"}
            aria-pressed={!showRoomCode}
            title={showRoomCode ? "Ẩn mã phòng" : "Hiện mã phòng"}
            className="flex w-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold transition hover:bg-gold/15"
          >
            {showRoomCode ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d="M3 3l18 18M10.6 6.1A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.1 2.8M6.2 6.3C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6a9.8 9.8 0 0 0 3-.5M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
            )}
          </button>
        </div>

        <div className="my-8 space-y-3 text-left">
          {room.players.map((player) => {
            const speaking = speakingPlayerIds.includes(player.playerId);
            return <div key={player.playerId} className={`voice-participant flex items-center rounded-xl border border-white/5 bg-black/20 px-4 py-3 ${speaking ? "is-speaking" : ""}`}><span className={`mr-3 h-2.5 w-2.5 rounded-full ${speaking ? "voice-speaking-dot" : player.connected ? "bg-emerald-400" : "bg-slate-600"}`} /><span className="flex-1 font-semibold text-slate-200">{player.name}{player.playerId === room.selfPlayerId ? " (Bạn)" : ""}</span>{speaking && <SpeakingIndicator />}{room.started && <span className="ml-2 min-w-12 text-center text-xs font-bold text-slate-400">{player.returnedToRoom ? "Đã về" : "..."}</span>}{player.playerId === room.hostId && <span className="ml-2 rounded-full bg-gold/15 px-2 py-1 text-[10px] font-bold uppercase text-gold">Chủ phòng</span>}</div>;
          })}
          {Array.from({ length: 4 - room.players.length }).map((_, index) => <div key={index} className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-slate-600">Đang chờ người chơi...</div>)}
        </div>

        {room.started ? <p className="rounded-xl bg-black/20 p-3 text-sm text-slate-400">Đang chờ các thành viên còn lại về phòng...</p> : isHost ? <Button onClick={onStart} disabled={!canStart} className="w-full py-3.5">Bắt đầu ({room.players.length}/4)</Button> : <p className="rounded-xl bg-black/20 p-3 text-sm text-slate-400">Đang chờ chủ phòng bắt đầu...</p>}
        <Button onClick={onLeave} variant="danger" className="mt-3 w-full">Rời phòng</Button>
      </section>
    </main>
  );
}
