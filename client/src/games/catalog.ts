export const APP_ROUTES = {
  hub: "#hub",
  timeline: "#timeline",
  cards: "#cards",
  rules: "#rules",
  catan: "#catan",
  catanLocal: "#catan-local",
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
export type GameId = "timeline" | "catan";
export type GameStatus = "available" | "beta" | "development";
export type GameCover = "timeline" | "island";

export interface GameCatalogEntry {
  id: GameId;
  name: string;
  nameLines: readonly string[];
  description: string;
  route: AppRoute;
  status: GameStatus;
  statusLabel: string;
  cover: GameCover;
  genre: string;
  playerCount: string;
  actionLabel: string;
  enabled: boolean;
}

export const GAME_CATALOG = [
  {
    id: "timeline",
    name: "Dòng Thời Gian",
    nameLines: ["Dòng", "Thời Gian"],
    description: "Sắp xếp những khoảnh khắc làm thay đổi thế giới và thách thức hiểu biết của bạn bè.",
    route: APP_ROUTES.timeline,
    status: "available",
    statusLabel: "Sẵn sàng",
    cover: "timeline",
    genre: "Thẻ bài",
    playerCount: "2–4 người",
    actionLabel: "Vào trò chơi",
    enabled: true,
  },
  {
    id: "catan",
    name: "CATAN",
    nameLines: ["CATAN"],
    description: "Khai phá hòn đảo, trao đổi tài nguyên và gây dựng một nền văn minh thịnh vượng.",
    route: APP_ROUTES.catan,
    status: "beta",
    statusLabel: "Đang phát triển",
    cover: "island",
    genre: "Chiến thuật",
    playerCount: "3–4 người",
    actionLabel: "Mở menu CATAN",
    enabled: true,
  },
] as const satisfies readonly GameCatalogEntry[];

export type AppPage = "hub" | "timeline" | "cards" | "rules" | "catan" | "catanLocal";

export const resolveAppPage = (hash: string): AppPage => {
  if (hash === APP_ROUTES.cards) return "cards";
  if (hash === APP_ROUTES.rules) return "rules";
  if (hash === APP_ROUTES.catan) return "catan";
  if (hash === APP_ROUTES.catanLocal) return "catanLocal";
  if (hash === APP_ROUTES.timeline || hash === "#top" || hash === "#play") return "timeline";
  return "hub";
};
