import type { CatanEdge, CatanHarbor, CatanHex, CatanIntersection, CatanTerrain, HarborKind } from "./types";

const HEX_DIRECTIONS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]] as const;
const CORNER_OFFSETS = [[0, -2], [1, -1], [1, 1], [0, 2], [-1, 1], [-1, -1]] as const;
const NUMBER_TOKENS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
const FIXED_TERRAINS: CatanTerrain[] = [
  "wood", "wool", "grain",
  "brick", "ore", "wood", "wool",
  "grain", "brick", "desert", "ore", "wood",
  "wool", "grain", "brick", "ore",
  "wood", "wool", "grain",
];
const RANDOM_TERRAINS: CatanTerrain[] = [
  "wood", "wood", "wood", "wood", "brick", "brick", "brick", "wool", "wool", "wool", "wool",
  "grain", "grain", "grain", "grain", "ore", "ore", "ore", "desert",
];
const HARBOR_TYPES: HarborKind[] = ["generic", "wood", "generic", "brick", "generic", "wool", "ore", "generic", "grain"];
const HARBOR_EDGE_INDICES = [0, 3, 7, 10, 13, 17, 20, 23, 27];

export interface CatanBoardTopology {
  board: CatanHex[];
  intersections: CatanIntersection[];
  edges: CatanEdge[];
  harbors: CatanHarbor[];
}

export const shuffle = <T>(values: readonly T[], random: () => number): T[] => {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
};

export const axialCoordinates = (): Array<{ q: number; r: number }> => {
  const result: Array<{ q: number; r: number }> = [];
  for (let r = -2; r <= 2; r += 1) {
    for (let q = -2; q <= 2; q += 1) {
      if (Math.abs(q + r) <= 2) result.push({ q, r });
    }
  }
  return result;
};

const vertexId = (q: number, r: number, corner: number): string => {
  const [offsetX, offsetY] = CORNER_OFFSETS[corner];
  return `v:${2 * q + r + offsetX}:${3 * r + offsetY}`;
};

const edgeId = (first: string, second: string): string => `e:${[first, second].sort().join("|")}`;
const hexId = (q: number, r: number): string => `h:${q}:${r}`;
const isRedToken = (token: number): boolean => token === 6 || token === 8;

const assignTokens = (hexes: Array<{ id: string; q: number; r: number; resource: CatanTerrain }>, random?: () => number): Map<string, number> => {
  const productive = hexes.filter((hex) => hex.resource !== "desert");
  const assigned = new Map<string, number>();
  const visit = (index: number, remaining: number[]): boolean => {
    if (index === productive.length) return true;
    const hex = productive[index];
    const candidates = [...new Set(remaining)].sort((a, b) => a - b);
    const ordered = random ? shuffle(candidates, random) : candidates;
    for (const token of ordered) {
      if (isRedToken(token)) {
        const touchesRed = HEX_DIRECTIONS.some(([dq, dr]) => {
          const adjacent = productive.find((entry) => entry.q === hex.q + dq && entry.r === hex.r + dr);
          return adjacent ? isRedToken(assigned.get(adjacent.id) ?? -1) : false;
        });
        if (touchesRed) continue;
      }
      assigned.set(hex.id, token);
      const tokenIndex = remaining.indexOf(token);
      const next = remaining.filter((_, candidateIndex) => candidateIndex !== tokenIndex);
      if (visit(index + 1, next)) return true;
      assigned.delete(hex.id);
    }
    return false;
  };
  if (!visit(0, [...NUMBER_TOKENS])) throw new Error("Không thể tạo bố trí thẻ số CATAN hợp lệ");
  return assigned;
};

const orderCoastalEdges = (edges: CatanEdge[]): CatanEdge[] => {
  const coastal = edges.filter((edge) => edge.coastal).sort((a, b) => a.id.localeCompare(b.id));
  const byVertex = new Map<string, CatanEdge[]>();
  coastal.forEach((edge) => edge.intersectionIds.forEach((id) => byVertex.set(id, [...(byVertex.get(id) ?? []), edge])));
  const first = coastal[0];
  const result: CatanEdge[] = [];
  let current = first;
  let vertex = [...first.intersectionIds].sort()[0];
  do {
    result.push(current);
    const nextVertex = current.intersectionIds[0] === vertex ? current.intersectionIds[1] : current.intersectionIds[0];
    const next = (byVertex.get(nextVertex) ?? []).find((candidate) => candidate.id !== current.id);
    if (!next) break;
    vertex = nextVertex;
    current = next;
  } while (current.id !== first.id && result.length <= coastal.length);
  if (result.length !== coastal.length) throw new Error("Chu trình bờ biển CATAN không hợp lệ");
  return result;
};

export const createCatanBoard = (mode: "fixed" | "random" = "random", random: () => number = Math.random): CatanBoardTopology => {
  const coords = axialCoordinates();
  const terrains = mode === "fixed" ? [...FIXED_TERRAINS] : shuffle(RANDOM_TERRAINS, random);
  const baseHexes = coords.map(({ q, r }, index) => ({ id: hexId(q, r), q, r, resource: terrains[index] }));
  const tokenMap = assignTokens(baseHexes, mode === "random" ? random : undefined);
  const hexIdSet = new Set(baseHexes.map((hex) => hex.id));
  const intersectionMap = new Map<string, CatanIntersection>();
  const edgeMap = new Map<string, CatanEdge>();

  const board: CatanHex[] = baseHexes.map((base) => {
    const intersectionIds = CORNER_OFFSETS.map((_, corner) => vertexId(base.q, base.r, corner));
    const edgeIds = intersectionIds.map((first, corner) => edgeId(first, intersectionIds[(corner + 1) % 6]));
    intersectionIds.forEach((id) => {
      const intersection = intersectionMap.get(id) ?? { id, adjacentHexIds: [], edgeIds: [], neighborIds: [], coastal: false, harborId: null };
      intersection.adjacentHexIds.push(base.id);
      intersectionMap.set(id, intersection);
    });
    edgeIds.forEach((id, corner) => {
      const endpoints = [intersectionIds[corner], intersectionIds[(corner + 1) % 6]].sort() as [string, string];
      const edge = edgeMap.get(id) ?? { id, intersectionIds: endpoints, adjacentHexIds: [], coastal: false };
      edge.adjacentHexIds.push(base.id);
      edgeMap.set(id, edge);
    });
    return {
      ...base,
      token: base.resource === "desert" ? null : tokenMap.get(base.id)!,
      intersectionIds,
      edgeIds,
      neighborHexIds: HEX_DIRECTIONS.map(([dq, dr]) => hexId(base.q + dq, base.r + dr)).filter((id) => hexIdSet.has(id)),
    };
  });

  const edges = [...edgeMap.values()].sort((a, b) => a.id.localeCompare(b.id));
  edges.forEach((edge) => { edge.coastal = edge.adjacentHexIds.length === 1; });
  const intersections = [...intersectionMap.values()].sort((a, b) => a.id.localeCompare(b.id));
  const intersectionById = new Map(intersections.map((entry) => [entry.id, entry]));
  edges.forEach((edge) => {
    const [first, second] = edge.intersectionIds;
    intersectionById.get(first)!.edgeIds.push(edge.id);
    intersectionById.get(first)!.neighborIds.push(second);
    intersectionById.get(second)!.edgeIds.push(edge.id);
    intersectionById.get(second)!.neighborIds.push(first);
  });
  intersections.forEach((intersection) => { intersection.coastal = intersection.edgeIds.some((id) => edgeMap.get(id)?.coastal); });

  const coast = orderCoastalEdges(edges);
  const harborTypes = mode === "fixed" ? [...HARBOR_TYPES] : shuffle(HARBOR_TYPES, random);
  const harbors = HARBOR_EDGE_INDICES.map((coastIndex, index): CatanHarbor => {
    const edge = coast[coastIndex];
    const harbor = { id: `port:${index}`, kind: harborTypes[index], edgeId: edge.id, intersectionIds: edge.intersectionIds };
    edge.intersectionIds.forEach((id) => { intersectionById.get(id)!.harborId = harbor.id; });
    return harbor;
  });

  return { board, intersections, edges, harbors };
};

export const areHexesAdjacent = (first: CatanHex, second: CatanHex): boolean =>
  HEX_DIRECTIONS.some(([dq, dr]) => first.q + dq === second.q && first.r + dr === second.r);
