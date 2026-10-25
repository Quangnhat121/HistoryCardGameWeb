import { describe, expect, it } from "vitest";
import { CatanEngine } from "./CatanEngine";
import { emptyResources } from "./constants";
import { calculateLongestRoad, resolveLargestArmyHolder, resolveLongestRoadHolder } from "./longestRoad";
import { completeSetup, findEdgePath, fixedEngine, TEST_PLAYERS } from "./testHelpers";
import { catanViewFor } from "./viewFor";

describe("CATAN longest road and largest army", () => {
  it("tính đường dài nhất bằng graph trail và bị cắt bởi settlement đối thủ", () => {
    const state = fixedEngine().state!;
    const path = findEdgePath(state, 6);
    path.forEach((edgeId) => { state.roads[edgeId] = { edgeId, playerId: "a" }; });
    expect(calculateLongestRoad(state, "a")).toBe(6);
    const left = state.edges.find((edge) => edge.id === path[2])!;
    const right = state.edges.find((edge) => edge.id === path[3])!;
    const cut = left.intersectionIds.find((id) => right.intersectionIds.includes(id))!;
    state.buildings[cut] = { intersectionId: cut, playerId: "b", kind: "settlement" };
    expect(calculateLongestRoad(state, "a")).toBe(3);
  });

  it("giữ chủ cũ khi hòa và bỏ danh hiệu khi chủ cũ không còn dẫn đầu duy nhất", () => {
    expect(resolveLongestRoadHolder({ a: 5, b: 5, c: 3 }, "a")).toBe("a");
    expect(resolveLongestRoadHolder({ a: 4, b: 6, c: 6 }, "a")).toBeNull();
    expect(resolveLongestRoadHolder({ a: 5, b: 4, c: 2 }, null)).toBe("a");
    expect(resolveLargestArmyHolder({ a: 3, b: 3, c: 1 }, "a")).toBe("a");
    expect(resolveLargestArmyHolder({ a: 3, b: 4, c: 4 }, "a")).toBeNull();
  });

  it("trao Largest Army khi lá hiệp sĩ thứ ba được chơi", () => {
    const engine = fixedEngine();
    const state = completeSetup(engine);
    state.phase = "action";
    state.currentPlayerId = "a";
    const player = state.players.find((entry) => entry.id === "a")!;
    player.playedKnights = 2;
    player.developmentCards.push({ id: "third-knight", type: "knight", purchasedTurn: 0, played: false });
    engine.restoreState(state);
    engine.playDevelopmentCard("a", "third-knight");
    expect(engine.state!.largestArmy).toMatchObject({ holderId: "a" });
    expect(engine.state!.phase).toBe("robber");
  });
});

describe("CATAN secret score and victory", () => {
  it("ẩn tài nguyên, loại development card và điểm thắng bí mật khỏi đối thủ", () => {
    const state = fixedEngine().state!;
    const player = state.players.find((entry) => entry.id === "b")!;
    player.resources.ore = 4;
    player.developmentCards.push({ id: "secret-vp", type: "victory_point", purchasedTurn: 0, played: false });
    player.hiddenVictoryPoints = 1;
    const opponentView = catanViewFor(state, "a").players.find((entry) => entry.id === "b")!;
    const selfView = catanViewFor(state, "b").players.find((entry) => entry.id === "b")!;
    expect(opponentView.resources).toBeUndefined();
    expect(opponentView.developmentCards).toBeUndefined();
    expect(opponentView.victoryPoints).toBe(player.publicVictoryPoints);
    expect(selfView.privateVictoryPoints).toBe(player.publicVictoryPoints + 1);
    expect(selfView.developmentCards?.[0].type).toBe("victory_point");
  });

  it("chỉ thắng từ 10 điểm trong lượt của chính mình, kể cả VP vừa mua", () => {
    const engine = new CatanEngine({ boardMode: "fixed", developmentDeck: ["victory_point"] });
    engine.createGame(TEST_PLAYERS);
    const state = completeSetup(engine);
    state.phase = "action";
    state.currentPlayerId = "a";
    state.buildings = {};
    state.intersections.slice(0, 4).forEach((intersection) => {
      state.buildings[intersection.id] = { intersectionId: intersection.id, playerId: "a", kind: "city" };
    });
    const player = state.players.find((entry) => entry.id === "a")!;
    player.resources = { ...emptyResources(), ore: 1, wool: 1, grain: 1 };
    player.developmentCards.push({ id: "existing-vp", type: "victory_point", purchasedTurn: 0, played: false });
    engine.restoreState(state);
    engine.buyDevelopmentCard("a");
    expect(engine.state!.winner).toBe("a");
    expect(engine.state!.phase).toBe("finished");

    const waitingEngine = fixedEngine();
    const waiting = completeSetup(waitingEngine);
    waiting.phase = "action";
    waiting.currentPlayerId = "a";
    waiting.buildings = {};
    waiting.intersections.slice(0, 5).forEach((intersection) => {
      waiting.buildings[intersection.id] = { intersectionId: intersection.id, playerId: "b", kind: "city" };
    });
    waitingEngine.restoreState(waiting);
    expect(waitingEngine.checkVictory("b")).toBe(false);
    waitingEngine.endTurn("a");
    expect(waitingEngine.state!.winner).toBe("b");
  });
});
