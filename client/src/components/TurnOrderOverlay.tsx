import { useEffect, useRef, useState } from "react";
import type { GamePlayer } from "../types";

interface TurnOrderOverlayProps {
  players: GamePlayer[];
  firstPlayerId: string;
}

export function TurnOrderOverlay({ players, firstPlayerId }: TurnOrderOverlayProps) {
  const initialPlayers = useRef(players);
  const initialFirstPlayerId = useRef(firstPlayerId);
  const [visible, setVisible] = useState(true);
  const [settled, setSettled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const order = initialPlayers.current;
    const firstIndex = Math.max(0, order.findIndex((player) => player.id === initialFirstPlayerId.current));
    setActiveIndex(Math.floor(Math.random() * order.length));
    const spin = window.setInterval(() => setActiveIndex((index) => (index + 1) % order.length), 115);
    const settle = window.setTimeout(() => { window.clearInterval(spin); setActiveIndex(firstIndex); setSettled(true); }, 1_850);
    const close = window.setTimeout(() => setVisible(false), 3_050);
    return () => { window.clearInterval(spin); window.clearTimeout(settle); window.clearTimeout(close); };
  }, []);

  if (!visible || initialPlayers.current.length === 0) return null;
  const activePlayer = initialPlayers.current[activeIndex];
  const firstPlayer = initialPlayers.current.find((player) => player.id === initialFirstPlayerId.current) ?? initialPlayers.current[0];

  return (
    <div className="turn-order-overlay" role="status" aria-live="polite">
      <div className={`turn-order-panel ${settled ? "is-settled" : ""}`}>
        <p className="turn-order-kicker">Quay thứ tự lượt chơi</p>
        <div className="turn-order-wheel" aria-hidden="true"><span>✦</span></div>
        <strong className="turn-order-active">{activePlayer?.name}</strong>
        {settled ? <><p className="turn-order-result"><b>{firstPlayer.name}</b> đi trước!</p><ol className="turn-order-list">{initialPlayers.current.map((player, index) => <li key={player.id}><span>{index + 1}</span>{player.name}</li>)}</ol></> : <p className="turn-order-hint">Đang xác định người mở màn...</p>}
      </div>
    </div>
  );
}
