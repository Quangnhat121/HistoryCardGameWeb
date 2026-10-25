import type { CatanRoomState } from "../types";

interface Props {
  room: CatanRoomState;
  onStart: () => void;
  onLeave: () => void;
}

export function CatanWaitingRoomPage({ room, onStart, onLeave }: Props) {
  const isHost = room.hostId === room.selfPlayerId;
  const canStart = isHost && room.players.length >= 3 && room.players.length <= 4 && room.players.every((player) => player.connected);
  return (
    <main className="catan-room min-h-screen">
      <div className="catan-room-panel">
        <header><span>Phòng CATAN</span><button type="button" onClick={onLeave}>Rời phòng</button></header>
        <div className="catan-room-code"><small>Mã hòn đảo</small><strong>{room.code}</strong><p>Chia sẻ mã này với 2–3 người bạn</p></div>
        <div className="catan-player-list">
          {Array.from({ length: 4 }, (_, index) => {
            const player = room.players[index];
            return player ? (
              <div key={player.playerId} className={player.connected ? "" : "is-away"}>
                <i style={{ background: ["#c85b3c", "#2f7398", "#d5a42d", "#5b8a4f"][index] }} />
                <span><strong>{player.name}{player.playerId === room.selfPlayerId ? " (Bạn)" : ""}</strong><small>{player.playerId === room.hostId ? "Chủ đảo" : player.connected ? "Đã sẵn sàng" : "Mất kết nối"}</small></span>
                <b>{player.connected ? "✓" : "…"}</b>
              </div>
            ) : <div key={index} className="is-empty"><i /><span><strong>Đang chờ nhà khai phá</strong><small>Vị trí còn trống</small></span></div>;
          })}
        </div>
        <button type="button" className="catan-start" onClick={onStart} disabled={!canStart}>
          {isHost ? room.players.length < 3 ? `Cần thêm ${3 - room.players.length} người` : "Khởi tạo bàn đảo" : "Đang chờ chủ đảo"}
        </button>
        <p className="catan-room-hint">CATAN cần 3–4 người chơi · Phòng tự reconnect trong 60 giây</p>
      </div>
    </main>
  );
}
