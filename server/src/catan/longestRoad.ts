import type { CatanState } from "./types";

export const calculateLongestRoad = (state: Pick<CatanState, "edges" | "roads" | "buildings">, playerId: string): number => {
  const edgeById = new Map(state.edges.map((edge) => [edge.id, edge]));
  const ownedEdgeIds = new Set(Object.values(state.roads).filter((road) => road.playerId === playerId).map((road) => road.edgeId));
  const incident = new Map<string, string[]>();
  ownedEdgeIds.forEach((id) => {
    const edge = edgeById.get(id);
    edge?.intersectionIds.forEach((vertex) => incident.set(vertex, [...(incident.get(vertex) ?? []), id]));
  });

  const walk = (vertex: string, used: Set<string>): number => {
    const blocker = state.buildings[vertex];
    if (used.size > 0 && blocker && blocker.playerId !== playerId) return used.size;
    let best = used.size;
    for (const id of incident.get(vertex) ?? []) {
      if (used.has(id)) continue;
      const edge = edgeById.get(id)!;
      const next = edge.intersectionIds[0] === vertex ? edge.intersectionIds[1] : edge.intersectionIds[0];
      const nextUsed = new Set(used);
      nextUsed.add(id);
      best = Math.max(best, walk(next, nextUsed));
    }
    return best;
  };

  let longest = 0;
  for (const vertex of incident.keys()) longest = Math.max(longest, walk(vertex, new Set()));
  return longest;
};

export const resolveLongestRoadHolder = (
  lengths: Record<string, number>,
  currentHolderId: string | null,
): string | null => {
  const maximum = Math.max(0, ...Object.values(lengths));
  if (maximum < 5) return null;
  const leaders = Object.keys(lengths).filter((id) => lengths[id] === maximum);
  if (currentHolderId && leaders.includes(currentHolderId)) return currentHolderId;
  return leaders.length === 1 ? leaders[0] : null;
};

export const resolveLargestArmyHolder = (
  sizes: Record<string, number>,
  currentHolderId: string | null,
): string | null => {
  const maximum = Math.max(0, ...Object.values(sizes));
  if (maximum < 3) return null;
  const leaders = Object.keys(sizes).filter((id) => sizes[id] === maximum);
  if (currentHolderId && leaders.includes(currentHolderId)) return currentHolderId;
  return leaders.length === 1 ? leaders[0] : null;
};
