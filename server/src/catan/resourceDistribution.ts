import { CATAN_RESOURCES, type CatanResource, type CatanState, type ResourceBundle } from "./types";

export type ProductionDemand = Record<CatanResource, Record<string, number>>;
export type ProductionGrant = Record<string, ResourceBundle>;

const emptyDemand = (): ProductionDemand => ({ wood: {}, brick: {}, wool: {}, grain: {}, ore: {} });
const emptyBundle = (): ResourceBundle => ({ wood: 0, brick: 0, wool: 0, grain: 0, ore: 0 });

export const calculateProductionDemand = (
  state: Pick<CatanState, "board" | "buildings" | "robberHexId">,
  roll: number,
): ProductionDemand => {
  const demand = emptyDemand();
  state.board.filter((hex) => hex.token === roll && hex.id !== state.robberHexId && hex.resource !== "desert").forEach((hex) => {
    const resource = hex.resource as CatanResource;
    hex.intersectionIds.forEach((intersectionId) => {
      const building = state.buildings[intersectionId];
      if (!building) return;
      demand[resource][building.playerId] = (demand[resource][building.playerId] ?? 0) + (building.kind === "city" ? 2 : 1);
    });
  });
  return demand;
};

export const resolveProduction = (bank: ResourceBundle, demand: ProductionDemand): ProductionGrant => {
  const playerIds = new Set<string>();
  CATAN_RESOURCES.forEach((resource) => Object.keys(demand[resource]).forEach((id) => playerIds.add(id)));
  const grants: ProductionGrant = Object.fromEntries([...playerIds].map((id) => [id, emptyBundle()]));
  CATAN_RESOURCES.forEach((resource) => {
    const entries = Object.entries(demand[resource]);
    const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
    if (bank[resource] >= total) entries.forEach(([id, amount]) => { grants[id][resource] = amount; });
    else if (entries.length === 1) grants[entries[0][0]][resource] = Math.min(entries[0][1], bank[resource]);
  });
  return grants;
};
