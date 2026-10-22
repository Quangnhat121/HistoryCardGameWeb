import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { assetUrl, SERVER_URL } from "../socket";
import type { CardFront } from "../types";

interface CardsPageProps {
  onBack: () => void;
}

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h10" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function CardsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="6" y="3" width="13" height="17" rx="2" />
      <path d="m6 7-2 .5A2 2 0 0 0 2.5 10l2.4 9a2 2 0 0 0 2.4 1.4l7.2-2" />
      <path d="M10 8h5M10 12h5" />
    </svg>
  );
}

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

export function CardsPage({ onBack }: CardsPageProps) {
  const [cards, setCards] = useState<CardFront[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<CardFront | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`${SERVER_URL}/api/cards`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Không thể tải danh sách thẻ.");
        return response.json() as Promise<CardFront[]>;
      })
      .then((data) => setCards(data))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        setError(
          "Kho thẻ đang tạm thời không truy cập được. Vui lòng thử lại sau.",
        );
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filteredCards = useMemo(() => {
    const cleanQuery = normalizeText(query.trim());
    if (!cleanQuery) return cards;
    return cards.filter((card) =>
      normalizeText(card.event).includes(cleanQuery),
    );
  }, [cards, query]);

  useEffect(() => {
    if (!selectedCard) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedCard(null);
      const currentIndex = filteredCards.findIndex(
        (card) => card.cardId === selectedCard.cardId,
      );
      if (event.key === "ArrowRight" && currentIndex < filteredCards.length - 1)
        setSelectedCard(filteredCards[currentIndex + 1]);
      if (event.key === "ArrowLeft" && currentIndex > 0)
        setSelectedCard(filteredCards[currentIndex - 1]);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [filteredCards, selectedCard]);

  const selectedIndex = selectedCard
    ? filteredCards.findIndex((card) => card.cardId === selectedCard.cardId)
    : -1;

  return (
    <main className="cards-library min-h-screen text-white">
      <div className="library-aurora library-aurora-left" />
      <div className="library-aurora library-aurora-right" />
      <div className="history-grid" />

      <nav className="library-nav">
        <button type="button" onClick={onBack} className="library-back-btn">
          <ArrowLeftIcon />
          <span>Về sảnh chính</span>
        </button>
        <div className="library-brand" aria-label="Dòng Thời Gian">
          <span className="brand-mark">
            <span>DT</span>
          </span>
          <strong>Dòng Thời Gian</strong>
        </div>
        <span className="library-count">
          {loading ? "Đang mở kho..." : `${cards.length} thẻ`}
        </span>
      </nav>

      <header className="library-hero">
        <div className="library-kicker">
          <span />
          <CardsIcon /> Kho lưu trữ
        </div>
        <h1>
          Những mảnh ghép
          <br />
          <em>của lịch sử</em>
        </h1>
        <p>
          Khám phá toàn bộ thẻ sự kiện đang có trong trò chơi. Mốc năm vẫn được
          giữ kín — hãy quan sát, ghi nhớ và tự mình chinh phục dòng thời gian.
        </p>
      </header>

      <section className="library-content" aria-labelledby="cards-heading">
        <aside className="library-disclaimer" aria-label="Lưu ý về nội dung">
          <span className="library-disclaimer-mark" aria-hidden="true">
            i
          </span>
          <div>
            <strong>Lưu ý về nội dung</strong>
            <p>
              Thông tin lịch sử trên các thẻ được tổng hợp từ Wikipedia, có thể
              chưa hoàn toàn chính xác và không dùng làm tài liệu tham khảo. Nội
              dung chỉ phục vụ mục đích giải trí. Hình ảnh được tạo bằng AI, chỉ
              mang tính minh họa và có thể không phản ánh chính xác nhân vật,
              địa điểm hoặc bối cảnh lịch sử.
            </p>
          </div>
        </aside>

        <div className="library-toolbar">
          <div>
            <p className="library-overline">Bộ thẻ hiện có</p>
            <h2 id="cards-heading">Thư viện sự kiện</h2>
          </div>
          <label className="library-search">
            <SearchIcon />
            <span className="sr-only">Tìm kiếm sự kiện</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm một sự kiện..."
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Xóa tìm kiếm"
              >
                ×
              </button>
            )}
          </label>
        </div>

        {!loading && !error && (
          <p className="library-result-count">
            Hiển thị {filteredCards.length} / {cards.length} lá bài
          </p>
        )}

        {loading && (
          <div className="library-grid" aria-label="Đang tải thẻ">
            {Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="library-card-skeleton" />
            ))}
          </div>
        )}

        {error && (
          <div className="library-empty">
            <span>!</span>
            <h3>Chưa thể mở kho thẻ</h3>
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && filteredCards.length === 0 && (
          <div className="library-empty">
            <span>⌕</span>
            <h3>Không tìm thấy sự kiện</h3>
            <p>Thử một từ khóa khác nhé.</p>
          </div>
        )}

        {!loading && !error && filteredCards.length > 0 && (
          <div className="library-grid">
            {filteredCards.map((card, index) => (
              <article
                key={card.cardId}
                className="library-card"
                style={
                  {
                    "--delay": `${Math.min(index, 15) * 35}ms`,
                  } as React.CSSProperties
                }
              >
                <button
                  type="button"
                  onClick={() => setSelectedCard(card)}
                  aria-label={`Xem lớn thẻ ${card.event}`}
                >
                  <span className="library-card-number">
                    #{String(card.cardId).padStart(2, "0")}
                  </span>
                  <span className="library-card-image">
                    <img src={assetUrl(card.image)} alt="" loading="lazy" />
                  </span>
                  <span className="library-card-copy">
                    <small>Sự kiện lịch sử</small>
                    <strong>{card.event}</strong>
                    <i>Xem chi tiết →</i>
                  </span>
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="library-footer">
        {cards.length || 51} khoảnh khắc · Một dòng thời gian · Vô vàn thử thách
      </footer>

      {selectedCard &&
        createPortal(
          <div
            className="library-preview"
            role="dialog"
            aria-modal="true"
            aria-label={`Xem thẻ ${selectedCard.event}`}
            onClick={() => setSelectedCard(null)}
          >
            <button
              type="button"
              className="library-preview-close"
              onClick={() => setSelectedCard(null)}
              aria-label="Đóng"
            >
              ×
            </button>
            <button
              type="button"
              className="library-preview-arrow prev"
              disabled={selectedIndex <= 0}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedCard(filteredCards[selectedIndex - 1]);
              }}
              aria-label="Thẻ trước"
            >
              <ArrowLeftIcon />
            </button>
            <div
              className="library-preview-card"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={assetUrl(selectedCard.image)}
                alt={selectedCard.event}
              />
              <div>
                <span>Thẻ #{String(selectedCard.cardId).padStart(2, "0")}</span>
                <h2>{selectedCard.event}</h2>
                <p>Mốc năm được giữ kín trong mỗi ván chơi.</p>
              </div>
            </div>
            <button
              type="button"
              className="library-preview-arrow next"
              disabled={selectedIndex >= filteredCards.length - 1}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedCard(filteredCards[selectedIndex + 1]);
              }}
              aria-label="Thẻ sau"
            >
              <ArrowLeftIcon />
            </button>
          </div>,
          document.body,
        )}
    </main>
  );
}
