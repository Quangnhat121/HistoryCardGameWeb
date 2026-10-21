export type GamePhase = "turn" | "awaiting_verdict" | "finished";

export interface CardFront {
  cardId: number;
  image: string;
  event: string;
}

export interface RevealedCard extends CardFront {
  year: number;
}

export interface TimelineCard extends CardFront {
  revealed: boolean;
  placedBy: string | null;
  isRoot: boolean;
  year?: number;
}

export interface LastPlaced extends CardFront {
  index: number;
  playerId: string;
}

export interface GamePlayer {
  id: string;
  name: string;
  handCount: number;
  hand?: CardFront[];
}

export interface GameState {
  players: GamePlayer[];
  rootCard: RevealedCard;
  timeline: TimelineCard[];
  lastPlaced: LastPlaced | null;
  drawPileCount: number;
  currentPlayerId: string;
  hasChallengedThisTurn: boolean;
  phase: GamePhase;
  winner: string | null;
  turnDeadline: number | null;
  turnDurationMs: number;
  serverNow: number;
}

export interface RoomPlayer {
  playerId: string;
  name: string;
  connected: boolean;
}

export interface RoomState {
  code: string;
  hostId: string;
  selfPlayerId: string;
  started: boolean;
  players: RoomPlayer[];
}

export interface ChallengeResult {
  cardId: number;
  year: number;
  correct: boolean;
  winner: string | null;
  drawerName: string;
}

export interface ChallengeVisual extends ChallengeResult {
  card: CardFront;
}

export interface LeaderboardEntry {
  name: string;
  wins: number;
}
