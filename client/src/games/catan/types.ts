import type { CatanViewState } from "../../../../server/src/catan/types";

export type CatanGameState = CatanViewState;
export type { CatanResource } from "../../../../server/src/catan/types";

export interface CatanRoomPlayer {
  playerId: string;
  name: string;
  connected: boolean;
}

export interface CatanRoomState {
  code: string;
  hostId: string;
  selfPlayerId: string;
  started: boolean;
  players: CatanRoomPlayer[];
}
