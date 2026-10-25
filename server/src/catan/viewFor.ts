import { CATAN_RESOURCES, type CatanState, type CatanViewState } from "./types";

export const catanViewFor = (state: CatanState, playerId: string): CatanViewState => {
  const { developmentDeck, players, ...publicState } = structuredClone(state);
  return {
    ...publicState,
    developmentDeckCount: developmentDeck.length,
    players: players.map((player) => {
      const isSelf = player.id === playerId;
      const totalVictoryPoints = player.publicVictoryPoints + player.hiddenVictoryPoints;
      return {
        id: player.id,
        name: player.name,
        color: player.color,
        victoryPoints: state.phase === "finished" ? totalVictoryPoints : player.publicVictoryPoints,
        ...(isSelf ? { privateVictoryPoints: totalVictoryPoints, resources: player.resources, developmentCards: player.developmentCards } : {}),
        resourceCount: CATAN_RESOURCES.reduce((total, resource) => total + player.resources[resource], 0),
        developmentCardCount: player.developmentCards.filter((card) => !card.played).length,
        pieces: player.pieces,
        playedKnights: player.playedKnights,
      };
    }),
  };
};
