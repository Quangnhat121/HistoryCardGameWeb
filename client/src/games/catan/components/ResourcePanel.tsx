import type { CatanViewPlayer, CatanResource } from "../../../../../server/src/catan/types";
import { RESOURCE_NAMES } from "../uiCopy";

const symbols: Record<CatanResource, string> = { wood: "♠", brick: "▰", wool: "✿", grain: "✳", ore: "◆" };

export function ResourcePanel({ player }: { player: CatanViewPlayer | undefined }) {
  return <section className="catan-ui-panel catan-resource-panel" aria-label="Tài nguyên của bạn">
    <div className="catan-panel-heading"><span>Túi tài nguyên</span><strong>{player?.name ?? "Đang chờ"}</strong></div>
    <div className="catan-resource-grid">{(Object.keys(RESOURCE_NAMES) as CatanResource[]).map((resource) => <div key={resource} className={`catan-resource catan-resource-${resource}`}><i>{symbols[resource]}</i><span>{RESOURCE_NAMES[resource]}</span><strong key={player?.resources?.[resource] ?? "hidden"}>{player?.resources?.[resource] ?? "—"}</strong></div>)}</div>
    <p>Thẻ của người khác chỉ hiển thị số lượng.</p>
  </section>;
}
