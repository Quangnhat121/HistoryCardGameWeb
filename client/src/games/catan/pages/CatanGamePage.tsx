import type { CatanGameState, CatanRoomState } from "../types";
import { CatanBoard } from "../components/CatanBoard";
import { PlayerPanel } from "../components/PlayerPanel";

interface Props {
  room: CatanRoomState;
  game: CatanGameState;
  onLeave: () => void;
}

export function CatanGamePage({ room, game, onLeave }: Props) {
  return (
    <main className="catan-board-page min-h-screen">
      <header className="catan-board-header"><div><small>Đảo</small><strong>{room.code}</strong></div><h1>CATAN <span>· Bản nền tảng</span></h1><button type="button" onClick={onLeave}>Rời bàn</button></header>
      <div className="catan-play-layout catan-online-preview"><CatanBoard game={game} legalTargets={[]} selected={null} onSelect={() => {}} onInspect={() => {}} /><aside><PlayerPanel game={game} viewerId={room.selfPlayerId} /><p className="catan-foundation-note">Bàn trực tuyến hiện dùng để xem trước. Chọn “Chơi CATAN ngay” trong menu để chơi đầy đủ trên một thiết bị.</p></aside></div>
    </main>
  );
}
