import type { DevelopmentCardType, ResourceBundle } from "./types";

export const emptyResources = (): ResourceBundle => ({ wood: 0, brick: 0, wool: 0, grain: 0, ore: 0 });

export const BUILD_COSTS = {
  road: { wood: 1, brick: 1, wool: 0, grain: 0, ore: 0 },
  settlement: { wood: 1, brick: 1, wool: 1, grain: 1, ore: 0 },
  city: { wood: 0, brick: 0, wool: 0, grain: 2, ore: 3 },
  development: { wood: 0, brick: 0, wool: 1, grain: 1, ore: 1 },
} as const satisfies Record<string, ResourceBundle>;

export const DEVELOPMENT_DECK: DevelopmentCardType[] = [
  ...Array<DevelopmentCardType>(14).fill("knight"),
  ...Array<DevelopmentCardType>(2).fill("road_building"),
  ...Array<DevelopmentCardType>(2).fill("year_of_plenty"),
  ...Array<DevelopmentCardType>(2).fill("monopoly"),
  ...Array<DevelopmentCardType>(5).fill("victory_point"),
];

export const PLAYER_COLORS = ["#c85b3c", "#2f7398", "#d5a42d", "#5b8a4f"] as const;
