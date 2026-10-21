import { GameCard, GameState, GameView, PublicCardFront } from "./types";

const frontOf = (card: GameCard): PublicCardFront => ({ cardId: card.cardId, image: card.image, event: card.event });

export const viewFor = (state: GameState, playerId: string): GameView => {
  if (!state.players.some((player) => player.id === playerId)) throw new Error("Người chơi không tồn tại trong ván");
  return {
    players: state.players.map((player) => ({ id: player.id, name: player.name, handCount: player.hand.length, ...(player.id === playerId ? { hand: player.hand.map(frontOf) } : {}) })),
    rootCard: { ...frontOf(state.rootCard), year: state.rootCard.year },
    timeline: state.timeline.map((entry) => ({ ...frontOf(entry.card), revealed: entry.revealed, placedBy: entry.placedBy, isRoot: entry.isRoot, ...(entry.revealed ? { year: entry.card.year } : {}) })),
    lastPlaced: state.lastPlaced ? { ...frontOf(state.lastPlaced.card), index: state.lastPlaced.index, playerId: state.lastPlaced.playerId } : null,
    drawPileCount: state.drawPile.length,
    currentPlayerId: state.players[state.currentPlayerIndex].id,
    hasChallengedThisTurn: state.hasChallengedThisTurn,
    phase: state.phase,
    winner: state.winner,
    turnDeadline: state.turnDeadline,
    turnDurationMs: state.turnDurationMs,
    serverNow: Date.now(),
  };
};
