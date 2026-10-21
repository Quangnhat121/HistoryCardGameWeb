import { FormEvent, useState } from "react";
interface LobbyPageProps {
  onCreate: (name: string) => void;
  onJoin: (code: string, name: string) => void;
}

function UsersIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
}

export function LobbyPage({ onCreate, onJoin }: LobbyPageProps) {
  const [name, setName] = useState(localStorage.getItem("history-player-name") ?? "");
  const [code, setCode] = useState("");

  const rememberName = (): string => {
    const cleanName = name.trim();
    if (cleanName) localStorage.setItem("history-player-name", cleanName);
    return cleanName;
  };

  const create = (event: FormEvent) => {
    event.preventDefault();
    const cleanName = rememberName();
    if (cleanName) onCreate(cleanName);
  };

  const join = (event: FormEvent) => {
    event.preventDefault();
    const cleanName = rememberName();
    if (cleanName && code.trim()) onJoin(code.trim().toUpperCase(), cleanName);
  };

  return (
    <main className="lobby-shell min-h-screen overflow-hidden text-white">
      <div className="lobby-aurora lobby-aurora-one" />
      <div className="lobby-aurora lobby-aurora-two" />
      <div className="history-grid" />
      <div className="history-particles" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>

      <nav className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a href="#top" className="group flex items-center gap-3" aria-label="Dòng Thời Gian - Trang chủ">
          <span className="brand-mark"><span>DT</span></span>
          <span>
            <strong className="block text-lg font-extrabold leading-none tracking-normal text-[#f3dfb2]">Dòng Thời Gian</strong>
            <small className="mt-1 block text-[9px] font-bold uppercase tracking-[.28em] text-white/35">History card game</small>
          </span>
        </a>
        <div className="hidden items-center gap-8 text-xs font-bold uppercase tracking-[.16em] text-white/45 md:flex">
          <a className="transition hover:text-[#e9bd67]" href="#play">Bắt đầu</a>
          <a className="transition hover:text-[#e9bd67]" href="#guide">Luật chơi</a>
        </div>
        <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-emerald-300/80">
          <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" /> Trực tuyến
        </span>
      </nav>

      <div id="top" className="relative z-[1] mx-auto grid w-full max-w-[1440px] gap-10 px-5 pb-8 pt-8 sm:px-8 lg:grid-cols-[1.12fr_.88fr] lg:items-center lg:gap-16 lg:px-12 lg:pb-14 lg:pt-12">
        <section className="hero-enter relative max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.35em] text-[#e9bd67]"><span className="h-px w-9 bg-[#e9bd67]" /> Kiến thức là quyền năng</div>
          <h1 className="game-title text-[clamp(4.25rem,9vw,8.5rem)] font-black uppercase leading-[.82] tracking-[-.04em]">
            <span className="block text-[#f5e8ca]">Dòng</span><span className="title-gold block italic">Thời Gian</span>
          </h1>
          <p className="mt-8 max-w-xl text-base leading-7 text-slate-300/70 sm:text-lg">Mỗi lá bài là một khoảnh khắc đã thay đổi thế giới. Hãy sắp xếp chúng đúng dòng lịch sử, thách đấu bạn bè và viết nên chiến thắng của riêng bạn.</p>

          <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
            {[["01", "Nhận thẻ"], ["02", "Xếp mốc"], ["03", "Thách đấu"]].map(([step, label]) => <div key={step} className="rule-chip"><span>{step}</span><strong>{label}</strong></div>)}
          </div>
          <div className="floating-card card-a" aria-hidden="true"><span>1789</span></div>
          <div className="floating-card card-b" aria-hidden="true"><span>1969</span></div>
        </section>

        <section id="play" className="command-panel panel-enter relative mx-auto w-full max-w-xl p-5 sm:p-8">
          <div className="panel-corners" aria-hidden="true" />
          <div className="mb-7 flex items-start justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#d9aa54]">Sảnh chính</p><h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-normal text-[#f7e7c4]">Chọn hành trình</h2></div>
            <span className="icon-medallion"><UsersIcon /></span>
          </div>

          <label className="field-label" htmlFor="player-name">Danh xưng của bạn</label>
          <div className="name-field-wrap">
            <input id="player-name" maxLength={30} autoComplete="nickname" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nhập tên người chơi..." className="game-input pr-12" />
            <span className="input-rune">✦</span>
          </div>

          <form onSubmit={create} className="mt-5">
            <button type="submit" disabled={!name.trim()} className="create-game-btn group">
              <span className="text-left"><small>Khởi tạo phòng mới</small><strong>Tạo trận đấu</strong></span><span className="button-arrow"><ArrowIcon /></span>
            </button>
          </form>

          <div className="ornament-divider"><span>hoặc nhập mật mã</span></div>
          <form onSubmit={join} className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input aria-label="Mã phòng" maxLength={5} value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="MÃ PHÒNG" className="game-input room-code-input" />
            <button type="submit" disabled={!name.trim() || code.length !== 5} className="join-btn">Vào phòng <ArrowIcon /></button>
          </form>
          <p className="mt-4 text-center text-[11px] text-white/30">Phòng riêng tư · Từ 2 đến 4 người chơi</p>
        </section>
      </div>

      <section id="guide" className="rules-section relative z-[1] mx-auto w-full max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="rules-heading mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.26em] text-[#d9aa54]">Cẩm nang nhà sử học</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#f5e8ca] sm:text-5xl">Luật chơi</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">Ai loại bỏ hết thẻ trên tay trước sẽ chiến thắng. Muốn làm được điều đó, bạn phải đặt đúng các sự kiện vào dòng thời gian.</p>
        </div>

        <div className="rules-timeline mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["01", "Nhận thẻ bí mật", "Mỗi người nhận các thẻ sự kiện chưa lộ năm. Một thẻ gốc được đặt sẵn để bắt đầu dòng thời gian.", "◈"],
            ["02", "Chọn đúng vị trí", "Đến lượt, chọn một thẻ trên tay rồi đặt nó vào khe trước, sau hoặc giữa các mốc đã có.", "↔"],
            ["03", "Thách đấu đối thủ", "Bạn có thể khui thẻ vừa được đặt. Nếu vị trí sai, người đặt phải bốc thêm một thẻ phạt.", "⚔"],
            ["04", "Viết nên chiến thắng", "Đặt đúng thẻ và trở thành người đầu tiên không còn lá bài nào trên tay để giành chiến thắng.", "♛"],
          ].map(([number, title, description, icon], index) => (
            <article key={number} className="rule-card" style={{ animationDelay: `${index * 110}ms` }}>
              <div className="rule-card-top"><span className="rule-icon">{icon}</span><span className="rule-number">{number}</span></div>
              <h3>{title}</h3><p>{description}</p>
            </article>
          ))}
        </div>

        <div className="rules-note mt-6 flex flex-col items-center justify-between gap-4 px-5 py-4 text-center sm:flex-row sm:text-left">
          <div><strong>Đồng hồ mỗi lượt</strong><span className="mt-1 block text-sm text-slate-400">Tối đa 7 thẻ: 15 giây · 8–16 thẻ: 25 giây · Từ 17 thẻ: 35 giây. Khui thẻ được cộng thêm 3 giây; hết giờ chỉ mất lượt.</span></div>
          <a href="#play" className="rules-cta">Bắt đầu chơi <ArrowIcon /></a>
        </div>
      </section>

      <footer className="relative z-[1] border-t border-white/[.06] px-5 py-5 text-center text-[10px] uppercase tracking-[.18em] text-white/25">Kiến thức lịch sử chỉ mang tính tham khảo · Dòng Thời Gian © 2026</footer>
    </main>
  );
}
