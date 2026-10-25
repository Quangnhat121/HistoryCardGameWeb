import { createCatanBoard, shuffle } from "./board";
import { BUILD_COSTS, DEVELOPMENT_DECK, emptyResources, PLAYER_COLORS } from "./constants";
import { CatanRuleError, ruleError } from "./errors";
import { calculateLongestRoad, resolveLargestArmyHolder, resolveLongestRoadHolder } from "./longestRoad";
import { calculateProductionDemand, resolveProduction } from "./resourceDistribution";
import {
  CATAN_RESOURCES,
  type CatanEdge,
  type CatanGameOptions,
  type CatanPhase,
  type CatanPlayer,
  type CatanPlayerInput,
  type CatanResource,
  type CatanState,
  type DevelopmentCardType,
  type ResourceBundle,
  type TradeOffer,
} from "./types";

const clone = <T>(value: T): T => structuredClone(value);
const totalResources = (bundle: ResourceBundle): number => CATAN_RESOURCES.reduce((sum, resource) => sum + bundle[resource], 0);
const isEmptyBundle = (bundle: ResourceBundle): boolean => totalResources(bundle) === 0;

const validateBundle = (bundle: ResourceBundle): void => {
  if (CATAN_RESOURCES.some((resource) => !Number.isInteger(bundle[resource]) || bundle[resource] < 0)) {
    ruleError("INVALID_TRADE", "Số lượng tài nguyên phải là số nguyên không âm");
  }
};

export class CatanEngine {
  private _state: CatanState | null = null;
  private readonly random: () => number;
  private readonly diceRoller: () => number;
  private readonly boardMode: "fixed" | "random";
  private readonly configuredDevelopmentDeck?: DevelopmentCardType[];

  constructor(options: CatanGameOptions | (() => number) = {}) {
    const normalized = typeof options === "function" ? { random: options } : options;
    this.random = normalized.random ?? Math.random;
    this.diceRoller = normalized.diceRoller ?? (() => Math.floor(this.random() * 6) + 1);
    this.boardMode = normalized.boardMode ?? "random";
    this.configuredDevelopmentDeck = normalized.developmentDeck;
  }

  get state(): CatanState | null { return this._state ? clone(this._state) : null; }

  /** Read-only legal targets for an active player's board action. UI never duplicates placement rules. */
  getLegalTargets(playerId: string, action: "road" | "settlement" | "city" | "robber"): string[] {
    const state = this.requireState();
    if (state.phase === "finished" || state.currentPlayerId !== playerId || !state.players.some((entry) => entry.id === playerId)) return [];
    if (action === "robber") return state.phase === "robber" ? state.board.filter((hex) => hex.id !== state.robberHexId).map((hex) => hex.id) : [];
    const player = this.player(playerId);
    const setup = state.phase === "setup";
    if (action === "road") {
      if (player.pieces.roads < 1 || !(setup && state.setupStep === "road" || state.phase === "action" || state.phase === "road_building")) return [];
      if (state.phase === "action" && CATAN_RESOURCES.some((resource) => player.resources[resource] < BUILD_COSTS.road[resource])) return [];
      return state.edges.filter((edge) => {
        if (state.roads[edge.id]) return false;
        if (setup) return Boolean(state.lastSetupIntersectionId && edge.intersectionIds.includes(state.lastSetupIntersectionId));
        try { this.validateRoadLocation(playerId, edge.id); return true; } catch (error) { if (error instanceof CatanRuleError) return false; throw error; }
      }).map((edge) => edge.id);
    }
    if (action === "city") {
      if (state.phase !== "action" || player.pieces.cities < 1 || CATAN_RESOURCES.some((resource) => player.resources[resource] < BUILD_COSTS.city[resource])) return [];
      return Object.values(state.buildings).filter((building) => building.playerId === playerId && building.kind === "settlement").map((building) => building.intersectionId);
    }
    if (!(setup && state.setupStep === "settlement" || state.phase === "action") || player.pieces.settlements < 1) return [];
    if (!setup && CATAN_RESOURCES.some((resource) => player.resources[resource] < BUILD_COSTS.settlement[resource])) return [];
    return state.intersections.filter((intersection) => {
      try { this.validateSettlementLocation(playerId, intersection.id, !setup); return true; }
      catch (error) { if (error instanceof CatanRuleError) return false; throw error; }
    }).map((intersection) => intersection.id);
  }

  getRobberVictims(playerId: string, hexId: string): string[] {
    const state = this.requireState();
    if (state.phase !== "robber" || state.currentPlayerId !== playerId || hexId === state.robberHexId) return [];
    const hex = state.board.find((entry) => entry.id === hexId);
    if (!hex) return [];
    return [...new Set(hex.intersectionIds.map((id) => state.buildings[id]?.playerId)
      .filter((id): id is string => Boolean(id && id !== playerId)))].filter((id) => totalResources(this.player(id).resources) > 0);
  }

  getAvailableActions(playerId: string): { road: boolean; settlement: boolean; city: boolean; development: boolean; trade: boolean } {
    const state = this.requireState();
    if (state.phase !== "action" || state.currentPlayerId !== playerId) return { road: false, settlement: false, city: false, development: false, trade: false };
    const player = this.player(playerId);
    return {
      road: this.getLegalTargets(playerId, "road").length > 0,
      settlement: this.getLegalTargets(playerId, "settlement").length > 0,
      city: this.getLegalTargets(playerId, "city").length > 0,
      development: state.developmentDeck.length > 0 && CATAN_RESOURCES.every((resource) => player.resources[resource] >= BUILD_COSTS.development[resource]),
      trade: true,
    };
  }

  getMaritimeRatio(playerId: string, resource: CatanResource): number {
    this.player(playerId);
    return this.maritimeRatio(playerId, resource);
  }

  canMaritimeTrade(playerId: string, give: CatanResource, receive: CatanResource): boolean {
    const state = this.requireState();
    if (state.phase !== "action" || state.currentPlayerId !== playerId || give === receive) return false;
    const player = this.player(playerId);
    return player.resources[give] >= this.maritimeRatio(playerId, give) && state.bank[receive] > 0;
  }

  createGame(players: CatanPlayerInput[]): CatanState {
    if (players.length < 3 || players.length > 4) ruleError("INVALID_SETUP_ORDER", "CATAN cần từ 3 đến 4 người chơi");
    if (new Set(players.map((player) => player.id)).size !== players.length) ruleError("INVALID_SETUP_ORDER", "Người chơi CATAN bị trùng ID");
    if (players.some((player) => !player.id.trim() || !player.name.trim())) ruleError("PLAYER_NOT_FOUND", "ID và tên người chơi không được để trống");
    const topology = createCatanBoard(this.boardMode, this.random);
    const desert = topology.board.find((hex) => hex.resource === "desert")!;
    const setupOrder = [...players.map((player) => player.id), ...players.map((player) => player.id).reverse()];
    const deck = this.configuredDevelopmentDeck ? [...this.configuredDevelopmentDeck] : shuffle(DEVELOPMENT_DECK, this.random);
    this._state = {
      phase: "setup",
      ...topology,
      buildings: {}, roads: {},
      players: players.map((player, index): CatanPlayer => ({
        ...player,
        color: PLAYER_COLORS[index],
        resources: emptyResources(),
        developmentCards: [],
        pieces: { roads: 15, settlements: 5, cities: 4 },
        playedKnights: 0,
        publicVictoryPoints: 0,
        hiddenVictoryPoints: 0,
      })),
      bank: { wood: 19, brick: 19, wool: 19, grain: 19, ore: 19 },
      developmentDeck: deck,
      developmentDiscard: [],
      tradeOffers: [],
      currentPlayerId: setupOrder[0],
      turnNumber: 0,
      dice: null,
      robberHexId: desert.id,
      setupOrder,
      setupIndex: 0,
      setupStep: "settlement",
      lastSetupIntersectionId: null,
      pendingDiscards: {},
      robberReturnPhase: null,
      pendingFreeRoads: 0,
      roadBuildingReturnPhase: null,
      hasPlayedDevelopmentThisTurn: false,
      longestRoad: { holderId: null, lengths: Object.fromEntries(players.map((player) => [player.id, 0])) },
      largestArmy: { holderId: null, sizes: Object.fromEntries(players.map((player) => [player.id, 0])) },
      winner: null,
      revision: 1,
    };
    return this.state!;
  }

  restoreState(state: CatanState): void { this._state = clone(state); }

  placeInitialSettlement(playerId: string, intersectionId: string): CatanState {
    return this.perform(() => {
      const state = this.requireState();
      this.assertPhase("setup");
      this.assertSetupPlayer(playerId, "settlement");
      this.validateSettlementLocation(playerId, intersectionId, false);
      const player = this.player(playerId);
      if (player.pieces.settlements < 1) ruleError("PIECE_LIMIT", "Bạn đã dùng hết khu định cư");
      state.buildings[intersectionId] = { intersectionId, playerId, kind: "settlement" };
      player.pieces.settlements -= 1;
      state.lastSetupIntersectionId = intersectionId;
      state.setupStep = "road";
      const settlementCount = Object.values(state.buildings).filter((building) => building.playerId === playerId).length;
      if (settlementCount === 2) this.grantInitialResources(playerId, intersectionId);
    });
  }

  placeInitialRoad(playerId: string, edgeId: string): CatanState {
    return this.perform(() => {
      const state = this.requireState();
      this.assertPhase("setup");
      this.assertSetupPlayer(playerId, "road");
      const edge = this.edge(edgeId);
      if (state.roads[edgeId]) ruleError("OCCUPIED", "Cạnh này đã có đường");
      if (!state.lastSetupIntersectionId || !edge.intersectionIds.includes(state.lastSetupIntersectionId)) {
        ruleError("NOT_CONNECTED", "Đường thiết lập phải nối với khu định cư vừa đặt");
      }
      const player = this.player(playerId);
      if (player.pieces.roads < 1) ruleError("PIECE_LIMIT", "Bạn đã dùng hết đường");
      state.roads[edgeId] = { edgeId, playerId };
      player.pieces.roads -= 1;
      state.setupIndex += 1;
      state.lastSetupIntersectionId = null;
      if (state.setupIndex >= state.setupOrder.length) {
        state.phase = "roll";
        state.currentPlayerId = state.setupOrder[0];
        state.turnNumber = 1;
        state.setupStep = "settlement";
      } else {
        state.currentPlayerId = state.setupOrder[state.setupIndex];
        state.setupStep = "settlement";
      }
    });
  }

  rollDice(playerId: string): { dice: [number, number]; total: number; state: CatanState } {
    let dice: [number, number] = [0, 0];
    let total = 0;
    const state = this.perform(() => {
      this.assertCurrentPlayer(playerId);
      this.assertPhase("roll");
      dice = [this.diceRoller(), this.diceRoller()];
      if (dice.some((die) => !Number.isInteger(die) || die < 1 || die > 6)) ruleError("INVALID_DICE", "Mỗi xúc xắc phải có giá trị từ 1 đến 6");
      total = dice[0] + dice[1];
      const current = this.requireState();
      current.dice = dice;
      if (total === 7) {
        current.pendingDiscards = Object.fromEntries(current.players
          .map((player) => [player.id, Math.floor(totalResources(player.resources) / 2)] as const)
          .filter(([, count]) => count > 3));
        current.robberReturnPhase = "action";
        current.phase = Object.keys(current.pendingDiscards).length ? "discard" : "robber";
      } else {
        this.distributeProduction(total);
        current.phase = "action";
      }
    });
    return { dice, total, state };
  }

  discardResources(playerId: string, discard: ResourceBundle): CatanState {
    return this.perform(() => {
      const state = this.requireState();
      this.assertPhase("discard");
      validateBundle(discard);
      const required = state.pendingDiscards[playerId];
      if (required === undefined) ruleError("DISCARD_REQUIRED", "Người chơi này không phải bỏ tài nguyên");
      if (totalResources(discard) !== required) ruleError("INVALID_DISCARD", `Phải bỏ đúng ${required} tài nguyên`);
      const player = this.player(playerId);
      this.assertHasResources(player, discard);
      this.transferBundle(player.resources, state.bank, discard);
      delete state.pendingDiscards[playerId];
      if (Object.keys(state.pendingDiscards).length === 0) state.phase = "robber";
    });
  }

  moveRobber(playerId: string, hexId: string, victimId?: string): CatanState {
    return this.perform(() => {
      const state = this.requireState();
      this.assertCurrentPlayer(playerId);
      this.assertPhase("robber");
      const target = state.board.find((hex) => hex.id === hexId);
      if (!target) ruleError("INVALID_LOCATION", "Ô đặt tên cướp không tồn tại");
      if (hexId === state.robberHexId) ruleError("ROBBER_MUST_MOVE", "Tên cướp phải được chuyển sang ô khác");
      const eligible = [...new Set(target!.intersectionIds
        .map((id) => state.buildings[id]?.playerId)
        .filter((id): id is string => Boolean(id && id !== playerId)))]
        .filter((id) => totalResources(this.player(id).resources) > 0);
      let selectedVictim = victimId;
      if (!selectedVictim && eligible.length === 1) selectedVictim = eligible[0];
      if (selectedVictim && !eligible.includes(selectedVictim)) ruleError("INVALID_ROBBER_VICTIM", "Người bị cướp không có công trình hợp lệ cạnh ô này");
      if (!selectedVictim && eligible.length > 1) ruleError("INVALID_ROBBER_VICTIM", "Phải chọn một người chơi để cướp tài nguyên", { eligible });
      state.robberHexId = hexId;
      if (selectedVictim) this.stealRandomResource(selectedVictim, playerId);
      state.phase = state.robberReturnPhase ?? "action";
      state.robberReturnPhase = null;
    });
  }

  buildRoad(playerId: string, edgeId: string): CatanState {
    return this.perform(() => {
      const state = this.requireState();
      this.assertCurrentPlayer(playerId);
      this.assertPhase("action", "road_building");
      this.validateRoadLocation(playerId, edgeId);
      const player = this.player(playerId);
      if (player.pieces.roads < 1) ruleError("PIECE_LIMIT", "Bạn đã dùng hết 15 đường");
      const free = state.phase === "road_building";
      if (!free) this.payCost(player, BUILD_COSTS.road);
      state.roads[edgeId] = { edgeId, playerId };
      player.pieces.roads -= 1;
      if (free) {
        state.pendingFreeRoads -= 1;
        if (state.pendingFreeRoads <= 0 || player.pieces.roads === 0) this.finishRoadBuildingEffect();
      }
    });
  }

  finishRoadBuilding(playerId: string): CatanState {
    return this.perform(() => {
      this.assertCurrentPlayer(playerId);
      this.assertPhase("road_building");
      if (this.hasLegalRoadLocation(playerId)) ruleError("INVALID_DEVELOPMENT_ACTION", "Vẫn còn vị trí hợp lệ để đặt đường miễn phí");
      this.finishRoadBuildingEffect();
    });
  }

  buildSettlement(playerId: string, intersectionId: string): CatanState {
    return this.perform(() => {
      this.assertCurrentPlayer(playerId);
      this.assertPhase("action");
      this.validateSettlementLocation(playerId, intersectionId, true);
      const state = this.requireState();
      const player = this.player(playerId);
      if (player.pieces.settlements < 1) ruleError("PIECE_LIMIT", "Bạn đã dùng hết 5 khu định cư");
      this.payCost(player, BUILD_COSTS.settlement);
      state.buildings[intersectionId] = { intersectionId, playerId, kind: "settlement" };
      player.pieces.settlements -= 1;
    });
  }

  upgradeCity(playerId: string, intersectionId: string): CatanState {
    return this.perform(() => {
      this.assertCurrentPlayer(playerId);
      this.assertPhase("action");
      const state = this.requireState();
      const building = state.buildings[intersectionId];
      if (!building || building.playerId !== playerId || building.kind !== "settlement") ruleError("INVALID_LOCATION", "Chỉ có thể nâng cấp khu định cư của chính bạn");
      const player = this.player(playerId);
      if (player.pieces.cities < 1) ruleError("PIECE_LIMIT", "Bạn đã dùng hết 4 thành phố");
      this.payCost(player, BUILD_COSTS.city);
      building.kind = "city";
      player.pieces.cities -= 1;
      player.pieces.settlements += 1;
    });
  }

  maritimeTrade(playerId: string, give: CatanResource, receive: CatanResource): CatanState {
    return this.perform(() => {
      this.assertCurrentPlayer(playerId);
      this.assertPhase("action");
      if (give === receive) ruleError("INVALID_TRADE", "Không thể đổi cùng một loại tài nguyên");
      const state = this.requireState();
      const player = this.player(playerId);
      const ratio = this.maritimeRatio(playerId, give);
      if (player.resources[give] < ratio) ruleError("INSUFFICIENT_RESOURCES", `Cần ${ratio} ${give} để giao dịch`);
      if (state.bank[receive] < 1) ruleError("BANK_SHORTAGE", "Ngân hàng đã hết tài nguyên muốn nhận");
      player.resources[give] -= ratio;
      state.bank[give] += ratio;
      state.bank[receive] -= 1;
      player.resources[receive] += 1;
    });
  }

  createTradeOffer(playerId: string, targetId: string, give: ResourceBundle, want: ResourceBundle): TradeOffer {
    let created!: TradeOffer;
    this.perform(() => {
      const state = this.requireState();
      this.assertPhase("action");
      this.player(playerId);
      validateBundle(give); validateBundle(want);
      if (targetId === playerId) ruleError("INVALID_TRADE", "Không thể giao dịch với chính mình");
      this.player(targetId);
      if (state.currentPlayerId !== playerId && state.currentPlayerId !== targetId) ruleError("INVALID_TRADE", "Mọi giao dịch phải có người đang tới lượt tham gia");
      if (isEmptyBundle(give) || isEmptyBundle(want)) ruleError("INVALID_TRADE", "Giao dịch phải có tài nguyên ở cả hai phía");
      if (CATAN_RESOURCES.some((resource) => give[resource] > 0 && want[resource] > 0)) ruleError("INVALID_TRADE", "Không được trao đổi cùng một loại tài nguyên ở hai phía");
      this.assertHasResources(this.player(playerId), give);
      created = { id: `trade:${state.turnNumber}:${state.revision + 1}`, proposerId: playerId, targetId, give: clone(give), want: clone(want), status: "open", createdTurn: state.turnNumber };
      state.tradeOffers.push(created);
    });
    return clone(created);
  }

  acceptTrade(playerId: string, offerId: string): CatanState {
    return this.perform(() => {
      const state = this.requireState();
      this.assertPhase("action");
      const offer = this.openOffer(offerId);
      if (offer.targetId !== playerId) ruleError("INVALID_TRADE", "Đề nghị này không dành cho bạn");
      if (state.currentPlayerId !== offer.proposerId && state.currentPlayerId !== offer.targetId) ruleError("INVALID_TRADE", "Chỉ được giao dịch với người đang tới lượt");
      const proposer = this.player(offer.proposerId);
      const acceptor = this.player(playerId);
      this.assertHasResources(proposer, offer.give);
      this.assertHasResources(acceptor, offer.want);
      this.transferBundle(proposer.resources, acceptor.resources, offer.give);
      this.transferBundle(acceptor.resources, proposer.resources, offer.want);
      offer.status = "accepted";
    });
  }

  rejectTrade(playerId: string, offerId: string): CatanState {
    return this.perform(() => {
      const offer = this.openOffer(offerId);
      if (offer.targetId !== playerId) ruleError("INVALID_TRADE", "Chỉ người nhận mới có thể từ chối đề nghị");
      offer.status = "rejected";
    });
  }

  cancelTrade(playerId: string, offerId: string): CatanState {
    return this.perform(() => {
      const offer = this.openOffer(offerId);
      if (offer.proposerId !== playerId) ruleError("INVALID_TRADE", "Chỉ người đề nghị mới có thể hủy giao dịch");
      offer.status = "cancelled";
    });
  }

  buyDevelopmentCard(playerId: string): { cardId: string; state: CatanState } {
    let cardId = "";
    const state = this.perform(() => {
      const current = this.requireState();
      this.assertCurrentPlayer(playerId);
      this.assertPhase("action");
      if (!current.developmentDeck.length) ruleError("DEVELOPMENT_DECK_EMPTY", "Chồng thẻ phát triển đã hết");
      const player = this.player(playerId);
      this.assertHasResources(player, BUILD_COSTS.development);
      this.payCost(player, BUILD_COSTS.development);
      const type = current.developmentDeck.shift()!;
      cardId = `dev:${current.turnNumber}:${current.revision + 1}:${player.developmentCards.length}`;
      player.developmentCards.push({ id: cardId, type, purchasedTurn: current.turnNumber, played: false });
    });
    return { cardId, state };
  }

  playDevelopmentCard(
    playerId: string,
    cardId: string,
    payload?: { resources?: [CatanResource, CatanResource]; resource?: CatanResource },
  ): CatanState {
    return this.perform(() => {
      const state = this.requireState();
      this.assertCurrentPlayer(playerId);
      this.assertPhase("roll", "action");
      if (state.hasPlayedDevelopmentThisTurn) ruleError("DEVELOPMENT_CARD_LIMIT", "Mỗi lượt chỉ được dùng một thẻ phát triển không phải điểm thắng");
      const player = this.player(playerId);
      const card = player.developmentCards.find((candidate) => candidate.id === cardId && !candidate.played);
      if (!card) ruleError("DEVELOPMENT_CARD_NOT_FOUND", "Không tìm thấy thẻ phát triển chưa sử dụng");
      if (card!.type === "victory_point") ruleError("INVALID_DEVELOPMENT_ACTION", "Thẻ điểm thắng chỉ được công bố khi đủ điểm chiến thắng");
      if (card!.purchasedTurn === state.turnNumber) ruleError("DEVELOPMENT_CARD_BOUGHT_THIS_TURN", "Không được dùng thẻ phát triển vừa mua trong lượt này");
      const returnPhase = state.phase as "roll" | "action";
      card!.played = true;
      state.hasPlayedDevelopmentThisTurn = true;
      if (card!.type === "knight") {
        player.playedKnights += 1;
        state.robberReturnPhase = returnPhase;
        state.phase = "robber";
      } else if (card!.type === "road_building") {
        state.pendingFreeRoads = Math.min(2, player.pieces.roads);
        state.roadBuildingReturnPhase = returnPhase;
        state.phase = state.pendingFreeRoads > 0 ? "road_building" : returnPhase;
      } else if (card!.type === "year_of_plenty") {
        const resources = payload?.resources;
        if (!resources || resources.length !== 2) ruleError("INVALID_DEVELOPMENT_ACTION", "Năm sung túc phải chọn đúng 2 tài nguyên");
        const demand = emptyResources();
        resources!.forEach((resource) => { demand[resource] += 1; });
        if (CATAN_RESOURCES.some((resource) => state.bank[resource] < demand[resource])) ruleError("BANK_SHORTAGE", "Ngân hàng không đủ tài nguyên cho Năm sung túc");
        this.transferBundle(state.bank, player.resources, demand);
      } else if (card!.type === "monopoly") {
        const resource = payload?.resource;
        if (!resource || !CATAN_RESOURCES.includes(resource)) ruleError("INVALID_DEVELOPMENT_ACTION", "Độc quyền cần một loại tài nguyên hợp lệ");
        state.players.filter((candidate) => candidate.id !== playerId).forEach((candidate) => {
          player.resources[resource!] += candidate.resources[resource!];
          candidate.resources[resource!] = 0;
        });
      }
      if (card!.type !== "knight") state.developmentDiscard.push(card!.type);
    });
  }

  endTurn(playerId: string): CatanState {
    return this.perform(() => {
      const state = this.requireState();
      this.assertCurrentPlayer(playerId);
      this.assertPhase("action");
      state.tradeOffers.filter((offer) => offer.status === "open").forEach((offer) => { offer.status = "cancelled"; });
      const currentIndex = state.players.findIndex((player) => player.id === playerId);
      state.currentPlayerId = state.players[(currentIndex + 1) % state.players.length].id;
      state.turnNumber += 1;
      state.dice = null;
      state.hasPlayedDevelopmentThisTurn = false;
      state.phase = "roll";
    });
  }

  getVictoryPoints(playerId: string): { public: number; hidden: number; total: number } {
    const player = this.player(playerId);
    return { public: player.publicVictoryPoints, hidden: player.hiddenVictoryPoints, total: player.publicVictoryPoints + player.hiddenVictoryPoints };
  }

  checkVictory(playerId: string): boolean {
    const state = this.requireState();
    const score = this.getVictoryPoints(playerId);
    return state.currentPlayerId === playerId && score.total >= 10;
  }

  removePlayer(playerId: string): void {
    if (!this._state) return;
    this._state.players = this._state.players.filter((player) => player.id !== playerId);
    Object.values(this._state.buildings).filter((piece) => piece.playerId === playerId).forEach((piece) => delete this._state!.buildings[piece.intersectionId]);
    Object.values(this._state.roads).filter((piece) => piece.playerId === playerId).forEach((piece) => delete this._state!.roads[piece.edgeId]);
    if (this._state.currentPlayerId === playerId && this._state.players[0]) this._state.currentPlayerId = this._state.players[0].id;
    this.refreshAwardsAndScores();
    this._state.revision += 1;
  }

  private requireState(): CatanState {
    if (!this._state) ruleError("GAME_NOT_STARTED", "Trận CATAN chưa được khởi tạo");
    return this._state!;
  }

  private perform(action: () => void): CatanState {
    const state = this.requireState();
    if (state.phase === "finished") ruleError("GAME_FINISHED", "Trận CATAN đã kết thúc");
    const snapshot = clone(state);
    try {
      action();
      this.refreshAwardsAndScores();
      this.requireState().revision += 1;
      return this.state!;
    } catch (error) {
      this._state = snapshot;
      if (error instanceof CatanRuleError) throw error;
      throw error;
    }
  }

  private player(playerId: string): CatanPlayer {
    const player = this.requireState().players.find((candidate) => candidate.id === playerId);
    if (!player) ruleError("PLAYER_NOT_FOUND", "Không tìm thấy người chơi CATAN", { playerId });
    return player!;
  }

  private edge(edgeId: string): CatanEdge {
    const edge = this.requireState().edges.find((candidate) => candidate.id === edgeId);
    if (!edge) ruleError("INVALID_LOCATION", "Cạnh bản đồ không tồn tại", { edgeId });
    return edge!;
  }

  private assertPhase(...allowed: CatanPhase[]): void {
    const phase = this.requireState().phase;
    if (!allowed.includes(phase)) ruleError("INVALID_PHASE", `Hành động không hợp lệ trong phase ${phase}`, { allowed, phase });
  }

  private assertCurrentPlayer(playerId: string): void {
    this.player(playerId);
    if (this.requireState().currentPlayerId !== playerId) ruleError("NOT_CURRENT_PLAYER", "Chưa tới lượt người chơi này");
  }

  private assertSetupPlayer(playerId: string, step: "settlement" | "road"): void {
    const state = this.requireState();
    if (state.currentPlayerId !== playerId || state.setupStep !== step) ruleError("INVALID_SETUP_ORDER", "Không đúng người chơi hoặc bước thiết lập");
  }

  private validateSettlementLocation(playerId: string, intersectionId: string, requireRoad: boolean): void {
    const state = this.requireState();
    const intersection = state.intersections.find((candidate) => candidate.id === intersectionId);
    if (!intersection) ruleError("INVALID_LOCATION", "Giao điểm không tồn tại");
    if (state.buildings[intersectionId]) ruleError("OCCUPIED", "Giao điểm đã có công trình");
    if (intersection!.neighborIds.some((neighborId) => Boolean(state.buildings[neighborId]))) ruleError("DISTANCE_RULE", "Khu định cư phải cách mọi công trình ít nhất một giao điểm");
    if (requireRoad && !intersection!.edgeIds.some((id) => state.roads[id]?.playerId === playerId)) ruleError("NOT_CONNECTED", "Khu định cư phải nối với đường của bạn");
  }

  private validateRoadLocation(playerId: string, edgeId: string): void {
    const state = this.requireState();
    const edge = this.edge(edgeId);
    if (state.roads[edgeId]) ruleError("OCCUPIED", "Cạnh này đã có đường");
    const connected = edge.intersectionIds.some((intersectionId) => {
      const building = state.buildings[intersectionId];
      if (building?.playerId === playerId) return true;
      if (building && building.playerId !== playerId) return false;
      const intersection = state.intersections.find((candidate) => candidate.id === intersectionId)!;
      return intersection.edgeIds.some((id) => state.roads[id]?.playerId === playerId);
    });
    if (!connected) ruleError("NOT_CONNECTED", "Đường mới phải nối với mạng lưới của bạn và không đi xuyên công trình đối thủ");
  }

  private hasLegalRoadLocation(playerId: string): boolean {
    const state = this.requireState();
    if (this.player(playerId).pieces.roads < 1) return false;
    return state.edges.some((edge) => {
      if (state.roads[edge.id]) return false;
      try { this.validateRoadLocation(playerId, edge.id); return true; } catch { return false; }
    });
  }

  private grantInitialResources(playerId: string, intersectionId: string): void {
    const state = this.requireState();
    const intersection = state.intersections.find((candidate) => candidate.id === intersectionId)!;
    const player = this.player(playerId);
    intersection.adjacentHexIds.map((id) => state.board.find((hex) => hex.id === id)!).forEach((hex) => {
      if (hex.resource === "desert" || state.bank[hex.resource] < 1) return;
      state.bank[hex.resource] -= 1;
      player.resources[hex.resource] += 1;
    });
  }

  private distributeProduction(total: number): void {
    const state = this.requireState();
    const grants = resolveProduction(state.bank, calculateProductionDemand(state, total));
    Object.entries(grants).forEach(([playerId, bundle]) => {
      const player = this.player(playerId);
      CATAN_RESOURCES.forEach((resource) => { player.resources[resource] += bundle[resource]; state.bank[resource] -= bundle[resource]; });
    });
  }

  private payCost(player: CatanPlayer, cost: ResourceBundle): void {
    this.assertHasResources(player, cost);
    this.transferBundle(player.resources, this.requireState().bank, cost);
  }

  private assertHasResources(player: CatanPlayer, bundle: ResourceBundle): void {
    validateBundle(bundle);
    const missing = CATAN_RESOURCES.filter((resource) => player.resources[resource] < bundle[resource]);
    if (missing.length) ruleError("INSUFFICIENT_RESOURCES", "Không đủ tài nguyên", { missing });
  }

  private transferBundle(source: ResourceBundle, target: ResourceBundle, bundle: ResourceBundle): void {
    CATAN_RESOURCES.forEach((resource) => { source[resource] -= bundle[resource]; target[resource] += bundle[resource]; });
  }

  private maritimeRatio(playerId: string, resource: CatanResource): number {
    const state = this.requireState();
    const harborIds = new Set(Object.values(state.buildings).filter((building) => building.playerId === playerId).map((building) =>
      state.intersections.find((intersection) => intersection.id === building.intersectionId)?.harborId).filter((id): id is string => Boolean(id)));
    const harborKinds = state.harbors.filter((harbor) => harborIds.has(harbor.id)).map((harbor) => harbor.kind);
    if (harborKinds.includes(resource)) return 2;
    if (harborKinds.includes("generic")) return 3;
    return 4;
  }

  private openOffer(offerId: string): TradeOffer {
    const offer = this.requireState().tradeOffers.find((candidate) => candidate.id === offerId && candidate.status === "open");
    if (!offer) ruleError("OFFER_NOT_FOUND", "Không tìm thấy đề nghị giao dịch đang mở");
    return offer!;
  }

  private stealRandomResource(victimId: string, thiefId: string): void {
    const victim = this.player(victimId);
    const thief = this.player(thiefId);
    const cards = CATAN_RESOURCES.flatMap((resource) => Array<CatanResource>(victim.resources[resource]).fill(resource));
    if (!cards.length) return;
    const resource = cards[Math.floor(this.random() * cards.length)];
    victim.resources[resource] -= 1;
    thief.resources[resource] += 1;
  }

  private finishRoadBuildingEffect(): void {
    const state = this.requireState();
    state.pendingFreeRoads = 0;
    state.phase = state.roadBuildingReturnPhase ?? "action";
    state.roadBuildingReturnPhase = null;
  }

  private refreshAwardsAndScores(): void {
    if (!this._state) return;
    const state = this._state;
    const lengths = Object.fromEntries(state.players.map((player) => [player.id, calculateLongestRoad(state, player.id)]));
    const sizes = Object.fromEntries(state.players.map((player) => [player.id, player.playedKnights]));
    state.longestRoad = { holderId: resolveLongestRoadHolder(lengths, state.longestRoad.holderId), lengths };
    state.largestArmy = { holderId: resolveLargestArmyHolder(sizes, state.largestArmy.holderId), sizes };
    state.players.forEach((player) => {
      player.publicVictoryPoints = Object.values(state.buildings).filter((building) => building.playerId === player.id)
        .reduce((score, building) => score + (building.kind === "city" ? 2 : 1), 0)
        + (state.longestRoad.holderId === player.id ? 2 : 0)
        + (state.largestArmy.holderId === player.id ? 2 : 0);
      player.hiddenVictoryPoints = player.developmentCards.filter((card) => card.type === "victory_point").length;
    });
    const current = state.players.find((player) => player.id === state.currentPlayerId);
    if ((state.phase === "roll" || state.phase === "action") && current && current.publicVictoryPoints + current.hiddenVictoryPoints >= 10) {
      state.winner = current.id;
      state.phase = "finished";
    }
  }
}
