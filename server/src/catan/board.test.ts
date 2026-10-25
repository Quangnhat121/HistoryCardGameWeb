import { describe, expect, it } from "vitest";
import { areHexesAdjacent, createCatanBoard } from "./board";

const seededRandom = (seed = 123456) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x1_0000_0000;
};

describe("CATAN board topology", () => {
  it("tạo đúng 19 hex, 54 giao điểm, 72 cạnh, 30 cạnh biển và 9 cảng", () => {
    const board = createCatanBoard("fixed");
    expect(board.board).toHaveLength(19);
    expect(board.intersections).toHaveLength(54);
    expect(board.edges).toHaveLength(72);
    expect(board.edges.filter((edge) => edge.coastal)).toHaveLength(30);
    expect(board.harbors).toHaveLength(9);
    expect(board.harbors.filter((harbor) => harbor.kind === "generic")).toHaveLength(4);
    expect(new Set(board.harbors.map((harbor) => harbor.kind))).toEqual(new Set(["generic", "wood", "brick", "wool", "grain", "ore"]));
    expect(board.board.map((hex) => hex.token).filter((token): token is number => token !== null).sort((a, b) => a - b))
      .toEqual([2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12]);
    board.harbors.forEach((harbor) => {
      expect(board.edges.find((edge) => edge.id === harbor.edgeId)?.coastal).toBe(true);
      harbor.intersectionIds.forEach((id) => expect(board.intersections.find((entry) => entry.id === id)?.harborId).toBe(harbor.id));
    });
  });

  it("giữ quan hệ hex, cạnh và giao điểm hai chiều với ID ổn định", () => {
    const first = createCatanBoard("fixed");
    const second = createCatanBoard("fixed");
    expect(first.board.map((hex) => hex.id)).toEqual(second.board.map((hex) => hex.id));
    for (const hex of first.board) {
      expect(hex.intersectionIds).toHaveLength(6);
      expect(hex.edgeIds).toHaveLength(6);
      hex.intersectionIds.forEach((id) => expect(first.intersections.find((entry) => entry.id === id)?.adjacentHexIds).toContain(hex.id));
      hex.edgeIds.forEach((id) => expect(first.edges.find((entry) => entry.id === id)?.adjacentHexIds).toContain(hex.id));
    }
    for (const edge of first.edges) {
      expect(edge.intersectionIds).toHaveLength(2);
      edge.intersectionIds.forEach((id) => expect(first.intersections.find((entry) => entry.id === id)?.edgeIds).toContain(edge.id));
    }
  });

  it("tạo bản random đúng phân bố và không đặt 6 cạnh 8", () => {
    const topology = createCatanBoard("random", seededRandom());
    const counts = Object.fromEntries(["wood", "brick", "wool", "grain", "ore", "desert"].map((resource) =>
      [resource, topology.board.filter((hex) => hex.resource === resource).length]));
    expect(counts).toEqual({ wood: 4, brick: 3, wool: 4, grain: 4, ore: 3, desert: 1 });
    expect(topology.board.filter((hex) => hex.token !== null)).toHaveLength(18);
    for (const hex of topology.board.filter((entry) => entry.token === 6 || entry.token === 8)) {
      const adjacent = topology.board.filter((other) => areHexesAdjacent(hex, other));
      expect(adjacent.some((other) => other.token === 6 || other.token === 8)).toBe(false);
    }
  });
});
