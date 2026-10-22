import { getTurnDurationMs, TURN_TIMER_CONFIG } from "../config/turnTimer.config";
import { ChallengeResult, GameCard, GamePlayerInput, GameState, TurnTimeoutResult } from "./types";

const INITIAL_HAND_SIZE = 5;

const compareChronology = (first: GameCard, second: GameCard): number =>
  first.year - second.year || (first.month ?? 0) - (second.month ?? 0);

export class GameEngine {
  private gameState: GameState | null = null;
  public constructor(
    private readonly random: () => number = Math.random,
    private readonly now: () => number = Date.now,
  ) {}

  public get state(): GameState {
    if (!this.gameState) throw new Error("Ván chơi chưa được khởi tạo");
    return this.gameState;
  }

  public createGame(players: GamePlayerInput[], cards: GameCard[]): GameState {
    this.validateSetup(players, cards);
    const shuffledCards = this.shuffle(cards);
    const rootCard = shuffledCards.shift();
    if (!rootCard) throw new Error("Không có thẻ gốc");
    this.gameState = {
      players: players.map((player) => ({ ...player, hand: shuffledCards.splice(0, INITIAL_HAND_SIZE) })),
      rootCard,
      timeline: [{ card: rootCard, revealed: true, placedBy: null, isRoot: true }],
      drawPile: shuffledCards,
      currentPlayerIndex: 0,
      lastPlaced: null,
      hasChallengedThisTurn: false,
      pendingWinnerId: null,
      winner: null,
      phase: "turn",
      turnNumber: 1,
      turnDeadline: null,
      turnDurationMs: 0,
    };
    this.startTurnTimer(this.gameState);
    return this.gameState;
  }

  public challenge(playerId: string, cardId: number): ChallengeResult {
    const state = this.state;
    this.assertNotFinished(state);
    this.assertCurrentPlayer(state, playerId);
    this.assertBeforeDeadline(state);
    if (state.hasChallengedThisTurn) throw new Error("Mỗi lượt chỉ được khui tối đa một thẻ");
    const lastPlaced = state.lastPlaced;
    if (!lastPlaced) throw new Error("Không có thẻ vừa đặt để khui");
    if (lastPlaced.card.cardId !== cardId) throw new Error("Chỉ được khui thẻ vừa được đặt");

    const timelineIndex = state.timeline.findIndex((entry) => entry.card.cardId === cardId);
    if (timelineIndex === -1) throw new Error("Không tìm thấy thẻ vừa đặt trên timeline");
    const left = state.timeline[timelineIndex - 1]?.card;
    const right = state.timeline[timelineIndex + 1]?.card;
    const correct = (!left || compareChronology(left, lastPlaced.card) < 0) &&
      (!right || compareChronology(lastPlaced.card, right) < 0);

    if (correct) {
      state.timeline[timelineIndex].revealed = true;
      this.drawCard(state, playerId);
      if (state.phase === "awaiting_verdict") {
        state.winner = state.pendingWinnerId;
        state.pendingWinnerId = null;
        state.phase = "finished";
      }
    } else {
      const placer = state.players.find((player) => player.id === lastPlaced.playerId);
      if (!placer) throw new Error("Không tìm thấy người đã đặt thẻ");
      state.timeline.splice(timelineIndex, 1);
      placer.hand.push(lastPlaced.card);
      this.drawCard(state, placer.id);
      state.pendingWinnerId = null;
      state.phase = "turn";
    }

    const result = { cardId, year: lastPlaced.card.year, month: lastPlaced.card.month, correct, winner: state.winner };
    state.lastPlaced = null;
    state.hasChallengedThisTurn = true;
    if (state.phase === "finished") this.clearTurnTimer(state);
    else this.extendTurnTimer(state, TURN_TIMER_CONFIG.challengeExtensionMs);
    return result;
  }

  public skipChallenge(playerId: string): string {
    const state = this.state;
    this.assertNotFinished(state);
    this.assertCurrentPlayer(state, playerId);
    this.assertBeforeDeadline(state);
    if (state.phase !== "awaiting_verdict" || !state.pendingWinnerId)
      throw new Error("Chỉ được bỏ qua khui khi đang chờ phán quyết thẻ cuối");
    state.winner = state.pendingWinnerId;
    state.pendingWinnerId = null;
    state.lastPlaced = null;
    state.phase = "finished";
    this.clearTurnTimer(state);
    return state.winner;
  }

  public placeCard(playerId: string, cardId: number, index: number): void {
    const state = this.state;
    this.assertNotFinished(state);
    this.assertCurrentPlayer(state, playerId);
    this.assertBeforeDeadline(state);
    if (state.phase === "awaiting_verdict")
      throw new Error("Phải khui thẻ cuối hoặc chọn không khui trước khi đặt thẻ");
    if (!Number.isInteger(index) || index < 0 || index > state.timeline.length)
      throw new Error(`Vị trí chèn phải từ 0 đến ${state.timeline.length}`);
    const player = state.players[state.currentPlayerIndex];
    const cardIndex = player.hand.findIndex((card) => card.cardId === cardId);
    if (cardIndex === -1) throw new Error("Thẻ không có trong tay người chơi");
    const [card] = player.hand.splice(cardIndex, 1);
    state.timeline.splice(index, 0, { card, revealed: false, placedBy: playerId, isRoot: false });
    state.lastPlaced = { card, index, playerId };
    state.hasChallengedThisTurn = false;
    state.pendingWinnerId = player.hand.length === 0 ? playerId : null;
    state.phase = player.hand.length === 0 ? "awaiting_verdict" : "turn";
    this.advanceTurn(state);
  }

  public timeoutTurn(): TurnTimeoutResult {
    const state = this.state;
    this.assertNotFinished(state);
    const timedOutPlayerId = state.players[state.currentPlayerIndex].id;

    if (state.phase === "awaiting_verdict" && state.pendingWinnerId) {
      state.winner = state.pendingWinnerId;
      state.pendingWinnerId = null;
      state.lastPlaced = null;
      state.phase = "finished";
      this.clearTurnTimer(state);
      return { timedOutPlayerId, winner: state.winner };
    }

    state.hasChallengedThisTurn = false;
    this.advanceTurn(state);
    return { timedOutPlayerId, winner: null };
  }

  public resetTurnTimer(): void {
    if (this.state.phase !== "finished") this.startTurnTimer(this.state);
  }

  public removePlayer(playerId: string): void {
    const state = this.state;
    const playerIndex = state.players.findIndex((player) => player.id === playerId);
    if (playerIndex === -1) throw new Error("Người chơi không tồn tại trong ván");
    const [player] = state.players.splice(playerIndex, 1);
    state.drawPile.push(...player.hand);
    if (state.lastPlaced?.playerId === playerId) state.lastPlaced = null;
    if (state.pendingWinnerId === playerId) { state.pendingWinnerId = null; state.phase = "turn"; }
    if (state.winner === playerId) state.winner = null;
    if (state.players.length === 0) state.currentPlayerIndex = 0;
    else if (playerIndex < state.currentPlayerIndex) state.currentPlayerIndex -= 1;
    else if (state.currentPlayerIndex >= state.players.length) state.currentPlayerIndex = 0;
  }

  private validateSetup(players: GamePlayerInput[], cards: GameCard[]): void {
    if (players.length < 2 || players.length > 4) throw new Error("Phòng chơi phải có từ 2 đến 4 người");
    const playerIds = new Set(players.map((player) => player.id));
    if (playerIds.size !== players.length || players.some((player) => !player.id)) throw new Error("Mỗi người chơi phải có id duy nhất và không rỗng");
    const requiredCards = 1 + players.length * INITIAL_HAND_SIZE;
    if (cards.length < requiredCards) throw new Error(`Cần ít nhất ${requiredCards} thẻ để bắt đầu ván chơi`);
    if (new Set(cards.map((card) => card.cardId)).size !== cards.length) throw new Error("Danh sách thẻ có cardId bị trùng");
  }

  private shuffle(cards: GameCard[]): GameCard[] {
    const result = cards.map((card) => ({ ...card }));
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(this.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  }

  private assertNotFinished(state: GameState): void {
    if (state.phase === "finished") throw new Error("Ván chơi đã kết thúc");
  }
  private assertCurrentPlayer(state: GameState, playerId: string): void {
    if (state.players[state.currentPlayerIndex].id !== playerId) throw new Error("Chưa đến lượt người chơi");
  }
  private assertBeforeDeadline(state: GameState): void {
    if (state.turnDeadline !== null && this.now() >= state.turnDeadline)
      throw new Error("Lượt chơi đã hết giờ");
  }
  private drawCard(state: GameState, playerId: string): void {
    const card = state.drawPile.shift();
    if (!card) return;
    const player = state.players.find((entry) => entry.id === playerId);
    if (!player) throw new Error("Không tìm thấy người chơi để bốc thẻ");
    player.hand.push(card);
  }
  private advanceTurn(state: GameState): void {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    state.turnNumber += 1;
    state.hasChallengedThisTurn = false;
    this.startTurnTimer(state);
  }
  private startTurnTimer(state: GameState): void {
    state.turnDurationMs = getTurnDurationMs(state.timeline.length);
    state.turnDeadline = this.now() + state.turnDurationMs;
  }
  private extendTurnTimer(state: GameState, extensionMs: number): void {
    if (state.turnDeadline === null) return;
    state.turnDeadline += extensionMs;
    state.turnDurationMs += extensionMs;
  }
  private clearTurnTimer(state: GameState): void {
    state.turnDeadline = null;
    state.turnDurationMs = 0;
  }
}
