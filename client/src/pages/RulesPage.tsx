interface RulesPageProps {
  onBack: () => void;
  onBrowseCards: () => void;
}

function ArrowLeftIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /><path d="M9 12h10" /></svg>;
}

const steps = [
  ["01", "Nhận thẻ bí mật", "Mỗi người nhận các thẻ sự kiện chưa lộ thời điểm. Một thẻ gốc được mở sẵn để bắt đầu dòng thời gian."],
  ["02", "Chọn đúng vị trí", "Chọn một thẻ rồi đặt vào một khe trên dòng thời gian. Sự kiện xảy ra sớm hơn đặt bên trái; sự kiện xảy ra muộn hơn đặt bên phải. Nếu trùng năm, hãy xét thêm tháng diễn ra sự kiện."],
  ["03", "Thách đấu đối thủ", "Sau khi một thẻ được đặt, người đến lượt có thể khui thẻ đó. Nếu vị trí sai, người đặt bốc thêm một thẻ phạt."],
  ["04", "Viết nên chiến thắng", "Người đầu tiên đặt hết thẻ trên tay sẽ chiến thắng. Thứ tự lượt chơi được quay ngẫu nhiên khi ván bắt đầu."],
] as const;

export function RulesPage({ onBack, onBrowseCards }: RulesPageProps) {
  return (
    <main className="rules-page min-h-screen text-white">
      <div className="history-grid" />
      <nav className="rules-page-nav">
        <button type="button" onClick={onBack} className="library-back-btn"><ArrowLeftIcon /><span>Về sảnh chính</span></button>
        <div className="rules-page-brand"><span className="brand-mark"><span>DT</span></span><strong>Dòng Thời Gian</strong></div>
        <button type="button" onClick={onBrowseCards} className="rules-page-cards">Bộ thẻ</button>
      </nav>

      <header className="rules-page-hero">
        <p>Cẩm nang nhà sử học</p>
        <h1>Luật <em>chơi</em></h1>
        <span>Đọc nhanh luật, sau đó sẵn sàng sắp xếp cả dòng lịch sử.</span>
      </header>

      <section className="rules-page-content" aria-label="Hướng dẫn chơi">
        <div className="rules-page-steps">
          {steps.map(([number, title, description]) => (
            <article key={number} className="rules-page-step">
              <span className="rules-page-number">{number}</span>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </div>

        <section className="placement-guide" aria-labelledby="placement-title">
          <div><p>Quy tắc quan trọng nhất</p><h2 id="placement-title">Đặt thẻ theo chiều thời gian</h2></div>
          <div className="placement-track" aria-label="Bên trái là quá khứ, bên phải là tương lai">
            <span>← Bên trái: sự kiện xảy ra trước</span>
            <i>●</i><b>Thẻ đang xét</b><i>●</i>
            <span>Bên phải: sự kiện xảy ra sau →</span>
          </div>
        </section>
      </section>
    </main>
  );
}
