import { describe, expect, it } from "vitest";
import { CatanEngine } from "./CatanEngine";

const players = [
  { id: "a", name: "An" },
  { id: "b", name: "Bình" },
  { id: "c", name: "Chi" },
];

describe("CatanEngine", () => {
  it("khởi tạo bàn 19 ô với đúng phân bố tài nguyên", () => {
    const state = new CatanEngine(() => 0.42).createGame(players);
    expect(state.board).toHaveLength(19);
    expect(state.board.filter((hex) => hex.resource === "desert")).toHaveLength(1);
    expect(state.board.filter((hex) => hex.token === null)).toHaveLength(1);
    expect(state.players).toHaveLength(3);
    expect(state.phase).toBe("setup");
  });

  it("từ chối số người chơi ngoài 3–4", () => {
    expect(() => new CatanEngine().createGame(players.slice(0, 2))).toThrow("3 đến 4");
  });

  it("trả vị trí hợp lệ cho giao diện theo đúng phase và người chơi", () => {
    const engine = new CatanEngine({ boardMode: "fixed" });
    engine.createGame(players);
    const settlements = engine.getLegalTargets("a", "settlement");
    expect(settlements).toHaveLength(54);
    expect(engine.getLegalTargets("b", "settlement")).toHaveLength(0);
    expect(engine.getAvailableActions("a").development).toBe(false);
    engine.placeInitialSettlement("a", settlements[0]);
    const roads = engine.getLegalTargets("a", "road");
    expect(roads.length).toBeGreaterThan(0);
    expect(roads.every((id) => engine.state!.edges.find((edge) => edge.id === id)!.intersectionIds.includes(settlements[0]))).toBe(true);
    expect(engine.getLegalTargets("a", "settlement")).toHaveLength(0);
  });
});
