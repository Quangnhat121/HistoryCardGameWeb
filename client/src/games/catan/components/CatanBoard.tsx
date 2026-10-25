import { memo, useMemo, useRef, useState, type RefObject } from "react";
import type { CatanBuilding, CatanEdge, CatanHex, CatanIntersection, CatanRoad, CatanViewState } from "../../../../../server/src/catan/types";

export type BoardTarget = { kind: "hex" | "edge" | "intersection"; id: string };

interface Props {
  game: CatanViewState;
  legalTargets: readonly string[];
  selected: BoardTarget | null;
  onSelect: (target: BoardTarget) => void;
  onInspect: (id: string) => void;
}

const center = (q: number, r: number) => ({ x: 400 + 96 * q + 48 * r, y: 340 + 84 * r });
const corner = (q: number, r: number, index: number) => {
  const offsets = [[0, -2], [1, -1], [1, 1], [0, 2], [-1, 1], [-1, -1]];
  const [dx, dy] = offsets[index];
  const origin = center(q, r);
  return { x: origin.x + 48 * dx, y: origin.y + 28 * dy };
};
const vertexPoint = (id: string) => {
  const [, x, y] = id.split(":").map(Number);
  return { x: 400 + 48 * x, y: 340 + 28 * y };
};
const terrainNames: Record<string, string> = { wood: "Rừng", brick: "Đồi", wool: "Đồng cỏ", grain: "Ruộng", ore: "Núi", desert: "Sa mạc" };
const symbols: Record<string, string> = { wood: "♠", brick: "▰", wool: "✿", grain: "✳", ore: "◆", desert: "☀" };

const CatanTile = memo(function CatanTile({ hex, robber, legal, selected, suppressClick, onSelect, onInspect }: {
  hex: CatanHex; robber: boolean; legal: boolean; selected: boolean; suppressClick: RefObject<boolean>;
  onSelect: (target: BoardTarget) => void; onInspect: (id: string) => void;
}) {
  const points = Array.from({ length: 6 }, (_, index) => corner(hex.q, hex.r, index)).map((point) => `${point.x},${point.y}`).join(" ");
  const { x, y } = center(hex.q, hex.r);
  const activate = () => legal ? onSelect({ kind: "hex", id: hex.id }) : onInspect(hex.id);
  return <g className={`catan-hex catan-hex-${hex.resource} ${legal ? "is-legal" : ""} ${selected ? "is-selected" : ""}`}>
    <polygon points={points} className="catan-hex-shape" filter="url(#catan-shadow)" role="button" tabIndex={0} aria-label={`${terrainNames[hex.resource]}, số ${hex.token ?? "không có"}${robber ? ", có tên cướp" : ""}`} onClick={() => { if (!suppressClick.current) activate(); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); } }} />
    <text x={x} y={y - 7} className="catan-terrain-symbol" textAnchor="middle" pointerEvents="none">{symbols[hex.resource]}</text>
    <text x={x} y={y - 36} className="catan-terrain-name" textAnchor="middle" pointerEvents="none">{terrainNames[hex.resource]}</text>
    {hex.token !== null && <g pointerEvents="none"><circle cx={x} cy={y + 13} r="19" className="catan-token" /><text x={x} y={y + 20} textAnchor="middle" className={`catan-token-label ${hex.token === 6 || hex.token === 8 ? "is-hot" : ""}`}>{hex.token}</text></g>}
    {robber && <g pointerEvents="none"><circle cx={x + 30} cy={y - 24} r="14" fill="#161e28" stroke="#e5d4aa" strokeWidth="2" /><text x={x + 30} y={y - 19} textAnchor="middle" fontSize="15">♟</text></g>}
  </g>;
});

const CatanRoad = memo(function CatanRoad({ edge, road, ownerName, color, legal, selected, suppressClick, onSelect }: {
  edge: CatanEdge; road?: CatanRoad; ownerName?: string; color?: string; legal: boolean; selected: boolean;
  suppressClick: RefObject<boolean>; onSelect: (target: BoardTarget) => void;
}) {
  const [first, second] = edge.intersectionIds.map(vertexPoint);
  const activate = () => { if (legal) onSelect({ kind: "edge", id: edge.id }); };
  return <g className={`catan-edge ${legal ? "is-legal" : ""} ${selected ? "is-selected" : ""}`}>
    <line x1={first.x} y1={first.y} x2={second.x} y2={second.y} stroke="transparent" strokeWidth="21" className="catan-edge-hit" role="button" tabIndex={legal ? 0 : -1} aria-label={road ? `Đường của ${ownerName}` : "Xây đường tại cạnh này"} onClick={() => { if (!suppressClick.current) activate(); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); } }} />
    {road && <line className="catan-new-piece" x1={first.x} y1={first.y} x2={second.x} y2={second.y} stroke={color ?? "#fff"} strokeWidth="9" strokeLinecap="round" pointerEvents="none" />}
    {!road && legal && <line x1={first.x} y1={first.y} x2={second.x} y2={second.y} stroke="#ffe7a7" strokeWidth="5" strokeDasharray="5 6" pointerEvents="none" />}
  </g>;
});

const SettlementMarker = memo(function SettlementMarker({ x, y, color }: { x: number; y: number; color: string }) {
  return <g className="catan-new-piece" pointerEvents="none"><circle cx={x} cy={y} r="11" fill={color} stroke="#172633" strokeWidth="2.5" /><text x={x} y={y + 5} textAnchor="middle" fontSize="15" fill="#fff">⌂</text></g>;
});

const CityMarker = memo(function CityMarker({ x, y, color }: { x: number; y: number; color: string }) {
  return <g className="catan-new-piece" pointerEvents="none"><circle cx={x} cy={y} r="13" fill={color} stroke="#172633" strokeWidth="2.5" /><text x={x} y={y + 5} textAnchor="middle" fontSize="16" fill="#fff">♜</text></g>;
});

const CatanBuilding = memo(function CatanBuilding({ intersection, building, ownerName, color, legal, selected, suppressClick, onSelect }: {
  intersection: CatanIntersection; building?: CatanBuilding; ownerName?: string; color?: string; legal: boolean; selected: boolean;
  suppressClick: RefObject<boolean>; onSelect: (target: BoardTarget) => void;
}) {
  const { x, y } = vertexPoint(intersection.id);
  const activate = () => { if (legal) onSelect({ kind: "intersection", id: intersection.id }); };
  return <g className={`catan-vertex ${legal ? "is-legal" : ""} ${selected ? "is-selected" : ""}`}>
    {building?.kind === "settlement" && <SettlementMarker x={x} y={y} color={color ?? "#fff"} />}
    {building?.kind === "city" && <CityMarker x={x} y={y} color={color ?? "#fff"} />}
    {!building && legal && <circle cx={x} cy={y} r="11" fill="#edd49b" stroke="#172633" strokeWidth="2.5" pointerEvents="none" />}
    <circle cx={x} cy={y} r="18" fill="transparent" role="button" tabIndex={legal ? 0 : -1} aria-label={building ? `${building.kind === "city" ? "Thành phố" : "Khu định cư"} của ${ownerName}` : "Giao điểm xây khu định cư"} onClick={() => { if (!suppressClick.current) activate(); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); } }} />
  </g>;
});

export const CatanBoard = memo(function CatanBoard({ game, legalTargets, selected, onSelect, onInspect }: Props) {
  const [zoom, setZoom] = useState(1.4);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; oldX: number; oldY: number } | null>(null);
  const suppressClick = useRef(false);
  const legal = useMemo(() => new Set(legalTargets), [legalTargets]);
  const colors = useMemo(() => Object.fromEntries(game.players.map((player) => [player.id, player.color])), [game.players]);
  const names = useMemo(() => Object.fromEntries(game.players.map((player) => [player.id, player.name])), [game.players]);
  const viewWidth = 800 / zoom;
  const viewHeight = 680 / zoom;
  const viewX = (800 - viewWidth) / 2 - offset.x;
  const viewY = (680 - viewHeight) / 2 - offset.y;

  return (
    <section className="catan-map-panel" aria-label="Bàn chơi CATAN">
      <div className="catan-map-toolbar"><span>Kéo để di chuyển · Chạm ô để xem</span><div><button type="button" aria-label="Thu nhỏ bàn" onClick={() => setZoom((value) => Math.max(.85, value - .2))}>−</button><strong>{Math.round(zoom * 100)}%</strong><button type="button" aria-label="Phóng to bàn" onClick={() => setZoom((value) => Math.min(2.2, value + .2))}>+</button><button type="button" onClick={() => { setZoom(1.4); setOffset({ x: 0, y: 0 }); }}>Đặt lại</button></div></div>
      <svg className="catan-map-svg" viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`} role="group" aria-label="Đảo CATAN gồm 19 ô đất, các đường và giao điểm"
        onPointerDown={(event) => { drag.current = { x: event.clientX, y: event.clientY, oldX: offset.x, oldY: offset.y }; }}
        onPointerMove={(event) => { if (!drag.current) return; const dx = event.clientX - drag.current.x; const dy = event.clientY - drag.current.y; if (Math.abs(dx) + Math.abs(dy) < 5 && !suppressClick.current) return; suppressClick.current = true; if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId); const rect = event.currentTarget.getBoundingClientRect(); setOffset({ x: drag.current.oldX + dx * viewWidth / rect.width, y: drag.current.oldY + dy * viewHeight / rect.height }); }}
        onPointerUp={() => { drag.current = null; window.setTimeout(() => { suppressClick.current = false; }, 0); }}
        onPointerCancel={() => { drag.current = null; suppressClick.current = false; }}>
        <defs>
          <radialGradient id="catan-water"><stop stopColor="#258196" /><stop offset="1" stopColor="#0d3547" /></radialGradient>
          <filter id="catan-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="5" floodOpacity=".4" /></filter>
        </defs>
        <rect className="catan-map-water" x="-200" y="-200" width="1200" height="1100" fill="url(#catan-water)" />
        {game.board.map((hex) => <CatanTile key={hex.id} hex={hex} robber={game.robberHexId === hex.id} legal={legal.has(hex.id)} selected={selected?.id === hex.id} suppressClick={suppressClick} onSelect={onSelect} onInspect={onInspect} />)}
        {game.harbors.map((port) => {
          const [first, second] = port.intersectionIds.map(vertexPoint);
          const x = (first.x + second.x) / 2;
          const y = (first.y + second.y) / 2;
          const outward = { x: (x - 400) * .13, y: (y - 340) * .13 };
          return <g key={port.id} pointerEvents="none"><circle cx={x + outward.x} cy={y + outward.y} r="14" fill="#102f40" stroke="#d9bf89" strokeWidth="1.5" /><text x={x + outward.x} y={y + outward.y + 4} className="catan-port-label" textAnchor="middle">{port.kind === "generic" ? "3:1" : "2:1"}</text></g>;
        })}
        {game.edges.map((edge) => <CatanRoad key={edge.id} edge={edge} road={game.roads[edge.id]} ownerName={names[game.roads[edge.id]?.playerId]} color={colors[game.roads[edge.id]?.playerId]} legal={legal.has(edge.id)} selected={selected?.id === edge.id} suppressClick={suppressClick} onSelect={onSelect} />)}
        {game.intersections.map((intersection) => <CatanBuilding key={intersection.id} intersection={intersection} building={game.buildings[intersection.id]} ownerName={names[game.buildings[intersection.id]?.playerId]} color={colors[game.buildings[intersection.id]?.playerId]} legal={legal.has(intersection.id)} selected={selected?.id === intersection.id} suppressClick={suppressClick} onSelect={onSelect} />)}
      </svg>
    </section>
  );
});
