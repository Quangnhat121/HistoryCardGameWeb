import { useEffect, useState } from "react";
import { GAME_CATALOG, type GameCatalogEntry, type GameCover } from "../games/catalog";

interface GameHubPageProps {
  onOpenGame: (game: GameCatalogEntry) => void;
}

function TimelineArt() {
  return (
    <div className="hub-timeline-art" aria-hidden="true">
      <span className="hub-year year-a">1789</span>
      <span className="hub-year year-b">1969</span>
      <span className="hub-year year-c">44 TCN</span>
      <i className="hub-time-line" />
      <i className="hub-time-dot dot-a" />
      <i className="hub-time-dot dot-b" />
      <i className="hub-time-dot dot-c" />
    </div>
  );
}

function CatanArt() {
  const tiles = ["forest", "pasture", "mountain", "field", "hill", "desert", "forest"];
  return (
    <div className="hub-catan-art" aria-hidden="true">
      {tiles.map((tile, index) => <i key={`${tile}-${index}`} className={`hub-hex hub-hex-${index + 1} ${tile}`} />)}
      <span className="hub-catan-piece piece-a" />
      <span className="hub-catan-piece piece-b" />
    </div>
  );
}

const coverArt: Record<GameCover, () => JSX.Element> = {
  timeline: TimelineArt,
  island: CatanArt,
};

export function GameHubPage({ onOpenGame }: GameHubPageProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <main className={`game-hub min-h-screen ${ready ? "is-ready" : ""}`}>
      <div className="hub-glow hub-glow-left" />
      <div className="hub-glow hub-glow-right" />
      <div className="hub-grid" />
      <header className="hub-header">
        <div className="hub-brand"><span>HG</span><div><strong>History Games</strong><small>Phòng game chiến thuật</small></div></div>
        <div className="hub-status"><i /> Máy chủ trực tuyến</div>
      </header>

      <section className="hub-intro">
        <p><span /> Chọn bàn chơi của bạn</p>
        <h1>Một nơi.<br /><em>Nhiều cuộc đấu.</em></h1>
        <div className="hub-intro-row">
          <p>Khám phá lịch sử, xây dựng đế chế và tranh tài cùng bạn bè trong những trải nghiệm bàn cờ trực tuyến.</p>
          <span>{String(GAME_CATALOG.length).padStart(2, "0")}<br /><small>trò chơi</small></span>
        </div>
      </section>

      <section className="hub-games" aria-label="Danh sách trò chơi">
        {GAME_CATALOG.map((game, index) => {
          const CoverArt = coverArt[game.cover];
          return (
            <button
              key={game.id}
              type="button"
              className={`hub-game-card ${game.id === "timeline" ? "timeline-card" : "catan-card"}`}
              onClick={() => onOpenGame(game)}
              disabled={!game.enabled}
              aria-label={`${game.actionLabel}: ${game.name}. Trạng thái ${game.statusLabel}`}
            >
              <CoverArt />
              <span className="hub-game-number">{String(index + 1).padStart(2, "0")}</span>
              <span className={`hub-game-state status-${game.status}`}><i /> {game.statusLabel}</span>
              <span className="hub-game-copy">
                <small>{game.genre} · {game.playerCount}</small>
                <strong>{game.nameLines.map((line, lineIndex) => <span key={line}>{lineIndex > 0 ? <em>{line}</em> : line}</span>)}</strong>
                <span>{game.description}</span>
                <b>{game.actionLabel} <i>→</i></b>
              </span>
            </button>
          );
        })}
      </section>

      <footer className="hub-footer"><span>History Games Hub</span><span>Chơi có trách nhiệm · Kết nối cùng bạn bè</span></footer>
    </main>
  );
}
