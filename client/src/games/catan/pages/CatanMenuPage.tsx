import { FormEvent, useState } from "react";

interface CatanMenuPageProps {
  connected: boolean;
  onCreate: (name: string) => void;
  onJoin: (code: string, name: string) => void;
  onBack: () => void;
  onPlayLocal: () => void;
}

export function CatanMenuPage({ connected, onCreate, onJoin, onBack, onPlayLocal }: CatanMenuPageProps) {
  const [name, setName] = useState(localStorage.getItem("history-player-name") ?? "");
  const [code, setCode] = useState("");

  const cleanName = () => {
    const value = name.trim();
    if (value) localStorage.setItem("history-player-name", value);
    return value;
  };
  const create = (event: FormEvent) => {
    event.preventDefault();
    const value = cleanName();
    if (value) onCreate(value);
  };
  const join = (event: FormEvent) => {
    event.preventDefault();
    const value = cleanName();
    if (value && code.length === 5) onJoin(code, value);
  };

  return (
    <main className="catan-menu min-h-screen">
      <div className="catan-sun" />
      <div className="catan-sea" />
      <nav className="catan-nav">
        <button type="button" onClick={onBack}>← <span>Game Hub</span></button>
        <strong><i /> CATAN</strong>
        <span className={connected ? "is-online" : ""}><i /> {connected ? "Trực tuyến" : "Đang kết nối"}</span>
      </nav>

      <section className="catan-menu-layout">
        <div className="catan-hero-copy">
          <p className="catan-kicker">Biển gọi · Đảo chờ</p>
          <h1>Xây đảo.<br /><em>Dựng nghiệp.</em></h1>
          <p>Thu thập tài nguyên, mở đường giao thương và đưa khu định cư của bạn trở thành thế lực hùng mạnh nhất hòn đảo.</p>
          <div className="catan-feature-row">
            <span><b>3–4</b>Người chơi</span>
            <span><b>∞</b>Chiến lược</span>
            <span><b>01</b>Hòn đảo</span>
          </div>
          <div className="catan-foundation-note">
            <span>◈</span><p><strong>Chơi thử bản đầy đủ</strong> Chế độ chuyền máy hỗ trợ 3–4 người với luật CATAN cơ bản. Phòng trực tuyến hiện chỉ xem bàn đảo và sẽ có thao tác multiplayer sau.</p>
          </div>
        </div>

        <section className="catan-command-card">
          <p>Khởi hành</p>
          <h2>Chọn chuyến tàu</h2>
          <button className="catan-local-entry" type="button" onClick={onPlayLocal}><span><small>3–4 người · cùng thiết bị</small><strong>Chơi CATAN ngay</strong></span><i>→</i></button>
          <div className="catan-or"><span />phòng trực tuyến thử nghiệm<span /></div>
          <label htmlFor="catan-name">Tên nhà khai phá</label>
          <input id="catan-name" maxLength={30} value={name} onChange={(event) => setName(event.target.value)} placeholder="Nhập tên người chơi..." />
          <form onSubmit={create}>
            <button className="catan-create" type="submit" disabled={!connected || !name.trim()}><span><small>Mở hòn đảo mới</small><strong>Tạo phòng CATAN</strong></span><i>→</i></button>
          </form>
          <div className="catan-or"><span />hoặc nhập mã đảo<span /></div>
          <form className="catan-join" onSubmit={join}>
            <input aria-label="Mã phòng CATAN" maxLength={5} value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="MÃ PHÒNG" />
            <button type="submit" disabled={!connected || !name.trim() || code.length !== 5}>Tham gia</button>
          </form>
        </section>
      </section>
    </main>
  );
}
