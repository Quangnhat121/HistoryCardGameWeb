import { describe, expect, it } from "vitest";
import { emptyResources } from "./constants";
import { calculateProductionDemand, resolveProduction } from "./resourceDistribution";
import { completeSetup, fixedEngine } from "./testHelpers";
import type { ResourceBundle } from "./types";

const bundle = (overrides: Partial<ResourceBundle>): ResourceBundle => ({ ...emptyResources(), ...overrides });

describe("CATAN resource production", () => {
  it("settlement nhận 1, city nhận 2 và robber chặn cả ô", () => {
    const dice = [2, 2];
    const engine = fixedEngine(() => dice.shift() ?? 2);
    const state = completeSetup(engine);
    const target = state.board.find((hex) => hex.token === 4)!;
    state.buildings = {
      [target.intersectionIds[0]]: { intersectionId: target.intersectionIds[0], playerId: "a", kind: "settlement" },
      [target.intersectionIds[2]]: { intersectionId: target.intersectionIds[2], playerId: "b", kind: "city" },
    };
    state.players.forEach((player) => { player.resources = emptyResources(); });
    state.phase = "roll";
    state.currentPlayerId = "a";
    engine.restoreState(state);
    engine.rollDice("a");
    const produced = engine.state!;
    const resource = target.resource;
    if (resource === "desert") throw new Error("Token không thể nằm trên sa mạc");
    expect(produced.players.find((player) => player.id === "a")!.resources[resource]).toBe(1);
    expect(produced.players.find((player) => player.id === "b")!.resources[resource]).toBe(2);

    const blockedEngine = fixedEngine(() => 2);
    const blocked = completeSetup(blockedEngine);
    blocked.buildings = state.buildings;
    blocked.players.forEach((player) => { player.resources = emptyResources(); });
    blocked.robberHexId = target.id;
    blocked.phase = "roll";
    blocked.currentPlayerId = "a";
    blockedEngine.restoreState(blocked);
    blockedEngine.rollDice("a");
    expect(blockedEngine.state!.players.every((player) => player.resources[resource] === 0)).toBe(true);
  });

  it("không phát loại tài nguyên thiếu cho nhiều người nhưng cấp phần còn lại nếu chỉ một người bị ảnh hưởng", () => {
    const state = fixedEngine().state!;
    const target = state.board.find((hex) => hex.resource !== "desert" && hex.token !== null)!;
    const resource = target.resource;
    if (resource === "desert") throw new Error("Expected productive hex");
    state.buildings = {
      [target.intersectionIds[0]]: { intersectionId: target.intersectionIds[0], playerId: "a", kind: "city" },
      [target.intersectionIds[2]]: { intersectionId: target.intersectionIds[2], playerId: "b", kind: "city" },
    };
    const demand = calculateProductionDemand(state, target.token!);
    const scarceBank = { ...state.bank, [resource]: 3 };
    expect(resolveProduction(scarceBank, demand).a[resource]).toBe(0);
    expect(resolveProduction(scarceBank, demand).b[resource]).toBe(0);

    delete state.buildings[target.intersectionIds[2]];
    const onePlayerDemand = calculateProductionDemand(state, target.token!);
    expect(resolveProduction({ ...state.bank, [resource]: 1 }, onePlayerDemand).a[resource]).toBe(1);
  });
});

describe("rolling 7 and robber", () => {
  it("bắt người có trên 7 thẻ bỏ một nửa làm tròn xuống trước khi di chuyển robber", () => {
    const dice = [3, 4];
    const engine = fixedEngine(() => dice.shift() ?? 1);
    const state = completeSetup(engine);
    state.players.find((player) => player.id === "a")!.resources = bundle({ wood: 9 });
    state.players.find((player) => player.id === "b")!.resources = bundle({ brick: 8 });
    state.players.find((player) => player.id === "c")!.resources = bundle({ wool: 7 });
    state.phase = "roll";
    state.currentPlayerId = "a";
    engine.restoreState(state);
    engine.rollDice("a");
    expect(engine.state!.phase).toBe("discard");
    expect(engine.state!.pendingDiscards).toEqual({ a: 4, b: 4 });
    expect(() => engine.discardResources("a", bundle({ wood: 3 }))).toThrow();
    engine.discardResources("a", bundle({ wood: 4 }));
    engine.discardResources("b", bundle({ brick: 4 }));
    expect(engine.state!.phase).toBe("robber");
    const emptyHex = engine.state!.board.find((hex) => hex.id !== engine.state!.robberHexId
      && hex.intersectionIds.every((id) => !engine.state!.buildings[id]))!;
    engine.moveRobber("a", emptyHex.id);
    expect(engine.state!.phase).toBe("action");
    expect(engine.state!.robberHexId).toBe(emptyHex.id);
  });

  it("buộc robber đổi ô và chỉ cướp nạn nhân hợp lệ", () => {
    const engine = fixedEngine();
    const state = completeSetup(engine);
    const victimBuilding = Object.values(state.buildings).find((building) => building.playerId === "b")!;
    const target = state.board.find((hex) => hex.intersectionIds.includes(victimBuilding.intersectionId) && hex.id !== state.robberHexId)!;
    state.players.find((player) => player.id === "b")!.resources = bundle({ ore: 1 });
    state.players.find((player) => player.id === "a")!.resources = emptyResources();
    state.phase = "robber";
    state.currentPlayerId = "a";
    state.robberReturnPhase = "action";
    engine.restoreState(state);
    expect(() => engine.moveRobber("a", state.robberHexId)).toThrow();
    engine.moveRobber("a", target.id, "b");
    expect(engine.state!.players.find((player) => player.id === "a")!.resources.ore).toBe(1);
    expect(engine.state!.players.find((player) => player.id === "b")!.resources.ore).toBe(0);
  });
});
