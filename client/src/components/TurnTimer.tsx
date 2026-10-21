import { useEffect, useState } from "react";

interface TurnTimerProps {
  deadline: number | null;
  durationMs: number;
  playerName: string;
}

export function TurnTimer({ deadline, durationMs, playerName }: TurnTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setNow(Date.now());
    if (deadline === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [deadline]);

  if (deadline === null || durationMs <= 0) return null;
  const remainingMs = Math.max(0, deadline - now);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
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
