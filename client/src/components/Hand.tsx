import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { CardFront } from "../types";
import { Card } from "./Card";

interface HandProps {
  cards: CardFront[];
  selectedCardId: number | null;
  disabled: boolean;
  onSelect: (cardId: number) => void;
  onDragStart: (cardId: number, clientX: number, clientY: number) => void;
  onDragMove: (clientX: number, clientY: number) => void;
  onDragEnd: (clientX: number, clientY: number) => void;
  onDragCancel: () => void;
}

interface PointerGesture {
  pointerId: number;
  startX: number;
  startY: number;
  startScrollLeft: number;
  cardId: number | null;
  mode: "pending" | "scroll" | "card";
  lastX: number;
  lastTime: number;
  velocity: number;
}

export function Hand({
  cards, selectedCardId, disabled, onSelect, onDragStart, onDragMove, onDragEnd, onDragCancel,
}: HandProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const gestureRef = useRef<PointerGesture | null>(null);
  const suppressClickRef = useRef(false);
  const momentumFrameRef = useRef<number | null>(null);

  const stopMomentum = () => {
    if (momentumFrameRef.current !== null) window.cancelAnimationFrame(momentumFrameRef.current);
    momentumFrameRef.current = null;
  };

  const startMomentum = (initialVelocity: number) => {
    const scroller = scrollerRef.current;
    if (!scroller || Math.abs(initialVelocity) < 0.02) return;
    let velocity = initialVelocity;
    let previousTime = performance.now();
    const glide = (time: number) => {
      const elapsed = Math.min(32, time - previousTime);
      previousTime = time;
      const previousScrollLeft = scroller.scrollLeft;
      scroller.scrollLeft += velocity * elapsed;
      velocity *= Math.pow(0.94, elapsed / 16);
      const reachedEdge = scroller.scrollLeft === previousScrollLeft;
      if (Math.abs(velocity) < 0.02 || reachedEdge) {
        momentumFrameRef.current = null;
        return;
      }
      momentumFrameRef.current = window.requestAnimationFrame(glide);
    };
    momentumFrameRef.current = window.requestAnimationFrame(glide);
  };

  useEffect(() => () => stopMomentum(), []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !scrollerRef.current) return;
    stopMomentum();
    const previousGesture = gestureRef.current;
    if (previousGesture?.mode === "card") onDragCancel();
    if (previousGesture && scrollerRef.current.hasPointerCapture(previousGesture.pointerId)) {
      scrollerRef.current.releasePointerCapture(previousGesture.pointerId);
    }
    gestureRef.current = null;
    suppressClickRef.current = false;
    const cardElement = (event.target as HTMLElement).closest<HTMLElement>("[data-hand-card-id]");
    const parsedCardId = cardElement ? Number(cardElement.dataset.handCardId) : null;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: scrollerRef.current.scrollLeft,
      cardId: Number.isFinite(parsedCardId) ? parsedCardId : null,
      mode: "pending",
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    const scroller = scrollerRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId || !scroller) return;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;

    if (gesture.mode === "pending" && Math.hypot(deltaX, deltaY) > 8) {
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      gesture.mode = isHorizontal || gesture.cardId === null || disabled ? "scroll" : "card";
      suppressClickRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      if (gesture.mode === "card" && gesture.cardId !== null) {
        onDragStart(gesture.cardId, event.clientX, event.clientY);
      }
    }

    if (gesture.mode === "scroll") {
      scroller.scrollLeft = gesture.startScrollLeft - deltaX;
      const elapsed = Math.max(1, event.timeStamp - gesture.lastTime);
      gesture.velocity = -(event.clientX - gesture.lastX) / elapsed;
      gesture.lastX = event.clientX;
      gesture.lastTime = event.timeStamp;
    } else if (gesture.mode === "card") {
      onDragMove(event.clientX, event.clientY);
    }
  };

  const finishGesture = (event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (gesture.mode === "card") {
      if (cancelled) onDragCancel();
      else onDragEnd(event.clientX, event.clientY);
    } else if (gesture.mode === "scroll" && !cancelled) {
      startMomentum(event.timeStamp - gesture.lastTime > 80 ? 0 : gesture.velocity);
    }
    gestureRef.current = null;
    if (cancelled) suppressClickRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <section aria-label="Bài trên tay" className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-normal text-parchment">Bài trên tay</h2>
        <span className="text-right text-xs text-slate-400">{cards.length} thẻ · Kéo ngang để xem</span>
      </div>
      <div
        ref={scrollerRef}
        className="hand-scroll scrollbar-thin flex min-h-48 cursor-grab gap-3 overflow-x-auto px-2 pb-5 pt-4 active:cursor-grabbing sm:justify-center"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishGesture(event)}
        onPointerCancel={(event) => finishGesture(event, true)}
        onLostPointerCapture={(event) => {
          const gesture = gestureRef.current;
          if (!gesture || gesture.pointerId !== event.pointerId) return;
          if (gesture.mode === "card") onDragCancel();
          gestureRef.current = null;
          suppressClickRef.current = false;
        }}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClickRef.current = false;
        }}
      >
        {cards.map((card) => (
          <div key={card.cardId} data-hand-card-id={card.cardId} className="shrink-0">
            <Card
              card={card}
              selected={selectedCardId === card.cardId}
              clickable={!disabled}
              onClick={() => onSelect(card.cardId)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
