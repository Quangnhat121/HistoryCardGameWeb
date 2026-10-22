import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { assetUrl } from "../socket";
import type { CardFront } from "../types";

interface CardProps {
  card: CardFront;
  showBack?: boolean;
  year?: number;
  month?: number;
  selected?: boolean;
  highlighted?: boolean;
  clickable?: boolean;
  className?: string;
  onClick?: () => void;
}

const formatYear = (year: number): string => year < 0 ? `${Math.abs(year)} TCN` : `${year}`;

export function Card({
  card, showBack = false, year, month, selected = false, highlighted = false,
  clickable = false, className = "", onClick,
}: CardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const suppressNextClick = useRef(false);

  useEffect(() => {
    if (!previewOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [previewOpen]);

  const cancelLongPress = () => {
    if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const startLongPress = (pointerType: string) => {
    if (pointerType === "mouse") return;
    cancelLongPress();
    longPressTimer.current = window.setTimeout(() => {
      suppressNextClick.current = true;
      setPreviewOpen(true);
      longPressTimer.current = null;
    }, 450);
  };

  const handleCardClick = () => {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    if (clickable) onClick?.();
  };

  return (
    <>
      <div
        className={`group/card relative w-40 shrink-0 sm:w-44 lg:w-48 ${className}`}
        onPointerDown={(event) => startLongPress(event.pointerType)}
        onPointerUp={cancelLongPress}
        onPointerCancel={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onContextMenu={(event) => event.preventDefault()}
      >
        <button
          type="button"
          onClick={handleCardClick}
          disabled={!clickable}
          aria-label={`${clickable ? "Chọn" : "Thẻ"} ${card.event}${showBack && year !== undefined ? `, ${month ? `tháng ${month}, ` : ""}năm ${formatYear(year)}` : ""}`}
          className={`card-scene relative aspect-[2/3] w-full rounded-xl text-left transition duration-200 group-hover/card:-translate-y-2 group-hover/card:scale-[1.06] ${
            clickable ? "cursor-pointer" : "cursor-default"
          } ${selected ? "-translate-y-3 ring-2 ring-gold" : ""} ${highlighted ? "shadow-glow animate-pulse-soft" : ""}`}
        >
          <span className={`card-inner block h-full w-full ${showBack ? "is-flipped" : ""}`}>
            <span className="card-face overflow-hidden rounded-xl border border-white/15 bg-panel shadow-xl">
              <img src={assetUrl(card.image)} alt={card.event} draggable={false} className="h-full w-full bg-black/30 object-contain" />
            </span>
            <span className="card-face card-back history-card-back overflow-hidden rounded-xl text-center shadow-xl">
              <span className="card-back-frame" />
              <span className="card-back-corner corner-top-left" /><span className="card-back-corner corner-top-right" />
              <span className="card-back-corner corner-bottom-left" /><span className="card-back-corner corner-bottom-right" />
              <span className="card-back-label">Năm lịch sử</span>
              {month && <span className="card-back-month">Tháng {month}</span>}
              <strong className="card-back-year">{year === undefined ? "?" : formatYear(year)}</strong>
              <span className="card-back-event line-clamp-3">{card.event}</span>
            </span>
          </span>
        </button>
        <button type="button" onClick={(event) => { event.stopPropagation(); setPreviewOpen(true); }} aria-label={`Phóng to ${card.event}`} className="absolute right-2 top-2 z-30 grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-black/75 text-base text-white shadow-lg backdrop-blur transition hover:scale-110 hover:bg-gold hover:text-black sm:opacity-0 sm:group-hover/card:opacity-100">⌕</button>
        <p className="mt-3 min-h-10 line-clamp-2 px-1 text-center text-sm font-semibold leading-5 text-slate-200" title={card.event}>{card.event}</p>
        <p className="mt-1 text-center text-[10px] text-slate-500 sm:hidden">Nhấn giữ để xem lớn</p>
      </div>

      {previewOpen && createPortal(
        <div role="dialog" aria-modal="true" aria-label={`Xem lớn ${card.event}`} onClick={() => setPreviewOpen(false)} className="card-preview fixed inset-0 z-[120] flex cursor-zoom-out items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div onClick={(event) => event.stopPropagation()} className="relative animate-card-zoom">
            <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Đóng" className="absolute -right-3 -top-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-slate-900 text-xl text-white shadow-xl hover:bg-slate-800">×</button>
            <div className="relative aspect-[2/3] h-[78vh] max-h-[720px] max-w-[86vw] overflow-hidden rounded-2xl border-2 border-gold/50 bg-panel shadow-[0_24px_90px_rgba(0,0,0,.8)]">
              {showBack ? (
                <div className="history-card-back history-card-back-preview relative h-full w-full overflow-hidden text-center">
                  <span className="card-back-frame" />
                  <span className="card-back-corner corner-top-left" /><span className="card-back-corner corner-top-right" />
                  <span className="card-back-corner corner-bottom-left" /><span className="card-back-corner corner-bottom-right" />
                  <span className="card-back-label">Năm lịch sử</span>
                  {month && <span className="card-back-month">Tháng {month}</span>}
                  <strong className="card-back-year">{year === undefined ? "?" : formatYear(year)}</strong>
                  <span className="card-back-event">{card.event}</span>
                </div>
              ) : (
                <img src={assetUrl(card.image)} alt={card.event} className="h-full w-full object-contain" />
              )}
            </div>
            <p className="mt-3 text-center text-sm text-slate-300">Chạm bên ngoài hoặc nhấn ESC để đóng</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
