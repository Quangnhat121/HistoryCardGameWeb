import { useEffect, useRef, useState } from "react";
import { playTimerTick, playTimerUrgent } from "../sounds";

interface TurnTimerProps {
  deadline: number | null;
  durationMs: number;
  playerName: string;
}

export function TurnTimer({ deadline, durationMs, playerName }: TurnTimerProps) {
  const [now, setNow] = useState(Date.now());
  const lastSoundSecond = useRef<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    if (deadline === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [deadline]);

  const remainingMs = deadline === null ? 0 : Math.max(0, deadline - now);
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  useEffect(() => {
    if (deadline === null || remainingSeconds <= 0 || remainingSeconds > 10) return;
    if (lastSoundSecond.current === remainingSeconds) return;
    lastSoundSecond.current = remainingSeconds;
    if (remainingSeconds <= 5) playTimerUrgent();
    else playTimerTick();
  }, [deadline, remainingSeconds]);

  useEffect(() => {
    lastSoundSecond.current = null;
  }, [deadline]);

  if (deadline === null || durationMs <= 0) return null;
  const ratio = Math.max(0, Math.min(1, remainingMs / durationMs));
  const stateClass = remainingSeconds <= 5 ? "is-danger" : ratio < .5 ? "is-warning" : "";

  return (
    <section className={`turn-timer ${stateClass}`} aria-label={`Thời gian còn lại của ${playerName}`} aria-live="off">
      <div className="turn-timer-meta">
        <span>Lượt của <strong>{playerName}</strong></span>
        <b>{remainingSeconds}s</b>
      </div>
      <div className="turn-timer-track"><span style={{ width: `${ratio * 100}%` }} /></div>
    </section>
  );
}
