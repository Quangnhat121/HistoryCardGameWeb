import { CatanEngine } from "./CatanEngine";
import type { CatanState } from "./types";

export const TEST_PLAYERS = [
  { id: "a", name: "An" },
  { id: "b", name: "Bình" },
  { id: "c", name: "Chi" },
];

export const completeSetup = (engine: CatanEngine): CatanState => {
  while (engine.state?.phase === "setup") {
    const state = engine.state;
    const playerId = state!.currentPlayerId;
    let placedIntersection: string | null = null;
    for (const intersection of state!.intersections) {
      try {
        engine.placeInitialSettlement(playerId, intersection.id);
        placedIntersection = intersection.id;
        break;
      } catch { /* try the next legal intersection */ }
    }
    if (!placedIntersection) throw new Error("Không tìm được giao điểm setup hợp lệ trong test");
    const afterSettlement = engine.state!;
    const edge = afterSettlement.intersections.find((entry) => entry.id === placedIntersection)!.edgeIds
      .find((id) => !afterSettlement.roads[id]);
    if (!edge) throw new Error("Không tìm được cạnh setup hợp lệ trong test");
    engine.placeInitialRoad(playerId, edge);
  }
  return engine.state!;
};

export const fixedEngine = (diceRoller: () => number = () => 2): CatanEngine => {
  const engine = new CatanEngine({ boardMode: "fixed", random: () => 0.37, diceRoller });
  engine.createGame(TEST_PLAYERS);
  return engine;
};

export const findEdgePath = (state: CatanState, length: number): string[] => {
  const edgeById = new Map(state.edges.map((edge) => [edge.id, edge]));
  const incident = new Map<string, string[]>();
  state.edges.forEach((edge) => edge.intersectionIds.forEach((vertex) => incident.set(vertex, [...(incident.get(vertex) ?? []), edge.id])));
  const walk = (vertex: string, path: string[], visitedVertices: Set<string>): string[] | null => {
    if (path.length === length) return path;
    for (const edgeId of incident.get(vertex) ?? []) {
      if (path.includes(edgeId)) continue;
      const edge = edgeById.get(edgeId)!;
      const next = edge.intersectionIds[0] === vertex ? edge.intersectionIds[1] : edge.intersectionIds[0];
      if (visitedVertices.has(next)) continue;
      const result = walk(next, [...path, edgeId], new Set([...visitedVertices, next]));
      if (result) return result;
    }
    return null;
  };
  for (const vertex of incident.keys()) {
    const result = walk(vertex, [], new Set([vertex]));
    if (result) return result;
  }
  throw new Error(`Không tìm được đường dài ${length}`);
};
