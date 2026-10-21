import type { CardFront } from "../types";
import { Card } from "./Card";

interface HandProps {
  cards: CardFront[];
  selectedCardId: number | null;
  disabled: boolean;
  onSelect: (cardId: number) => void;
}

export function Hand({ cards, selectedCardId, disabled, onSelect }: HandProps) {
  return (
    <section aria-label="Bài trên tay" className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-normal text-parchment">Bài trên tay</h2>
        <span className="text-xs text-slate-400">{cards.length} thẻ</span>
      </div>
      <div className="scrollbar-thin flex min-h-48 gap-3 overflow-x-auto px-2 pb-5 pt-4 sm:justify-center">
        {cards.map((card) => (
          <Card
            key={card.cardId}
            card={card}
            selected={selectedCardId === card.cardId}
            clickable={!disabled}
            onClick={() => onSelect(card.cardId)}
          />
        ))}
      </div>
    </section>
  );
}
