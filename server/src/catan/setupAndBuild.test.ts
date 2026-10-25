import { describe, expect, it } from "vitest";
import { BUILD_COSTS, emptyResources } from "./constants";
import { CatanEngine } from "./CatanEngine";
import { CatanRuleError } from "./errors";
import { completeSetup, fixedEngine, TEST_PLAYERS } from "./testHelpers";
import type { CatanState, ResourceBundle } from "./types";

const richBundle = (): ResourceBundle => ({ wood: 10, brick: 10, wool: 10, grain: 10, ore: 10 });

describe("CATAN initial setup", () => {
  it("đặt theo vòng tiến rồi vòng ngược và phát tài nguyên từ settlement thứ hai", () => {
    const engine = fixedEngine();
    const order: string[] = [];
    while (engine.state?.phase === "setup") {
      const state = engine.state;
      const playerId = state!.currentPlayerId;
      order.push(playerId);
      const intersection = state!.intersections.find((candidate) =>
        !state!.buildings[candidate.id] && candidate.neighborIds.every((id) => !state!.buildings[id]))!;
      engine.placeInitialSettlement(playerId, intersection.id);
      const edge = engine.state!.intersections.find((entry) => entry.id === intersection.id)!.edgeIds.find((id) => !engine.state!.roads[id])!;
      engine.placeInitialRoad(playerId, edge);
    }
    expect(order).toEqual(["a", "b", "c", "c", "b", "a"]);
    const state = engine.state!;
    const secondA = Object.values(state.buildings).filter((building) => building.playerId === "a")[1];
    const adjacent = state.intersections.find((entry) => entry.id === secondA.intersectionId)!.adjacentHexIds
      .map((id) => state.board.find((hex) => hex.id === id)!)
      .filter((hex) => hex.resource !== "desert");
    const expected = emptyResources();
    adjacent.forEach((hex) => { if (hex.resource !== "desert") expected[hex.resource] += 1; });
    expect(state.players.find((player) => player.id === "a")!.resources).toEqual(expected);
    expect(state.players.every((player) => player.pieces.settlements === 3 && player.pieces.roads === 13)).toBe(true);
    expect(state.phase).toBe("roll");
    expect(state.currentPlayerId).toBe("a");
  });

  it("áp dụng distance rule ngay trong setup", () => {
    const engine = fixedEngine();
    const first = engine.state!.intersections[0];
    engine.placeInitialSettlement("a", first.id);
    engine.placeInitialRoad("a", first.edgeIds[0]);
    expect(() => engine.placeInitialSettlement("b", first.neighborIds[0])).toThrowError(CatanRuleError);
    try { engine.placeInitialSettlement("b", first.neighborIds[0]); } catch (error) {
      expect(error).toMatchObject({ code: "DISTANCE_RULE" });
    }
  });
});

describe("CATAN building", () => {
  const actionState = (): { engine: ReturnType<typeof fixedEngine>; state: CatanState } => {
    const engine = fixedEngine();
    const state = completeSetup(engine);
    state.phase = "action";
    state.currentPlayerId = "a";
    state.players.find((player) => player.id === "a")!.resources = richBundle();
    engine.restoreState(state);
    return { engine, state: engine.state! };
  };

  it("trừ đúng chi phí đường và không thay đổi state khi thiếu tài nguyên", () => {
    expect(BUILD_COSTS).toEqual({
      road: { wood: 1, brick: 1, wool: 0, grain: 0, ore: 0 },
      settlement: { wood: 1, brick: 1, wool: 1, grain: 1, ore: 0 },
      city: { wood: 0, brick: 0, wool: 0, grain: 2, ore: 3 },
      development: { wood: 0, brick: 0, wool: 1, grain: 1, ore: 1 },
    });
    const { engine } = actionState();
    const before = engine.state!;
    let builtEdge = "";
    for (const edge of before.edges.filter((candidate) => !before.roads[candidate.id])) {
      try { engine.buildRoad("a", edge.id); builtEdge = edge.id; break; } catch { /* find a connected edge */ }
    }
    expect(builtEdge).not.toBe("");
    const after = engine.state!;
    expect(after.players.find((player) => player.id === "a")!.resources.wood).toBe(9);
    expect(after.players.find((player) => player.id === "a")!.resources.brick).toBe(9);
    expect(after.bank.wood).toBe(before.bank.wood + BUILD_COSTS.road.wood);

    const poor = engine.state!;
    poor.players.find((player) => player.id === "a")!.resources = emptyResources();
    engine.restoreState(poor);
    const snapshot = engine.state!;
    const candidate = snapshot.edges.find((edge) => !snapshot.roads[edge.id])!;
    expect(() => engine.buildRoad("a", candidate.id)).toThrow();
    expect(engine.state).toEqual(snapshot);
  });

  it("xây settlement có kết nối, nâng cấp city và hoàn trả quân settlement", () => {
    const { engine } = actionState();
    const state = engine.state!;
    const location = state.intersections.find((intersection) =>
      !state.buildings[intersection.id] && intersection.neighborIds.every((id) => !state.buildings[id]))!;
    const connection = location.edgeIds[0];
    state.roads[connection] = { edgeId: connection, playerId: "a" };
    state.players.find((player) => player.id === "a")!.pieces.roads -= 1;
    engine.restoreState(state);
    const settlementsBefore = engine.state!.players.find((player) => player.id === "a")!.pieces.settlements;
    engine.buildSettlement("a", location.id);
    expect(engine.state!.buildings[location.id]).toMatchObject({ playerId: "a", kind: "settlement" });
    engine.upgradeCity("a", location.id);
    const player = engine.state!.players.find((entry) => entry.id === "a")!;
    expect(engine.state!.buildings[location.id].kind).toBe("city");
    expect(player.pieces.settlements).toBe(settlementsBefore);
    expect(player.pieces.cities).toBe(3);
  });

  it("không cho xây khi đã hết quân cờ", () => {
    const { engine } = actionState();
    let state = engine.state!;
    let candidate = "";
    for (const edge of state.edges.filter((entry) => !state.roads[entry.id])) {
      const probe = new CatanEngine({ boardMode: "fixed" });
      probe.restoreState(state);
      try { probe.buildRoad("a", edge.id); candidate = edge.id; break; } catch { /* find connected edge */ }
    }
    expect(candidate).not.toBe("");
    state = engine.state!;
    state.players.find((player) => player.id === "a")!.pieces.roads = 0;
    engine.restoreState(state);
    expect(() => engine.buildRoad("a", candidate)).toThrow();
    try { engine.buildRoad("a", candidate); } catch (error) { expect(error).toMatchObject({ code: "PIECE_LIMIT" }); }
  });
});
