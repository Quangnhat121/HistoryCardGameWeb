import { FormEvent, useState, useEffect, useRef } from "react";
import { playClick } from "../sounds";
interface LobbyPageProps {
  onCreate: (name: string) => void;
  onJoin: (code: string, name: string) => void;
  onBrowseCards: () => void;
}

function UsersIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
}

function SwordIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/></svg>;
}

function ShieldIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}

function CrownIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 20h20M4 20l2-14 4 6 2-8 2 8 4-6 2 14"/></svg>;
}

function ScrollIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 21h12a2 2 0 002-2v-2H10v2a2 2 0 01-2 2zm0 0a2 2 0 01-2-2V5a2 2 0 012-2h12v14"/></svg>;
}

// Floating ember particles component
function EmberParticles() {
  return (
    <div className="ember-field" aria-hidden="true">
      {Array.from({ length: 20 }, (_, i) => (
        <span key={i} className={`ember ember-${i + 1}`} />
      ))}
    </div>
  );
}

// Floating rune symbols
function FloatingRunes() {
  const runes = ["✦", "◈", "⬥", "✧", "◆", "⟡", "✦", "◇"];
  return (
    <div className="rune-field" aria-hidden="true">
      {runes.map((rune, i) => (
        <span key={i} className={`floating-rune rune-${i + 1}`}>{rune}</span>
      ))}
    </div>
  );
}

// Animated card fan for the hero section
function HeroCardFan() {
  const cards = [
    { year: "776 TCN", event: "Thế vận hội Olympic", color: "#4a8c5c" },
    { year: "44 TCN", event: "Caesar bị ám sát", color: "#8b3a3a" },
    { year: "1453", event: "Constantinople sụp đổ", color: "#6b4c8c" },
    { year: "1789", event: "Cách mạng Pháp", color: "#8c6b3a" },
    { year: "1969", event: "Đặt chân lên Mặt trăng", color: "#3a6b8c" },
  ];

  return (
    <div className="hero-card-fan select-none" aria-hidden="true">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`fan-card fan-card-${i + 1}`}
          style={{ "--card-accent": card.color } as React.CSSProperties}
        >
          <div className="fan-card-inner">
            <div className="fan-card-glow" />
            <span className="fan-card-year">{card.year}</span>
            <span className="fan-card-event">{card.event}</span>
            <div className="fan-card-ornament">✦</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Mouse-tracking light effect
function useMouseLight(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      el.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };
    el.addEventListener("mousemove", handler);
    return () => el.removeEventListener("mousemove", handler);
  }, [ref]);
}

export function LobbyPage({ onCreate, onJoin, onBrowseCards }: LobbyPageProps) {
  const [name, setName] = useState(localStorage.getItem("history-player-name") ?? "");
  const [code, setCode] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  useMouseLight(panelRef);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const rememberName = (): string => {
    const cleanName = name.trim();
    if (cleanName) localStorage.setItem("history-player-name", cleanName);
    return cleanName;
  };

  const create = (event: FormEvent) => {
    event.preventDefault();
    const cleanName = rememberName();
    if (cleanName) {
      playClick();
      onCreate(cleanName);
    }
  };

  const join = (event: FormEvent) => {
    event.preventDefault();
    const cleanName = rememberName();
    if (cleanName && code.trim()) {
      playClick();
      onJoin(code.trim().toUpperCase(), cleanName);
    }
  };

  return (
    <main className={`lobby-shell min-h-screen overflow-hidden text-white ${isLoaded ? "is-loaded" : ""}`}>
      {/* Background layers */}
      <div className="lobby-bg-vignette" />
      <div className="lobby-aurora lobby-aurora-one" />
      <div className="lobby-aurora lobby-aurora-two" />
      <div className="lobby-aurora lobby-aurora-three" />
      <div className="history-grid" />
      <div className="golden-rays" aria-hidden="true" />
      <EmberParticles />
      <FloatingRunes />

      {/* Navigation */}
      <nav className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a href="#top" className="group flex items-center gap-3 nav-brand" aria-label="Dòng Thời Gian - Trang chủ">
          <span className="brand-mark"><span>DT</span></span>
          <span>
            <strong className="block text-lg font-extrabold leading-none tracking-normal text-[#f3dfb2] brand-text">Dòng Thời Gian</strong>
            <small className="mt-1 block text-[9px] font-bold uppercase tracking-[.28em] text-white/35">History card game</small>
          </span>
        </a>
        <div className="hidden items-center gap-8 text-xs font-bold uppercase tracking-[.16em] text-white/45 md:flex">
          <a className="nav-link transition hover:text-[#e9bd67]" href="#play">Bắt đầu</a>
          <button type="button" className="nav-link transition hover:text-[#e9bd67]" onClick={onBrowseCards}>Bộ thẻ</button>
          <a className="nav-link transition hover:text-[#e9bd67]" href="#guide">Luật chơi</a>
        </div>
        <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-emerald-300/80">
          <i className="online-dot h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" /> Trực tuyến
        </span>
      </nav>

      {/* Hero section */}
      <div id="top" className="relative z-[1] mx-auto grid w-full max-w-[1440px] gap-10 px-5 pb-8 pt-8 sm:px-8 lg:grid-cols-[1.12fr_.88fr] lg:items-center lg:gap-16 lg:px-12 lg:pb-14 lg:pt-12">
        <section className="hero-enter relative max-w-3xl">
          <div className="hero-badge mb-6 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.35em] text-[#e9bd67]">
            <span className="badge-line h-px w-9 bg-[#e9bd67]" />
            <span className="badge-icon"><SwordIcon /></span>
            Kiến thức là quyền năng
          </div>
          <h1 className="game-title select-none text-[clamp(4.25rem,9vw,8.5rem)] font-black uppercase leading-[.82] tracking-[-.04em]">
            <span className="block text-[#f5e8ca] title-line-1">Dòng</span>
            <span className="title-gold block italic title-line-2">Thời Gian</span>
          </h1>
          <p className="hero-desc mt-8 max-w-xl text-base leading-7 text-slate-300/70 sm:text-lg">
            Mỗi lá bài là một khoảnh khắc đã thay đổi thế giới. Hãy sắp xếp chúng đúng dòng lịch sử, thách đấu bạn bè và viết nên chiến thắng của riêng bạn.
          </p>

          <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
            {[["01", "Nhận thẻ", "◈"], ["02", "Xếp mốc", "↔"], ["03", "Thách đấu", "⚔"]].map(([step, label, icon], idx) =>
              <div key={step} className="rule-chip" style={{ animationDelay: `${0.6 + idx * 0.15}s` }}>
                <span className="rule-chip-icon">{icon}</span>
                <span>{step}</span>
                <strong>{label}</strong>
              </div>
            )}
          </div>

          {/* Floating card fan */}
          <HeroCardFan />
        </section>

        {/* Command panel */}
        <section id="play" ref={panelRef} className="command-panel panel-enter relative mx-auto w-full max-w-xl p-5 sm:p-8">
          <div className="panel-mouse-light" />
          <div className="panel-corners" aria-hidden="true" />
          <div className="panel-shimmer" />
          <div className="mb-7 flex items-start justify-between">
            <div>
              <p className="panel-label text-[10px] font-bold uppercase tracking-[.3em] text-[#d9aa54]">Sảnh chính</p>
              <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-normal text-[#f7e7c4]">Chọn hành trình</h2>
            </div>
            <span className="icon-medallion">
              <UsersIcon />
            </span>
          </div>

          <label className="field-label" htmlFor="player-name">Danh xưng của bạn</label>
          <div className="name-field-wrap">
            <input id="player-name" maxLength={30} autoComplete="nickname" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nhập tên người chơi..." className="game-input pr-12" />
            <span className="input-rune">✦</span>
          </div>

          <form onSubmit={create} className="mt-5">
            <button type="submit" disabled={!name.trim()} className="create-game-btn group">
              <span className="text-left"><small>Khởi tạo phòng mới</small><strong>Tạo trận đấu</strong></span>
              <span className="button-arrow"><ArrowIcon /></span>
            </button>
          </form>

          <div className="ornament-divider"><span>hoặc nhập mật mã</span></div>
          <form onSubmit={join} className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input aria-label="Mã phòng" maxLength={5} value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="MÃ PHÒNG" className="game-input room-code-input" />
            <button type="submit" disabled={!name.trim() || code.length !== 5} className="join-btn">Vào phòng <ArrowIcon /></button>
          </form>
          <p className="mt-4 text-center text-[11px] text-white/30">Phòng riêng tư · Từ 2 đến 4 người chơi</p>
          <button type="button" onClick={onBrowseCards} className="browse-cards-btn">
            <span className="browse-cards-icon"><ScrollIcon /></span>
            <span><small>Muốn xem trước?</small><strong>Khám phá bộ thẻ hiện có</strong></span>
            <ArrowIcon />
          </button>
        </section>
      </div>

      {/* Rules section */}
      <section id="guide" className="rules-section relative z-[1] mx-auto w-full max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="rules-heading mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.26em] text-[#d9aa54]">Cẩm nang nhà sử học</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#f5e8ca] sm:text-5xl">Luật chơi</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">Ai loại bỏ hết thẻ trên tay trước sẽ chiến thắng. Muốn làm được điều đó, bạn phải đặt đúng các sự kiện vào dòng thời gian.</p>
        </div>

        <div className="rules-timeline mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["01", "Nhận thẻ bí mật", "Mỗi người nhận các thẻ sự kiện chưa lộ năm. Một thẻ gốc được đặt sẵn để bắt đầu dòng thời gian.", ScrollIcon],
            ["02", "Chọn đúng vị trí", "Đến lượt, chọn một thẻ trên tay rồi đặt nó vào khe trước, sau hoặc giữa các mốc đã có.", ShieldIcon],
            ["03", "Thách đấu đối thủ", "Bạn có thể khui thẻ vừa được đặt. Nếu vị trí sai, người đặt phải bốc thêm một thẻ phạt.", SwordIcon],
            ["04", "Viết nên chiến thắng", "Đặt đúng thẻ và trở thành người đầu tiên không còn lá bài nào trên tay để giành chiến thắng.", CrownIcon],
          ].map(([number, title, description, Icon], index) => (
            <article key={number as string} className="rule-card" style={{ animationDelay: `${index * 110}ms` }}>
              <div className="rule-card-glow" />
              <div className="rule-card-top">
                <span className="rule-icon">{(Icon as React.FC)({})}</span>
                <span className="rule-number">{number as string}</span>
              </div>
              <h3>{title as string}</h3>
              <p>{description as string}</p>
              <div className="rule-card-border-glow" />
            </article>
          ))}
        </div>

        <div className="rules-note mt-6 flex flex-col items-center justify-between gap-4 px-5 py-4 text-center sm:flex-row sm:text-left">
          <div><strong>Đồng hồ mỗi lượt</strong><span className="mt-1 block text-sm text-slate-400">Tối đa 7 thẻ: 15 giây · 8–16 thẻ: 25 giây · Từ 17 thẻ: 35 giây. Khui thẻ được cộng thêm 3 giây; hết giờ chỉ mất lượt.</span></div>
          <a href="#play" className="rules-cta">Bắt đầu chơi <ArrowIcon /></a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-[1] border-t border-white/[.06] px-5 py-5 text-center text-[10px] uppercase tracking-[.18em] text-white/25">
        Kiến thức lịch sử chỉ mang tính tham khảo · Dòng Thời Gian © 2026
      </footer>
    </main>
  );
}
