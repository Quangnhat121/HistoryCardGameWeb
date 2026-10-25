import { describe, expect, it } from "vitest";
import { DEVELOPMENT_DECK, emptyResources } from "./constants";
import { CatanEngine } from "./CatanEngine";
import { completeSetup, fixedEngine, TEST_PLAYERS } from "./testHelpers";
import type { DevelopmentCardType, ResourceBundle } from "./types";

const bundle = (values: Partial<ResourceBundle>): ResourceBundle => ({ ...emptyResources(), ...values });

const actionEngine = (): CatanEngine => {
  const engine = fixedEngine();
  const state = completeSetup(engine);
  state.phase = "action";
  state.currentPlayerId = "a";
  state.players.forEach((player) => { player.resources = emptyResources(); });
  engine.restoreState(state);
  return engine;
};

describe("CATAN trading", () => {
  it("hỗ trợ tỷ lệ ngân hàng 4:1, cảng tổng hợp 3:1 và cảng chuyên biệt 2:1", () => {
    const engine = actionEngine();
    let state = engine.state!;
    state.buildings = {};
    state.players.find((player) => player.id === "a")!.resources = bundle({ wood: 9 });
    engine.restoreState(state);
    engine.maritimeTrade("a", "wood", "ore");
    expect(engine.state!.players.find((player) => player.id === "a")!.resources).toMatchObject({ wood: 5, ore: 1 });

    state = engine.state!;
    const generic = state.harbors.find((harbor) => harbor.kind === "generic")!;
    state.buildings[generic.intersectionIds[0]] = { intersectionId: generic.intersectionIds[0], playerId: "a", kind: "settlement" };
    engine.restoreState(state);
    engine.maritimeTrade("a", "wood", "grain");
    expect(engine.state!.players.find((player) => player.id === "a")!.resources).toMatchObject({ wood: 2, grain: 1 });

    state = engine.state!;
    const woodPort = state.harbors.find((harbor) => harbor.kind === "wood")!;
    state.buildings[woodPort.intersectionIds[0]] = { intersectionId: woodPort.intersectionIds[0], playerId: "a", kind: "settlement" };
    engine.restoreState(state);
    engine.maritimeTrade("a", "wood", "brick");
    expect(engine.state!.players.find((player) => player.id === "a")!.resources).toMatchObject({ wood: 0, brick: 1 });
  });

  it("mô hình hóa đề nghị, xác nhận, từ chối/hủy và kiểm tra lại tài nguyên khi accept", () => {
    const engine = actionEngine();
    let state = engine.state!;
    state.players.find((player) => player.id === "a")!.resources = bundle({ wood: 2 });
    state.players.find((player) => player.id === "b")!.resources = bundle({ brick: 2 });
    engine.restoreState(state);
    const offer = engine.createTradeOffer("a", "b", bundle({ wood: 1 }), bundle({ brick: 1 }));
    state = engine.state!;
    state.players.find((player) => player.id === "a")!.resources.wood = 0;
    engine.restoreState(state);
    expect(() => engine.acceptTrade("b", offer.id)).toThrow();
    expect(engine.state!.tradeOffers.find((entry) => entry.id === offer.id)?.status).toBe("open");

    state = engine.state!;
    state.players.find((player) => player.id === "a")!.resources.wood = 2;
    engine.restoreState(state);
    engine.acceptTrade("b", offer.id);
    expect(engine.state!.players.find((player) => player.id === "a")!.resources).toMatchObject({ wood: 1, brick: 1 });
    expect(engine.state!.players.find((player) => player.id === "b")!.resources).toMatchObject({ wood: 1, brick: 1 });

    const second = engine.createTradeOffer("a", "c", bundle({ wood: 1 }), bundle({ ore: 1 }));
    engine.rejectTrade("c", second.id);
    expect(engine.state!.tradeOffers.find((entry) => entry.id === second.id)?.status).toBe("rejected");

    state = engine.state!;
    state.players.find((player) => player.id === "b")!.resources.brick = 2;
    state.players.find((player) => player.id === "a")!.resources.wood = 2;
    engine.restoreState(state);
    const counterOffer = engine.createTradeOffer("b", "a", bundle({ brick: 1 }), bundle({ wood: 1 }));
    engine.acceptTrade("a", counterOffer.id);
    expect(engine.state!.tradeOffers.find((entry) => entry.id === counterOffer.id)?.status).toBe("accepted");
  });
});

const engineWithCard = (type: DevelopmentCardType): CatanEngine => {
  const engine = actionEngine();
  const state = engine.state!;
  state.players.find((player) => player.id === "a")!.developmentCards.push({ id: `test:${type}`, type, purchasedTurn: 0, played: false });
  engine.restoreState(state);
  return engine;
};

describe("CATAN development cards", () => {
  it("có đúng bộ 25 thẻ và cấm dùng thẻ vừa mua", () => {
    expect(DEVELOPMENT_DECK).toHaveLength(25);
    expect(DEVELOPMENT_DECK.filter((card) => card === "knight")).toHaveLength(14);
    expect(DEVELOPMENT_DECK.filter((card) => card === "victory_point")).toHaveLength(5);
    expect(DEVELOPMENT_DECK.filter((card) => card === "road_building")).toHaveLength(2);
    expect(DEVELOPMENT_DECK.filter((card) => card === "year_of_plenty")).toHaveLength(2);
    expect(DEVELOPMENT_DECK.filter((card) => card === "monopoly")).toHaveLength(2);
    const engine = new CatanEngine({ boardMode: "fixed", developmentDeck: ["knight"] });
    engine.createGame(TEST_PLAYERS);
    const state = completeSetup(engine);
    state.phase = "action";
    state.currentPlayerId = "a";
    state.players.find((player) => player.id === "a")!.resources = bundle({ ore: 1, wool: 1, grain: 1 });
    engine.restoreState(state);
    const purchase = engine.buyDevelopmentCard("a");
    expect(() => engine.playDevelopmentCard("a", purchase.cardId)).toThrow();
  });

  it("Năm sung túc lấy đúng 2 thẻ và chỉ cho dùng một development card mỗi lượt", () => {
    const engine = engineWithCard("year_of_plenty");
    let state = engine.state!;
    state.players.find((player) => player.id === "a")!.developmentCards.push({ id: "test:monopoly", type: "monopoly", purchasedTurn: 0, played: false });
    engine.restoreState(state);
    engine.playDevelopmentCard("a", "test:year_of_plenty", { resources: ["ore", "ore"] });
    expect(engine.state!.players.find((player) => player.id === "a")!.resources.ore).toBe(2);
    expect(() => engine.playDevelopmentCard("a", "test:monopoly", { resource: "wood" })).toThrow();
  });

  it("Độc quyền lấy toàn bộ một loại tài nguyên từ đối thủ", () => {
    const engine = engineWithCard("monopoly");
    const state = engine.state!;
    state.players.find((player) => player.id === "b")!.resources.wood = 3;
    state.players.find((player) => player.id === "c")!.resources.wood = 2;
    engine.restoreState(state);
    engine.playDevelopmentCard("a", "test:monopoly", { resource: "wood" });
    expect(engine.state!.players.find((player) => player.id === "a")!.resources.wood).toBe(5);
    expect(engine.state!.players.filter((player) => player.id !== "a").every((player) => player.resources.wood === 0)).toBe(true);
  });

  it("Hiệp sĩ buộc di chuyển robber; Xây đường đặt tối đa 2 đường miễn phí theo luật nối đường", () => {
    const knight = engineWithCard("knight");
    knight.playDevelopmentCard("a", "test:knight");
    expect(knight.state!.phase).toBe("robber");
    expect(knight.state!.players.find((player) => player.id === "a")!.playedKnights).toBe(1);

    const roads = engineWithCard("road_building");
    const beforeWood = roads.state!.players.find((player) => player.id === "a")!.resources.wood;
    roads.playDevelopmentCard("a", "test:road_building");
    expect(roads.state!.phase).toBe("road_building");
    for (let count = 0; count < 2; count += 1) {
      const state = roads.state!;
      let placed = false;
      for (const edge of state.edges.filter((candidate) => !state.roads[candidate.id])) {
        try { roads.buildRoad("a", edge.id); placed = true; break; } catch { /* try next */ }
      }
      expect(placed).toBe(true);
    }
    expect(roads.state!.phase).toBe("action");
    expect(roads.state!.players.find((player) => player.id === "a")!.resources.wood).toBe(beforeWood);
  });
});
