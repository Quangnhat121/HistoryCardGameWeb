import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import type { GameState, RoomState } from "../types";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Hand } from "../components/Hand";
import { PlayerBar } from "../components/PlayerBar";
import { TurnTimer } from "../components/TurnTimer";
import { TurnOrderOverlay } from "../components/TurnOrderOverlay";
import { playCardPlace, playYourTurn } from "../sounds";

interface GamePageProps {
  room: RoomState;
  game: GameState;
  onPlace: (cardId: number, index: number) => void;
  onChallenge: (cardId: number) => void;
  onSkipChallenge: () => void;
  timeoutNotice: string | null;
  speakingPlayerIds: string[];
}

export function GamePage({ room, game, timeoutNotice, speakingPlayerIds, onPlace, onChallenge, onSkipChallenge }: GamePageProps) {
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(null);
  const [challengePending, setChallengePending] = useState(false);
  const [draggedCard, setDraggedCard] = useState<{ cardId: number; x: number; y: number } | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const wasMyTurn = useRef(false);
  const timelineScrollerRef = useRef<HTMLDivElement | null>(null);
  const timelinePanRef = useRef<{ pointerId: number; startX: number; startScrollLeft: number; moved: boolean } | null>(null);
  const suppressTimelineClickRef = useRef(false);
  const isMyTurn = game.currentPlayerId === room.selfPlayerId;
  const ownPlayer = game.players.find((player) => player.id === room.selfPlayerId);
  const hand = ownPlayer?.hand ?? [];
  const canChallenge = isMyTurn && game.lastPlaced !== null && !game.hasChallengedThisTurn;
  const awaitingVerdict = game.phase === "awaiting_verdict";
  const currentPlayerName = game.players.find((player) => player.id === game.currentPlayerId)?.name ?? "Người chơi";
  const lastPlacedPlayerName = game.players.find((player) => player.id === game.lastPlaced?.playerId)?.name ?? "Người chơi trước";

  useEffect(() => {
    if (selectedCardId !== null && !hand.some((card) => card.cardId === selectedCardId)) setSelectedCardId(null);
    if (!isMyTurn) setSelectedIndex(null);
    if (selectedChallengeId !== game.lastPlaced?.cardId) setSelectedChallengeId(null);
    if (game.hasChallengedThisTurn || !game.lastPlaced) setChallengePending(false);
  }, [game.hasChallengedThisTurn, game.lastPlaced, hand, isMyTurn, selectedCardId, selectedChallengeId]);

  useEffect(() => {
    if (isMyTurn && !wasMyTurn.current) playYourTurn();
    wasMyTurn.current = isMyTurn;
  }, [isMyTurn]);

  const place = () => {
    if (!isMyTurn || selectedCardId === null || selectedIndex === null || awaitingVerdict) return;
    playCardPlace();
    onPlace(selectedCardId, selectedIndex);
    setSelectedCardId(null);
    setSelectedIndex(null);
  };

  const challenge = () => {
    if (!canChallenge || selectedChallengeId === null || challengePending) return;
    setChallengePending(true);
    onChallenge(selectedChallengeId);
  };

  const dropIndexAt = (clientX: number, clientY: number): number | null => {
    const dropTarget = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>("[data-timeline-drop-index]");
    if (!dropTarget) return null;
    const index = Number(dropTarget.dataset.timelineDropIndex);
    return Number.isInteger(index) ? index : null;
  };

  const moveDraggedCard = (clientX: number, clientY: number) => {
    setDraggedCard((current) => current ? { ...current, x: clientX, y: clientY } : current);
    setDraggedOverIndex(dropIndexAt(clientX, clientY));
  };

  const finishCardDrag = (clientX: number, clientY: number) => {
    const index = dropIndexAt(clientX, clientY);
    if (draggedCard && index !== null && isMyTurn && !awaitingVerdict) {
      playCardPlace();
      onPlace(draggedCard.cardId, index);
      setSelectedCardId(null);
      setSelectedIndex(null);
    }
    setDraggedCard(null);
    setDraggedOverIndex(null);
  };

  const startTimelinePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !timelineScrollerRef.current) return;
    suppressTimelineClickRef.current = false;
    timelinePanRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: timelineScrollerRef.current.scrollLeft,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveTimelinePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pan = timelinePanRef.current;
    if (!pan || pan.pointerId !== event.pointerId || !timelineScrollerRef.current) return;
    const deltaX = event.clientX - pan.startX;
    if (Math.abs(deltaX) > 6) {
      pan.moved = true;
      suppressTimelineClickRef.current = true;
    }
    if (pan.moved) timelineScrollerRef.current.scrollLeft = pan.startScrollLeft - deltaX;
  };

  const finishTimelinePan = (event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const pan = timelinePanRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    timelinePanRef.current = null;
    if (cancelled) suppressTimelineClickRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1600px] px-3 py-4 sm:px-6 sm:py-6">
      <TurnOrderOverlay players={game.players} firstPlayerId={game.currentPlayerId} />
      <div className="mb-3 flex items-center justify-between px-1">
        <div><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Phòng</span><strong className="ml-2 font-mono tracking-widest text-parchment">{room.code}</strong></div>
        <div className={`rounded-full px-3 py-1.5 text-xs font-bold ${isMyTurn ? "bg-emerald-400/15 text-emerald-300" : "bg-white/5 text-slate-400"}`}>
          {isMyTurn ? (awaitingVerdict ? "Phán quyết thẻ cuối" : game.hasChallengedThisTurn ? "Hãy đặt một thẻ" : "Đến lượt bạn") : `Lượt của ${game.players.find((player) => player.id === game.currentPlayerId)?.name ?? "..."}`}
        </div>
      </div>

      <TurnTimer deadline={game.turnDeadline} durationMs={game.turnDurationMs} playerName={currentPlayerName} />
      {timeoutNotice && <div className="timeout-toast" role="status"><span>⌛</span>{timeoutNotice}</div>}

      <PlayerBar players={game.players} currentPlayerId={game.currentPlayerId} selfPlayerId={room.selfPlayerId} drawPileCount={game.drawPileCount} speakingPlayerIds={speakingPlayerIds} />

      <section className="mt-4 rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_center,rgba(58,74,62,.7),rgba(12,17,18,.95)_70%)] p-3 shadow-2xl sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div><h2 className="text-lg font-bold tracking-normal text-parchment">Dòng thời gian</h2><p className="text-xs text-slate-400">Kéo thẻ vào một khe hoặc chọn bằng nút</p></div>
          {game.hasChallengedThisTurn && <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold">Hãy đặt một thẻ để kết thúc lượt</span>}
        </div>

        <div
          ref={timelineScrollerRef}
          className="timeline-scroll overflow-x-auto px-2 pb-4 pt-7"
          onPointerDown={startTimelinePan}
          onPointerMove={moveTimelinePan}
          onPointerUp={(event) => finishTimelinePan(event)}
          onPointerCancel={(event) => finishTimelinePan(event, true)}
          onClickCapture={(event) => {
            if (!suppressTimelineClickRef.current) return;
            event.preventDefault();
            event.stopPropagation();
            suppressTimelineClickRef.current = false;
          }}
        >
          <div className="flex min-h-72 w-max min-w-full items-center justify-center gap-2 px-2">
          {game.timeline.map((card, index) => {
            const isLast = card.cardId === game.lastPlaced?.cardId;
            return (
              <div key={card.cardId} className="flex shrink-0 items-center gap-2">
                <button type="button" data-timeline-drop-index={index} disabled={!isMyTurn || awaitingVerdict || (selectedCardId === null && draggedCard === null)} onClick={() => setSelectedIndex(index)} aria-label={`Chèn tại vị trí ${index}`} className={`timeline-drop-zone flex h-36 w-8 shrink-0 items-center justify-center rounded-xl border border-dashed text-2xl transition disabled:opacity-20 ${(selectedIndex === index || draggedOverIndex === index) ? "is-active border-gold bg-gold/20 text-gold" : "border-white/15 text-slate-600 hover:border-gold/60 hover:text-gold"}`}>+</button>
                <div className={`relative ${isLast ? "timeline-last-placed" : ""}`}>
                  {card.isRoot && <span className="absolute -top-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-2 py-1 text-[9px] font-black uppercase text-black">Thẻ gốc</span>}
                  {isLast && <span className="timeline-last-placed-label" title={`${lastPlacedPlayerName} vừa đặt thẻ này`} aria-label={`${lastPlacedPlayerName} vừa đặt thẻ này`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v3h14v-3" /></svg><span>{lastPlacedPlayerName}</span></span>}
                  <Card card={card} showBack={card.revealed} year={card.year} month={card.month} selected={selectedChallengeId === card.cardId} highlighted={isLast} clickable={isLast && canChallenge} onClick={isLast && canChallenge ? () => setSelectedChallengeId(card.cardId) : undefined} className="w-44 sm:w-48 lg:w-52" />
                </div>
                {index === game.timeline.length - 1 && <button type="button" data-timeline-drop-index={game.timeline.length} disabled={!isMyTurn || awaitingVerdict || (selectedCardId === null && draggedCard === null)} onClick={() => setSelectedIndex(game.timeline.length)} aria-label={`Chèn tại vị trí ${game.timeline.length}`} className={`timeline-drop-zone flex h-36 w-8 shrink-0 items-center justify-center rounded-xl border border-dashed text-2xl transition disabled:opacity-20 ${(selectedIndex === game.timeline.length || draggedOverIndex === game.timeline.length) ? "is-active border-gold bg-gold/20 text-gold" : "border-white/15 text-slate-600 hover:border-gold/60 hover:text-gold"}`}>+</button>}
              </div>
            );
          })}
          </div>
        </div>
      </section>

      <p className="sr-only" aria-live="polite">{game.lastPlaced ? `${lastPlacedPlayerName} vừa đặt thẻ ${game.lastPlaced.event}.` : ""}</p>

      <Hand
        cards={hand}
        selectedCardId={selectedCardId}
        disabled={!isMyTurn || awaitingVerdict || game.winner !== null}
        onSelect={(cardId) => { setSelectedCardId(cardId); setSelectedIndex(null); }}
        onDragStart={(cardId, x, y) => { setSelectedCardId(cardId); setSelectedIndex(null); setDraggedCard({ cardId, x, y }); }}
        onDragMove={moveDraggedCard}
        onDragEnd={finishCardDrag}
        onDragCancel={() => { setDraggedCard(null); setDraggedOverIndex(null); }}
      />

      {draggedCard && createPortal(
        <div className="card-drag-preview" style={{ left: draggedCard.x, top: draggedCard.y }} aria-hidden="true">
          <span>↥</span>{hand.find((card) => card.cardId === draggedCard.cardId)?.event ?? "Thẻ lịch sử"}
        </div>,
        document.body,
      )}

      <div className="sticky bottom-3 z-20 mx-auto flex max-w-xl gap-2 rounded-2xl border border-white/10 bg-ink/90 p-2 shadow-2xl backdrop-blur">
        {awaitingVerdict ? (
          <>
            <Button onClick={challenge} disabled={!canChallenge || selectedChallengeId === null || challengePending} className="flex-1">Khui thẻ</Button>
            <Button onClick={onSkipChallenge} disabled={!isMyTurn} variant="secondary" className="flex-1">Không khui</Button>
          </>
        ) : (
          <>
            <Button onClick={challenge} disabled={!canChallenge || selectedChallengeId === null || challengePending} variant="secondary" className="flex-1">Khui thẻ</Button>
            <Button onClick={place} disabled={!isMyTurn || selectedCardId === null || selectedIndex === null} className="flex-1">Đặt vào vị trí {selectedIndex ?? "—"}</Button>
          </>
        )}
      </div>
    </main>
  );
}
