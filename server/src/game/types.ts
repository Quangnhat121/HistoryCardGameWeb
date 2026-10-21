export interface GameCard { cardId: number; image: string; event: string; year: number; }
export interface GamePlayerInput { id: string; name: string; }
export interface GamePlayer extends GamePlayerInput { hand: GameCard[]; }
export type GamePhase = "turn" | "awaiting_verdict" | "finished";
export interface TimelineCard { card: GameCard; revealed: boolean; placedBy: string | null; isRoot: boolean; }
export interface LastPlaced { card: GameCard; index: number; playerId: string; }
export interface GameState {
  players: GamePlayer[];
  rootCard: GameCard;
  timeline: TimelineCard[];
  drawPile: GameCard[];
  currentPlayerIndex: number;
  lastPlaced: LastPlaced | null;
  hasChallengedThisTurn: boolean;
  pendingWinnerId: string | null;
  winner: string | null;
  phase: GamePhase;
  turnNumber: number;
  turnDeadline: number | null;
  turnDurationMs: number;
}
export interface ChallengeResult { cardId: number; year: number; correct: boolean; winner: string | null; }
export interface PublicCardFront { cardId: number; image: string; event: string; }
export interface PublicRevealedCard extends PublicCardFront { year: number; }
export interface PlayerView { id: string; name: string; handCount: number; hand?: PublicCardFront[]; }
export interface TimelineCardView extends PublicCardFront { revealed: boolean; placedBy: string | null; isRoot: boolean; year?: number; }
export interface LastPlacedView extends PublicCardFront { index: number; playerId: string; }
export interface GameView {
  players: PlayerView[];
  rootCard: PublicRevealedCard;
  timeline: TimelineCardView[];
  lastPlaced: LastPlacedView | null;
  drawPileCount: number;
  currentPlayerId: string;
  hasChallengedThisTurn: boolean;
  phase: GamePhase;
  winner: string | null;
  turnDeadline: number | null;
  turnDurationMs: number;
  serverNow: number;
}
export interface TurnTimeoutResult { timedOutPlayerId: string; winner: string | null; }
