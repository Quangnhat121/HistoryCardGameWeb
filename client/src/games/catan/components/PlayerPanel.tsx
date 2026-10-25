import type { CatanViewState } from "../../../../../server/src/catan/types";

export function PlayerPanel({ game, viewerId }: { game: CatanViewState; viewerId: string }) {
  return <section className="catan-ui-panel" aria-label="Người chơi và điểm số">
    <div className="catan-panel-heading"><span>Người chơi</span><strong>Lượt {game.turnNumber || "thiết lập"}</strong></div>
    <div className="catan-players">{game.players.map((player) => <div key={player.id} className={`catan-player ${player.id === game.currentPlayerId ? "is-turn" : ""}`}><i style={{ background: player.color }} /><div><strong>{player.name}{player.id === viewerId ? " · Bạn" : ""}</strong><small>{player.id === game.currentPlayerId ? "Đang tới lượt" : `${player.resourceCount} tài nguyên · ${player.developmentCardCount} thẻ phát triển`}</small>{player.id === viewerId && player.privateVictoryPoints !== undefined && player.privateVictoryPoints > player.victoryPoints && <small>Riêng bạn: {player.privateVictoryPoints} điểm kể cả thẻ ẩn</small>}</div><b>{player.victoryPoints} <small>điểm</small></b></div>)}</div>
    <div className="catan-awards"><span>Đường dài nhất <b>{game.players.find((player) => player.id === game.longestRoad.holderId)?.name ?? "Chưa có"}</b></span><span>Đội quân lớn nhất <b>{game.players.find((player) => player.id === game.largestArmy.holderId)?.name ?? "Chưa có"}</b></span></div>
  </section>;
}
