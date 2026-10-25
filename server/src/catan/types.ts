export const CATAN_RESOURCES = ["wood", "brick", "wool", "grain", "ore"] as const;
export type CatanResource = (typeof CATAN_RESOURCES)[number];
export type CatanTerrain = CatanResource | "desert";
export type CatanPhase = "setup" | "roll" | "discard" | "robber" | "action" | "road_building" | "finished";
export type BuildingKind = "settlement" | "city";
export type DevelopmentCardType = "knight" | "road_building" | "year_of_plenty" | "monopoly" | "victory_point";
export type HarborKind = "generic" | CatanResource;
export type ResourceBundle = Record<CatanResource, number>;

export interface CatanHex {
  id: string;
  q: number;
  r: number;
  resource: CatanTerrain;
  token: number | null;
  intersectionIds: string[];
  edgeIds: string[];
  neighborHexIds: string[];
}

export interface CatanIntersection {
  id: string;
  adjacentHexIds: string[];
  edgeIds: string[];
  neighborIds: string[];
  coastal: boolean;
  harborId: string | null;
}

export interface CatanEdge {
  id: string;
  intersectionIds: [string, string];
  adjacentHexIds: string[];
  coastal: boolean;
}

export interface CatanHarbor {
  id: string;
  kind: HarborKind;
  edgeId: string;
  intersectionIds: [string, string];
}

export interface CatanBuilding {
  intersectionId: string;
  playerId: string;
  kind: BuildingKind;
}

export interface CatanRoad { edgeId: string; playerId: string }

export interface DevelopmentCard {
  id: string;
  type: DevelopmentCardType;
  purchasedTurn: number;
  played: boolean;
}

export interface CatanPlayerInput { id: string; name: string }

export interface CatanPlayer extends CatanPlayerInput {
  color: string;
  resources: ResourceBundle;
  developmentCards: DevelopmentCard[];
  pieces: { roads: number; settlements: number; cities: number };
  playedKnights: number;
  publicVictoryPoints: number;
  hiddenVictoryPoints: number;
}

export interface TradeOffer {
  id: string;
  proposerId: string;
  targetId: string;
  give: ResourceBundle;
  want: ResourceBundle;
  status: "open" | "accepted" | "rejected" | "cancelled";
  createdTurn: number;
}

export interface CatanState {
  phase: CatanPhase;
  board: CatanHex[];
  intersections: CatanIntersection[];
  edges: CatanEdge[];
  harbors: CatanHarbor[];
  buildings: Record<string, CatanBuilding>;
  roads: Record<string, CatanRoad>;
  players: CatanPlayer[];
  bank: ResourceBundle;
  developmentDeck: DevelopmentCardType[];
  developmentDiscard: DevelopmentCardType[];
  tradeOffers: TradeOffer[];
  currentPlayerId: string;
  turnNumber: number;
  dice: [number, number] | null;
  robberHexId: string;
  setupOrder: string[];
  setupIndex: number;
  setupStep: "settlement" | "road";
  lastSetupIntersectionId: string | null;
  pendingDiscards: Record<string, number>;
  robberReturnPhase: "roll" | "action" | null;
  pendingFreeRoads: number;
  roadBuildingReturnPhase: "roll" | "action" | null;
  hasPlayedDevelopmentThisTurn: boolean;
  longestRoad: { holderId: string | null; lengths: Record<string, number> };
  largestArmy: { holderId: string | null; sizes: Record<string, number> };
  winner: string | null;
  revision: number;
}

export interface CatanGameOptions {
  boardMode?: "fixed" | "random";
  random?: () => number;
  diceRoller?: () => number;
  developmentDeck?: DevelopmentCardType[];
}

export interface CatanViewPlayer {
  id: string;
  name: string;
  color: string;
  victoryPoints: number;
  privateVictoryPoints?: number;
  resourceCount: number;
  developmentCardCount: number;
  resources?: ResourceBundle;
  developmentCards?: DevelopmentCard[];
  pieces: CatanPlayer["pieces"];
  playedKnights: number;
}

export interface CatanViewState extends Omit<CatanState, "players" | "developmentDeck"> {
  players: CatanViewPlayer[];
  developmentDeckCount: number;
}

export type CatanErrorCode =
  | "GAME_NOT_STARTED" | "GAME_FINISHED" | "PLAYER_NOT_FOUND" | "NOT_CURRENT_PLAYER"
  | "INVALID_PHASE" | "INVALID_SETUP_ORDER" | "INVALID_LOCATION" | "OCCUPIED"
  | "DISTANCE_RULE" | "NOT_CONNECTED" | "INSUFFICIENT_RESOURCES" | "BANK_SHORTAGE"
  | "PIECE_LIMIT" | "INVALID_DICE" | "DISCARD_REQUIRED" | "INVALID_DISCARD"
  | "ROBBER_MUST_MOVE" | "INVALID_ROBBER_VICTIM" | "INVALID_TRADE" | "OFFER_NOT_FOUND"
  | "DEVELOPMENT_DECK_EMPTY" | "DEVELOPMENT_CARD_NOT_FOUND"
  | "DEVELOPMENT_CARD_BOUGHT_THIS_TURN" | "DEVELOPMENT_CARD_LIMIT" | "INVALID_DEVELOPMENT_ACTION";
