import { useState } from "react";

interface Props { onStart: (names: string[]) => void; onBack: () => void }

export function CatanLocalSetupPage({ onStart, onBack }: Props) {
  const [count, setCount] = useState<3 | 4>(3);
  const [names, setNames] = useState(["Người chơi 1", "Người chơi 2", "Người chơi 3", "Người chơi 4"]);
  const selected = names.slice(0, count).map((name) => name.trim());
  const valid = selected.every(Boolean) && new Set(selected.map((name) => name.toLocaleLowerCase("vi-VN"))).size === count;

  return <main className="catan-local-setup catan-menu min-h-screen">
    <div className="catan-sun" /><div className="catan-sea" />
    <nav className="catan-nav"><button type="button" onClick={onBack}>← Menu CATAN</button><strong><i /> CATAN</strong><span>Chơi trên một thiết bị</span></nav>
    <section className="catan-setup-card">
      <p className="catan-kicker">Một hòn đảo · Nhiều chiến lược</p>
      <h1>Chuẩn bị cuộc chơi</h1>
      <p>Chuyền thiết bị cho người đến lượt. Thông tin tài nguyên và thẻ phát triển chỉ mở sau màn hình chuyển lượt.</p>
      <fieldset><legend>Số người chơi</legend><div className="catan-count-row">{([3, 4] as const).map((value) => <button key={value} type="button" aria-pressed={count === value} className={count === value ? "is-active" : ""} onClick={() => setCount(value)}>{value} người</button>)}</div></fieldset>
      <div className="catan-name-grid">{names.slice(0, count).map((name, index) => <label key={index}>Người chơi {index + 1}<input maxLength={30} value={name} onChange={(event) => setNames((previous) => previous.map((value, position) => position === index ? event.target.value : value))} /></label>)}</div>
      {!valid && <p className="catan-form-error">Mỗi người cần một tên riêng.</p>}
      <button type="button" className="catan-primary-action" disabled={!valid} onClick={() => onStart(selected)}>Dựng bàn chơi →</button>
    </section>
  </main>;
}
