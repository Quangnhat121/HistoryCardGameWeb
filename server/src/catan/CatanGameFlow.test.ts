import { describe, expect, it } from "vitest";
import { CatanEngine } from "./CatanEngine";
import { TEST_PLAYERS } from "./testHelpers";

describe("CATAN sample game flow", () => {
  it("chạy từ setup rắn, nhận tài nguyên ban đầu, roll, build và chuyển lượt", () => {
    const engine = new CatanEngine({ boardMode: "fixed", diceRoller: () => 2 });
    engine.createGame(TEST_PLAYERS);
    while (engine.state!.phase === "setup") {
      const state = engine.state!;
      const playerId = state.currentPlayerId;
      const isSecondA = playerId === "a" && Object.values(state.buildings).filter((building) => building.playerId === "a").length === 1;
      const candidates = state.intersections.filter((intersection) => {
        if (state.buildings[intersection.id] || intersection.neighborIds.some((id) => state.buildings[id])) return false;
        if (!isSecondA) return true;
        const terrains = intersection.adjacentHexIds.map((id) => state.board.find((hex) => hex.id === id)!.resource);
        return terrains.includes("wood") && terrains.includes("brick");
      });
      let selected = "";
      for (const intersection of candidates) {
        try { engine.placeInitialSettlement(playerId, intersection.id); selected = intersection.id; break; } catch { /* try next */ }
      }
      expect(selected).not.toBe("");
      const edge = engine.state!.intersections.find((entry) => entry.id === selected)!.edgeIds.find((id) => !engine.state!.roads[id])!;
      engine.placeInitialRoad(playerId, edge);
    }

    expect(engine.state!.currentPlayerId).toBe("a");
    const playerA = engine.state!.players.find((player) => player.id === "a")!;
    expect(playerA.resources.wood).toBeGreaterThanOrEqual(1);
    expect(playerA.resources.brick).toBeGreaterThanOrEqual(1);
    engine.rollDice("a");
    expect(engine.state!.phase).toBe("action");
    let roadBuilt = false;
    for (const edge of engine.state!.edges.filter((candidate) => !engine.state!.roads[candidate.id])) {
      try { engine.buildRoad("a", edge.id); roadBuilt = true; break; } catch { /* try next connected edge */ }
    }
    expect(roadBuilt).toBe(true);
    engine.endTurn("a");
    expect(engine.state!).toMatchObject({ currentPlayerId: "b", phase: "roll", turnNumber: 2 });
    engine.rollDice("b");
    engine.endTurn("b");
    expect(engine.state!).toMatchObject({ currentPlayerId: "c", phase: "roll", turnNumber: 3 });
  });
});
