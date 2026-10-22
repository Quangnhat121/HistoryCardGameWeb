import { describe, expect, it } from "vitest";
import { GameEngine } from "./GameEngine";
import { GameCard, GamePlayerInput } from "./types";
import { viewFor } from "./viewFor";
import { getTurnDurationMs } from "../config/turnTimer.config";

const players: GamePlayerInput[] = [
  { id: "A", name: "An" },
  { id: "B", name: "Bình" },
  { id: "C", name: "Chi" },
];
const years = [100, 50, 150, 80, 120, 40, 60, 140, 90, 110, 160, 30, 70, 130, 170, 20, 180, 190, 200, 210, 220, 230];
const cards: GameCard[] = years.map((year, index) => ({ cardId: index + 1, image: `/cards/${index + 1}.png`, event: `Sự kiện ${index + 1}`, year }));

const createEngine = () => {
  const engine = new GameEngine(() => 0.999999);
  engine.createGame(players, cards);
  return engine;
};

describe("GameEngine theo lượt hai bước", () => {
  it("xếp các sự kiện trùng năm theo tháng", () => {
    const sameYearCards: GameCard[] = [
      { cardId: 1, image: "/cards/root.png", event: "Sự kiện gốc", year: 1944 },
      { cardId: 2, image: "/cards/august.png", event: "Sự kiện tháng 8", year: 1945, month: 8 },
      ...Array.from({ length: 4 }, (_, index) => ({ cardId: index + 3, image: `/cards/${index + 3}.png`, event: `Sự kiện ${index + 3}`, year: 1950 + index })),
      { cardId: 7, image: "/cards/december.png", event: "Sự kiện tháng 12", year: 1945, month: 12 },
      ...Array.from({ length: 4 }, (_, index) => ({ cardId: index + 8, image: `/cards/${index + 8}.png`, event: `Sự kiện ${index + 8}`, year: 1960 + index })),
    ];
    const engine = new GameEngine(() => 0.999999);
    engine.createGame(players.slice(0, 2), sameYearCards);

    engine.placeCard("A", 2, 1);
    expect(engine.challenge("B", 2)).toMatchObject({ correct: true, year: 1945, month: 8 });
    engine.placeCard("B", 7, 2);
    expect(engine.challenge("A", 7)).toMatchObject({ correct: true, year: 1945, month: 12 });

    const view = viewFor(engine.state, "A");
    expect(view.timeline.find((card) => card.cardId === 7)).toMatchObject({ year: 1945, month: 12 });
  });

  it("A đặt, B khui đúng rồi B đặt, lượt chuyển tới C", () => {
    const engine = createEngine();
    engine.placeCard("A", 2, 0);
    expect(engine.state.currentPlayerIndex).toBe(1);

    expect(engine.challenge("B", 2).correct).toBe(true);
    expect(engine.state.currentPlayerIndex).toBe(1);
    expect(engine.state.hasChallengedThisTurn).toBe(true);
    engine.placeCard("B", 7, 1);

    expect(engine.state.players[engine.state.currentPlayerIndex].id).toBe("C");
    expect(engine.state.hasChallengedThisTurn).toBe(false);
  });

  it("A đặt, B khui sai rồi B đặt, lượt tới C và A không đi lại", () => {
    const engine = createEngine();
    engine.placeCard("A", 3, 0);
    expect(engine.challenge("B", 3).correct).toBe(false);

    expect(engine.state.players[engine.state.currentPlayerIndex].id).toBe("B");
    expect(engine.state.players[0].hand).toHaveLength(6);
    engine.placeCard("B", 7, 0);
    expect(engine.state.players[engine.state.currentPlayerIndex].id).toBe("C");
  });

  it("B không thể khui lần hai trong cùng lượt", () => {
    const engine = createEngine();
    engine.placeCard("A", 2, 0);
    engine.challenge("B", 2);
    expect(() => engine.challenge("B", 2)).toThrow("Mỗi lượt chỉ được khui tối đa một thẻ");
  });

  it("khui chỉ đúng cardId của lastPlaced", () => {
    const engine = createEngine();
    engine.placeCard("A", 2, 0);
    expect(() => engine.challenge("B", 3)).toThrow("Chỉ được khui thẻ vừa được đặt");
  });

  it("đặt thẻ cuối rồi người kế tiếp skipChallenge thì người đặt thắng", () => {
    const engine = createEngine();
    const turns: Array<[string, number]> = [
      ["A", 2], ["B", 7], ["C", 12], ["A", 3], ["B", 8], ["C", 13],
      ["A", 4], ["B", 9], ["C", 14], ["A", 5], ["B", 10], ["C", 15], ["A", 6],
    ];
    turns.forEach(([playerId, cardId]) => engine.placeCard(playerId, cardId, engine.state.timeline.length));

    expect(engine.state.phase).toBe("awaiting_verdict");
    expect(engine.state.winner).toBeNull();
    expect(() => engine.placeCard("B", 11, 0)).toThrow("Phải khui thẻ cuối hoặc chọn không khui");
    expect(engine.skipChallenge("B")).toBe("A");
    expect(engine.state).toMatchObject({ phase: "finished", winner: "A" });
  });

  it("khui sai thẻ cuối thì game tiếp tục và người khui vẫn phải đặt", () => {
    const engine = createEngine();
    const turns: Array<[string, number]> = [
      ["A", 2], ["B", 7], ["C", 12], ["A", 4], ["B", 8], ["C", 13],
      ["A", 5], ["B", 9], ["C", 14], ["A", 6], ["B", 10], ["C", 15],
    ];
    turns.forEach(([playerId, cardId]) => engine.placeCard(playerId, cardId, engine.state.timeline.length));
    engine.placeCard("A", 3, 0);

    expect(engine.challenge("B", 3).correct).toBe(false);
    expect(engine.state).toMatchObject({ phase: "turn", winner: null, currentPlayerIndex: 1 });
    expect(engine.state.players[0].hand).toHaveLength(2);
    engine.placeCard("B", 11, engine.state.timeline.length);
    expect(engine.state.players[engine.state.currentPlayerIndex].id).toBe("C");
  });

  it("viewFor chỉ lộ năm của thẻ gốc và thẻ đã khui đúng", () => {
    const engine = createEngine();
    engine.placeCard("A", 2, 0);
    let view = viewFor(engine.state, "B");
    expect(view.phase).toBe("turn");
    expect(view.hasChallengedThisTurn).toBe(false);
    expect(view.timeline.find((card) => card.cardId === 2)).not.toHaveProperty("year");
    expect(view.lastPlaced).not.toHaveProperty("year");
    expect(view.players.find((player) => player.id === "B")?.hand?.every((card) => !("year" in card))).toBe(true);

    engine.challenge("B", 2);
    view = viewFor(engine.state, "B");
    expect(view.timeline.find((card) => card.cardId === 2)).toHaveProperty("year", 50);
    expect(view.hasChallengedThisTurn).toBe(true);
  });
});

describe("đồng hồ lượt chơi", () => {
  it("chọn đúng thời lượng theo số thẻ trên hàng", () => {
    expect(getTurnDurationMs(1)).toBe(15_000);
    expect(getTurnDurationMs(7)).toBe(15_000);
    expect(getTurnDurationMs(8)).toBe(25_000);
    expect(getTurnDurationMs(16)).toBe(25_000);
    expect(getTurnDurationMs(17)).toBe(35_000);
  });

  it("khui thẻ cộng đúng 3 giây một lần", () => {
    let now = 1_000;
    const engine = new GameEngine(() => .999999, () => now);
    engine.createGame(players, cards);
    engine.placeCard("A", 2, 0);
    const deadlineBeforeChallenge = engine.state.turnDeadline;

    now += 400;
    engine.challenge("B", 2);
    expect(engine.state.turnDeadline).toBe((deadlineBeforeChallenge ?? 0) + 3_000);
    expect(engine.state.turnDurationMs).toBe(18_000);
  });

  it("hết giờ chỉ mất lượt, không bốc thẻ phạt", () => {
    let now = 5_000;
    const engine = new GameEngine(() => .999999, () => now);
    engine.createGame(players, cards);
    const handCounts = engine.state.players.map((player) => player.hand.length);
    const firstDeadline = engine.state.turnDeadline;

    now = firstDeadline ?? now;
    expect(() => engine.placeCard("A", 2, 0)).toThrow("Lượt chơi đã hết giờ");
    expect(engine.timeoutTurn()).toEqual({ timedOutPlayerId: "A", winner: null });
    expect(engine.state.players[engine.state.currentPlayerIndex].id).toBe("B");
    expect(engine.state.players.map((player) => player.hand.length)).toEqual(handCounts);
    expect(engine.state.turnDeadline).toBe(now + 15_000);
  });

  it("hết giờ khi chờ phán quyết thẻ cuối được tính là không khui", () => {
    const engine = createEngine();
    const turns: Array<[string, number]> = [
      ["A", 2], ["B", 7], ["C", 12], ["A", 3], ["B", 8], ["C", 13],
      ["A", 4], ["B", 9], ["C", 14], ["A", 5], ["B", 10], ["C", 15], ["A", 6],
    ];
    turns.forEach(([playerId, cardId]) => engine.placeCard(playerId, cardId, engine.state.timeline.length));

    expect(engine.state.phase).toBe("awaiting_verdict");
    expect(engine.timeoutTurn()).toEqual({ timedOutPlayerId: "B", winner: "A" });
    expect(engine.state).toMatchObject({ phase: "finished", winner: "A", turnDeadline: null });
  });
});
