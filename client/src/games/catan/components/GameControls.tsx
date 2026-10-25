import type { CatanViewState, CatanViewPlayer } from "../../../../../server/src/catan/types";
import type { BoardTarget } from "./CatanBoard";

export type PlacementMode = "road" | "settlement" | "city" | "robber" | null;

interface Props {
  game: CatanViewState;
  viewer: CatanViewPlayer | undefined;
  mode: PlacementMode;
  selected: BoardTarget | null;
  legalCount: number;
  available: { road: boolean; settlement: boolean; city: boolean; development: boolean; trade: boolean };
  onMode: (mode: PlacementMode) => void;
  onConfirm: () => void;
  onRoll: () => void;
  onEndTurn: () => void;
  onBuyCard: () => void;
  onSkipFreeRoads: () => void;
  onOpenTrade: () => void;
}

const phaseCopy: Record<CatanViewState["phase"], string> = {
  setup: "Thiết lập: đặt khu định cư rồi đường", roll: "Chờ gieo xúc xắc", discard: "Bỏ nửa tài nguyên trước khi tên cướp di chuyển",
  robber: "Di chuyển tên cướp", action: "Giao dịch và xây dựng", road_building: "Đặt đường miễn phí", finished: "Trận đấu kết thúc",
};

export function GameControls({ game, viewer, mode, selected, legalCount, available, onMode, onConfirm, onRoll, onEndTurn, onBuyCard, onSkipFreeRoads, onOpenTrade }: Props) {
  const isTurn = viewer?.id === game.currentPlayerId;
  const setupMode = game.phase === "setup" ? game.setupStep : null;
  const requiredMode: PlacementMode = setupMode === "settlement" ? "settlement" : setupMode === "road" || game.phase === "road_building" ? "road" : game.phase === "robber" ? "robber" : null;
  const activeMode = requiredMode ?? mode;
  const canAct = Boolean(isTurn && game.phase !== "finished");
  const buttons = [
    { id: "road", label: "Đường", cost: "1 gỗ · 1 gạch" },
    { id: "settlement", label: "Khu định cư", cost: "1 gỗ · 1 gạch · 1 cừu · 1 lúa" },
    { id: "city", label: "Thành phố", cost: "3 quặng · 2 lúa" },
  ] as const;
  return <section className="catan-ui-panel catan-controls" aria-label="Điều khiển lượt">
    <div className="catan-panel-heading"><span>Điều khiển</span><strong>{game.dice ? `Xúc xắc ${game.dice[0]} + ${game.dice[1]} = ${game.dice[0] + game.dice[1]}` : "Chưa gieo"}</strong></div>
    <p className="catan-phase-copy">{phaseCopy[game.phase]}</p>
    {game.phase === "finished" ? <p className="catan-win-message">{game.players.find((player) => player.id === game.winner)?.name} chiến thắng!</p> : null}
    {game.phase === "roll" && <button type="button" className="catan-primary-action" disabled={!canAct} onClick={onRoll}>⚄ Gieo hai xúc xắc</button>}
    {(game.phase === "setup" || game.phase === "robber" || game.phase === "road_building") && <p className="catan-control-hint">Chọn {requiredMode === "road" ? "cạnh" : requiredMode === "robber" ? "ô địa hình" : "giao điểm"} đang sáng trên bàn. {legalCount} vị trí hợp lệ.</p>}
    {game.phase === "action" && <><div className="catan-action-buttons">{buttons.map((button) => <button key={button.id} type="button" className={activeMode === button.id ? "is-active" : ""} onClick={() => onMode(activeMode === button.id ? null : button.id)} disabled={!canAct || !available[button.id]}><strong>{button.label}</strong><small>{button.cost}</small></button>)}</div><div className="catan-control-row"><button type="button" onClick={onBuyCard} disabled={!canAct || !available.development}>Thẻ phát triển <small>1 quặng · 1 cừu · 1 lúa</small></button><button type="button" onClick={onOpenTrade} disabled={!canAct || !available.trade}>Giao dịch</button></div></>}
    {selected && activeMode && <div className="catan-confirm"><span>Đã chọn {activeMode === "robber" ? "ô" : activeMode === "road" ? "cạnh" : "giao điểm"} {selected.id}</span><div><button type="button" onClick={() => onMode(requiredMode)}>Hủy chọn</button><button type="button" className="catan-primary-action" onClick={onConfirm}>Xác nhận</button></div></div>}
    {game.phase === "road_building" && <button type="button" onClick={onSkipFreeRoads} disabled={legalCount > 0}>Không còn đường hợp lệ</button>}
    {game.phase === "action" && <button type="button" className="catan-end-turn" disabled={!canAct} onClick={onEndTurn}>Kết thúc lượt →</button>}
  </section>;
}
