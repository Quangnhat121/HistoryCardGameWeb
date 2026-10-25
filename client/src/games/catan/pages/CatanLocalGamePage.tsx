import { useCallback, useMemo, useRef, useState } from "react";
import { CatanEngine } from "../../../../../server/src/catan/CatanEngine";
import { catanViewFor } from "../../../../../server/src/catan/viewFor";
import { emptyResources } from "../../../../../server/src/catan/constants";
import type { CatanResource, CatanState, ResourceBundle, DevelopmentCardType } from "../../../../../server/src/catan/types";
import { CatanBoard, type BoardTarget } from "../components/CatanBoard";
import { GameControls, type PlacementMode } from "../components/GameControls";
import { PlayerPanel } from "../components/PlayerPanel";
import { ResourcePanel } from "../components/ResourcePanel";
import { RESOURCE_NAMES } from "../uiCopy";

const resources = Object.keys(RESOURCE_NAMES) as CatanResource[];
const cardNames: Record<DevelopmentCardType, string> = { knight: "Hiệp sĩ", road_building: "Xây đường", year_of_plenty: "Năm sung túc", monopoly: "Độc quyền", victory_point: "Điểm chiến thắng" };
const terrainNames: Record<string, string> = { wood: "Rừng · Gỗ", brick: "Đồi · Gạch", wool: "Đồng cỏ · Cừu", grain: "Ruộng · Lúa mì", ore: "Núi · Quặng", desert: "Sa mạc · Không sản xuất" };
const money = () => emptyResources();

interface Props { names: string[]; onExit: () => void }

export function CatanLocalGamePage({ names, onExit }: Props) {
  const engineRef = useRef<CatanEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new CatanEngine();
    engineRef.current.createGame(names.map((name, index) => ({ id: `local-${index + 1}`, name })));
  }
  const engine = engineRef.current;
  const [state, setState] = useState<CatanState>(() => engine.state!);
  const [viewerId, setViewerId] = useState(() => engine.state!.currentPlayerId);
  const [handoff, setHandoff] = useState(true);
  const [mode, setMode] = useState<PlacementMode>(null);
  const [selected, setSelected] = useState<BoardTarget | null>(null);
  const [inspected, setInspected] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<"trade" | "development" | null>(null);
  const [victimId, setVictimId] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(["Hòn đảo đã được dựng. Bắt đầu thiết lập."]);
  const [discard, setDiscard] = useState<ResourceBundle>(money);
  const [tradeTarget, setTradeTarget] = useState("");
  const [tradeGive, setTradeGive] = useState<ResourceBundle>(money);
  const [tradeWant, setTradeWant] = useState<ResourceBundle>(money);
  const [bankGive, setBankGive] = useState<CatanResource>("wood");
  const [bankReceive, setBankReceive] = useState<CatanResource>("brick");
  const [developmentResource, setDevelopmentResource] = useState<CatanResource>("wood");
  const [developmentSecond, setDevelopmentSecond] = useState<CatanResource>("grain");
  const [mobilePanel, setMobilePanel] = useState<"players" | "resources" | "actions">("actions");

  const view = useMemo(() => catanViewFor(state, viewerId), [state, viewerId]);
  const viewer = view.players.find((player) => player.id === viewerId);
  const actor = state.players.find((player) => player.id === state.currentPlayerId)!;
  const requiredMode: PlacementMode = state.phase === "setup" ? state.setupStep : state.phase === "robber" ? "robber" : state.phase === "road_building" ? "road" : null;
  const activeMode = requiredMode ?? mode;
  const legalTargets = useMemo(() => activeMode ? engine.getLegalTargets(viewerId, activeMode) : [], [engine, viewerId, activeMode, state.revision]);
  const available = useMemo(() => engine.getAvailableActions(viewerId), [engine, viewerId, state.revision]);
  const robberVictims = selected?.kind === "hex" && state.phase === "robber" ? engine.getRobberVictims(viewerId, selected.id) : [];
  const pendingDiscardIds = Object.keys(state.pendingDiscards);
  const discardOwner = pendingDiscardIds[0];
  const canView = !handoff;
  const selectBoard = useCallback((target: BoardTarget) => {
    if (handoff) return;
    setSelected(target);
    setNotice(null);
  }, [handoff]);

  const apply = (description: string, action: () => unknown): boolean => {
    try {
      action();
      const next = engine.state!;
      setState(next);
      setNotice(null);
      setHistory((items) => [`${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} · ${description}`, ...items].slice(0, 30));
      setSelected(null);
      setVictimId("");
      if (next.currentPlayerId !== state.currentPlayerId || next.phase === "discard" && next.pendingDiscards[viewerId] === undefined) {
        setViewerId(Object.keys(next.pendingDiscards)[0] ?? next.currentPlayerId);
        setHandoff(true);
        setDrawer(null);
      }
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể thực hiện hành động.");
      return false;
    }
  };

  const confirmPlacement = () => {
    if (!selected || !activeMode || !legalTargets.includes(selected.id) || viewerId !== state.currentPlayerId) return;
    if (activeMode === "robber" && robberVictims.length > 1 && !victimId) { setNotice("Chọn người chơi bị cướp trước khi xác nhận."); return; }
    const label = activeMode === "road" ? "Đặt đường" : activeMode === "settlement" ? "Xây khu định cư" : activeMode === "city" ? "Nâng cấp thành phố" : "Di chuyển tên cướp";
    apply(`${actor.name}: ${label}`, () => {
      if (activeMode === "road") state.phase === "setup" ? engine.placeInitialRoad(viewerId, selected.id) : engine.buildRoad(viewerId, selected.id);
      else if (activeMode === "settlement") state.phase === "setup" ? engine.placeInitialSettlement(viewerId, selected.id) : engine.buildSettlement(viewerId, selected.id);
      else if (activeMode === "city") engine.upgradeCity(viewerId, selected.id);
      else engine.moveRobber(viewerId, selected.id, victimId || undefined);
    });
    if (!requiredMode) setMode(null);
  };

  const offer = () => {
    if (!tradeTarget) { setNotice("Chọn người nhận giao dịch."); return; }
    if (apply(`${actor.name}: gửi đề nghị giao dịch`, () => engine.createTradeOffer(viewerId, tradeTarget, tradeGive, tradeWant))) {
      setViewerId(tradeTarget); setHandoff(true); setDrawer("trade");
      setTradeGive(money()); setTradeWant(money());
    }
  };

  const playCard = (id: string, type: DevelopmentCardType) => {
    if (apply(`${actor.name}: dùng ${cardNames[type]}`, () => engine.playDevelopmentCard(viewerId, id, type === "year_of_plenty" ? { resources: [developmentResource, developmentSecond] } : type === "monopoly" ? { resource: developmentResource } : undefined))) setDrawer(null);
  };

  const selectedHex = state.board.find((hex) => hex.id === inspected);
  const selectedHexBuildings = selectedHex?.intersectionIds.map((id) => state.buildings[id]).filter(Boolean) ?? [];
  const discardAmount = discardOwner ? state.pendingDiscards[discardOwner] : 0;
  const chosenDiscard = resources.reduce((sum, resource) => sum + discard[resource], 0);

  return <main className="catan-play-shell">
    <header className="catan-play-header"><div className="catan-play-brand"><span>⬡</span><div><strong>CATAN</strong><small>Chơi trên một thiết bị · {names.length} người</small></div></div><div className="catan-turn-chip" style={{ borderColor: actor.color }}><i style={{ background: actor.color }} />{actor.name} · {state.phase === "finished" ? "Chiến thắng" : "Đang tới lượt"}</div><button type="button" onClick={onExit}>← Menu CATAN</button></header>
    <nav className="catan-mobile-tabs" aria-label="Các bảng điều khiển"><button className={mobilePanel === "players" ? "is-active" : ""} onClick={() => setMobilePanel("players")}>Người chơi</button><button className={mobilePanel === "resources" ? "is-active" : ""} onClick={() => setMobilePanel("resources")}>Tài nguyên</button><button className={mobilePanel === "actions" ? "is-active" : ""} onClick={() => setMobilePanel("actions")}>Hành động</button></nav>
    <div className="catan-play-layout"><div className={`catan-side catan-side-left ${mobilePanel === "players" ? "is-mobile-active" : ""}`}><PlayerPanel game={view} viewerId={viewerId} /><section className="catan-ui-panel catan-log-panel"><div className="catan-panel-heading"><span>Nhật ký</span><strong>{history.length} sự kiện</strong></div><ol aria-live="polite">{history.map((entry, index) => <li key={`${index}-${entry}`}>{entry}</li>)}</ol></section></div>
      <div className="catan-center"><CatanBoard game={view} legalTargets={handoff ? [] : legalTargets} selected={selected} onSelect={selectBoard} onInspect={setInspected} />{selectedHex && <div className="catan-tile-info"><button type="button" aria-label="Đóng thông tin ô" onClick={() => setInspected(null)}>×</button><strong>{terrainNames[selectedHex.resource]}</strong><span>Số sản xuất: {selectedHex.token ?? "không có"} · {state.robberHexId === selectedHex.id ? "Đang bị tên cướp chặn" : "Có thể sản xuất"}</span><span>Công trình: {selectedHexBuildings.length ? selectedHexBuildings.map((building) => `${building.kind === "city" ? "Thành phố" : "Khu định cư"} của ${state.players.find((player) => player.id === building.playerId)?.name}`).join(", ") : "Chưa có"}</span></div>}</div>
      <div className={`catan-side catan-side-right ${mobilePanel === "resources" || mobilePanel === "actions" ? "is-mobile-active" : ""}`}>
        <div className={mobilePanel === "resources" ? "catan-mobile-show" : "catan-mobile-hide"}><ResourcePanel player={canView ? viewer : undefined} /><section className="catan-ui-panel catan-development-panel"><div className="catan-panel-heading"><span>Thẻ phát triển</span><strong>{viewer?.developmentCardCount ?? 0} thẻ</strong></div>{canView && viewer?.developmentCards?.length ? viewer.developmentCards.filter((card) => !card.played).map((card) => <button key={card.id} type="button" disabled={viewerId !== state.currentPlayerId || state.phase !== "roll" && state.phase !== "action" || card.type === "victory_point" || card.purchasedTurn === state.turnNumber || state.hasPlayedDevelopmentThisTurn} onClick={() => { setDrawer("development"); setSelected(null); setMode(null); }}><span>{cardNames[card.type]}</span><small>{card.type === "victory_point" ? "Bí mật" : card.purchasedTurn === state.turnNumber ? "Dùng từ lượt sau" : "Mở lựa chọn"}</small></button>) : <p>Chưa có thẻ.</p>}</section></div>
        <div className={mobilePanel === "actions" ? "catan-mobile-show" : "catan-mobile-hide"}><GameControls game={view} viewer={canView ? viewer : undefined} mode={mode} selected={selected} legalCount={legalTargets.length} available={available} onMode={(next) => { setMode(next); setSelected(null); }} onConfirm={confirmPlacement} onRoll={() => apply(`${actor.name}: gieo xúc xắc`, () => engine.rollDice(viewerId))} onEndTurn={() => apply(`${actor.name}: kết thúc lượt`, () => engine.endTurn(viewerId))} onBuyCard={() => apply(`${actor.name}: mua thẻ phát triển`, () => engine.buyDevelopmentCard(viewerId))} onSkipFreeRoads={() => apply(`${actor.name}: kết thúc Xây đường`, () => engine.finishRoadBuilding(viewerId))} onOpenTrade={() => setDrawer("trade")} />
          {selected?.kind === "hex" && robberVictims.length > 1 && <label className="catan-choice">Người bị cướp<select value={victimId} onChange={(event) => setVictimId(event.target.value)}><option value="">Chọn người chơi</option>{robberVictims.map((id) => <option key={id} value={id}>{state.players.find((player) => player.id === id)?.name}</option>)}</select></label>}
          {state.phase === "discard" && discardOwner === viewerId && <section className="catan-ui-panel catan-discard"><strong>Bỏ {discardAmount} tài nguyên</strong><p>Đã chọn {chosenDiscard}/{discardAmount}</p>{resources.map((resource) => <label key={resource}>{RESOURCE_NAMES[resource]}<input type="number" min="0" max={viewer?.resources?.[resource] ?? 0} value={discard[resource]} onChange={(event) => setDiscard((value) => ({ ...value, [resource]: Math.max(0, Math.min(Number(event.target.value) || 0, viewer?.resources?.[resource] ?? 0)) }))} /></label>)}<button className="catan-primary-action" disabled={chosenDiscard !== discardAmount || handoff} onClick={() => { apply(`${viewer?.name}: bỏ tài nguyên`, () => engine.discardResources(viewerId, discard)); setDiscard(money()); }}>Xác nhận bỏ thẻ</button></section>}
          {state.phase === "discard" && discardOwner !== viewerId && <p className="catan-wait-copy">Đang chờ {state.players.find((player) => player.id === discardOwner)?.name} bỏ tài nguyên.</p>}
        </div>
      </div>
    </div>
    {notice && <div className="catan-notice" role="alert"><span>{notice}</span><button type="button" aria-label="Đóng thông báo" onClick={() => setNotice(null)}>×</button></div>}
    {drawer === "trade" && !handoff && <div className="catan-dialog-backdrop"><section className="catan-dialog" role="dialog" aria-modal="true" aria-label="Giao dịch tài nguyên"><button className="catan-dialog-close" onClick={() => { setDrawer(null); if (viewerId !== state.currentPlayerId) { setViewerId(state.currentPlayerId); setHandoff(true); } }} aria-label="Đóng">×</button><h2>Giao dịch</h2><p>{viewerId === state.currentPlayerId ? "Trao đổi với ngân hàng hoặc đề nghị người chơi khác." : "Xem đề nghị và quyết định chấp nhận hoặc từ chối."}</p>{viewerId === state.currentPlayerId && <><div className="catan-trade-bank"><h3>Ngân hàng & cảng</h3><label>Đưa<select value={bankGive} onChange={(event) => setBankGive(event.target.value as CatanResource)}>{resources.map((resource) => <option key={resource} value={resource}>{RESOURCE_NAMES[resource]}</option>)}</select></label><label>Nhận<select value={bankReceive} onChange={(event) => setBankReceive(event.target.value as CatanResource)}>{resources.map((resource) => <option key={resource} value={resource}>{RESOURCE_NAMES[resource]}</option>)}</select></label><p>Tỷ lệ: {engine.getMaritimeRatio(viewerId, bankGive)} {RESOURCE_NAMES[bankGive]} → 1 {RESOURCE_NAMES[bankReceive]}</p><button disabled={!engine.canMaritimeTrade(viewerId, bankGive, bankReceive)} onClick={() => apply(`${actor.name}: đổi tài nguyên với ngân hàng`, () => engine.maritimeTrade(viewerId, bankGive, bankReceive))}>Thực hiện đổi</button></div>
      <div className="catan-trade-player"><h3>Đề nghị người chơi</h3><select aria-label="Người nhận đề nghị" value={tradeTarget} onChange={(event) => setTradeTarget(event.target.value)}><option value="">Chọn người chơi</option>{state.players.filter((player) => player.id !== viewerId).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select><div className="catan-trade-grid"><strong>Bạn đưa</strong><strong>Bạn muốn</strong>{resources.map((resource) => <div key={resource} className="catan-trade-row"><span>{RESOURCE_NAMES[resource]}</span><input aria-label={`Đưa ${RESOURCE_NAMES[resource]}`} type="number" min="0" max="19" value={tradeGive[resource]} onChange={(event) => setTradeGive((value) => ({ ...value, [resource]: Math.max(0, Math.min(19, Number(event.target.value) || 0)) }))} /><input aria-label={`Muốn ${RESOURCE_NAMES[resource]}`} type="number" min="0" max="19" value={tradeWant[resource]} onChange={(event) => setTradeWant((value) => ({ ...value, [resource]: Math.max(0, Math.min(19, Number(event.target.value) || 0)) }))} /></div>)}</div><button onClick={offer}>Gửi đề nghị</button></div></>}
      {view.tradeOffers.filter((entry) => entry.status === "open").map((entry) => <div className="catan-offer" key={entry.id}><span>{state.players.find((player) => player.id === entry.proposerId)?.name} → {state.players.find((player) => player.id === entry.targetId)?.name}: đưa {resources.filter((resource) => entry.give[resource]).map((resource) => `${entry.give[resource]} ${RESOURCE_NAMES[resource]}`).join(", ")} · nhận {resources.filter((resource) => entry.want[resource]).map((resource) => `${entry.want[resource]} ${RESOURCE_NAMES[resource]}`).join(", ")}</span><div>{entry.targetId === viewerId && <><button onClick={() => { if (apply("Chấp nhận giao dịch", () => engine.acceptTrade(viewerId, entry.id))) { setViewerId(state.currentPlayerId); setHandoff(true); setDrawer(null); } }}>Chấp nhận</button><button onClick={() => { if (apply("Từ chối giao dịch", () => engine.rejectTrade(viewerId, entry.id))) { setViewerId(state.currentPlayerId); setHandoff(true); setDrawer(null); } }}>Từ chối</button></>}{entry.proposerId === viewerId && <button onClick={() => apply("Hủy giao dịch", () => engine.cancelTrade(viewerId, entry.id))}>Hủy</button>}</div></div>)}
      </section></div>}
    {drawer === "development" && !handoff && <div className="catan-dialog-backdrop"><section className="catan-dialog" role="dialog" aria-modal="true" aria-label="Sử dụng thẻ phát triển"><button className="catan-dialog-close" onClick={() => setDrawer(null)} aria-label="Đóng">×</button><h2>Thẻ phát triển</h2><div className="catan-dev-select"><label>Tài nguyên chọn<select value={developmentResource} onChange={(event) => setDevelopmentResource(event.target.value as CatanResource)}>{resources.map((resource) => <option key={resource} value={resource}>{RESOURCE_NAMES[resource]}</option>)}</select></label><label>Tài nguyên thứ hai (Năm sung túc)<select value={developmentSecond} onChange={(event) => setDevelopmentSecond(event.target.value as CatanResource)}>{resources.map((resource) => <option key={resource} value={resource}>{RESOURCE_NAMES[resource]}</option>)}</select></label></div>{viewer?.developmentCards?.filter((card) => !card.played && card.type !== "victory_point").map((card) => <button className="catan-dev-action" key={card.id} disabled={card.purchasedTurn === state.turnNumber || state.hasPlayedDevelopmentThisTurn} onClick={() => playCard(card.id, card.type)}>{cardNames[card.type]} <span>→</span></button>)}</section></div>}
    {handoff && <div className="catan-handoff"><div role="dialog" aria-modal="true" aria-label="Chuyển lượt"><span>Chuyển thiết bị</span><h2>{state.players.find((player) => player.id === viewerId)?.name}</h2><p>Đưa thiết bị cho người chơi này trước khi mở thông tin riêng.</p><button type="button" onClick={() => setHandoff(false)}>Tôi đã sẵn sàng →</button></div></div>}
  </main>;
}
