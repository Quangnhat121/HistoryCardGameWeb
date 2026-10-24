import { randomInt, randomUUID } from "node:crypto";
import { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { env } from "../config/env";
import { connectDatabase } from "../config/database";
import { GameEngine, viewFor } from "../game";
import { Card } from "../models/Card";
import { GameRecord } from "../models/GameRecord";
import { getIceServers } from "../services/turn";

const ROOM_CODE_LENGTH = 5;
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const RECONNECT_GRACE_MS = 60_000;

interface RoomPlayer {
  playerId: string;
  name: string;
  socketId: string | null;
  connected: boolean;
  disconnectTimer?: NodeJS.Timeout;
}

interface GameRoom {
  code: string;
  engine: GameEngine | null;
  players: RoomPlayer[];
  hostId: string;
  startedAt: Date | null;
  recordSaved: boolean;
  turnTimer?: NodeJS.Timeout;
}

interface SocketData {
  roomCode?: string;
  playerId?: string;
}

interface CreatePayload { name?: unknown }
interface JoinPayload { code?: unknown; name?: unknown }
interface PlacePayload { cardId?: unknown; index?: unknown }
interface ChallengePayload { cardId?: unknown }
interface VoiceTargetPayload { targetPlayerId?: unknown }
interface VoiceDescriptionPayload extends VoiceTargetPayload { description?: unknown }
interface VoiceIcePayload extends VoiceTargetPayload { candidate?: unknown }

export const rooms = new Map<string, GameRoom>();

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định";

const validateName = (value: unknown): string => {
  if (typeof value !== "string") throw new Error("Tên người chơi không hợp lệ");
  const name = value.trim();
  if (name.length < 1 || name.length > 30) throw new Error("Tên người chơi phải có từ 1 đến 30 ký tự");
  return name;
};

const validateCode = (value: unknown): string => {
  if (typeof value !== "string") throw new Error("Mã phòng không hợp lệ");
  const code = value.trim().toUpperCase();
  if (!new RegExp(`^[${ROOM_CODE_CHARS}]{${ROOM_CODE_LENGTH}}$`).test(code))
    throw new Error("Mã phòng phải gồm 5 ký tự hợp lệ");
  return code;
};

const validateCardId = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0)
    throw new Error("cardId không hợp lệ");
  return value;
};

const validateIndex = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0)
    throw new Error("index phải là số nguyên không âm");
  return value;
};

const generateRoomCode = (): string => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let code = "";
    for (let index = 0; index < ROOM_CODE_LENGTH; index += 1)
      code += ROOM_CODE_CHARS[randomInt(ROOM_CODE_CHARS.length)];
    if (!rooms.has(code)) return code;
  }
  throw new Error("Không thể tạo mã phòng, vui lòng thử lại");
};

const getRoomMembership = (socket: Socket<any, any, any, SocketData>) => {
  const { roomCode, playerId } = socket.data;
  if (!roomCode || !playerId) throw new Error("Bạn chưa tham gia phòng");
  const room = rooms.get(roomCode);
  if (!room) throw new Error("Phòng không còn tồn tại");
  const player = room.players.find((entry) => entry.playerId === playerId);
  if (!player) throw new Error("Bạn không còn ở trong phòng");
  return { room, player };
};

const getVoiceTarget = (socket: Socket<any, any, any, SocketData>, value: unknown) => {
  const { room, player } = getRoomMembership(socket);
  if (typeof value !== "string" || value === player.playerId) throw new Error("Người nhận voice không hợp lệ");
  const target = room.players.find((entry) => entry.playerId === value && entry.connected && entry.socketId);
  if (!target?.socketId) throw new Error("Người nhận voice không còn kết nối");
  return { room, player, target };
};

const isSessionDescription = (value: unknown): value is { type: string; sdp?: string } => {
  if (!value || typeof value !== "object") return false;
  const description = value as Record<string, unknown>;
  return typeof description.type === "string"
    && ["offer", "answer"].includes(description.type)
    && (description.sdp === undefined || typeof description.sdp === "string");
};

const isIceCandidate = (value: unknown): boolean => {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;
  return typeof (value as Record<string, unknown>).candidate === "string";
};

const emitRoomUpdate = (io: Server, room: GameRoom): void => {
  for (const player of room.players) {
    if (!player.socketId) continue;
    io.to(player.socketId).emit("room:update", {
      code: room.code,
      hostId: room.hostId,
      selfPlayerId: player.playerId,
      started: room.engine !== null,
      players: room.players.map(({ playerId, name, connected }) => ({ playerId, name, connected })),
    });
  }
};

const emitGameStates = (io: Server, room: GameRoom): void => {
  if (!room.engine) return;
  for (const player of room.players) {
    if (!player.socketId) continue;
    io.to(player.socketId).emit("game:state", viewFor(room.engine.state, player.playerId));
  }
};

const removePlayer = (io: Server, room: GameRoom, playerId: string): void => {
  const index = room.players.findIndex((player) => player.playerId === playerId);
  if (index === -1) return;
  const [removed] = room.players.splice(index, 1);
  if (removed.disconnectTimer) clearTimeout(removed.disconnectTimer);
  if (room.engine) room.engine.removePlayer(playerId);

  if (room.players.length === 0) {
    if (room.turnTimer) clearTimeout(room.turnTimer);
    rooms.delete(room.code);
    return;
  }
  if (room.hostId === playerId) room.hostId = room.players[0].playerId;
  room.engine?.resetTurnTimer();
  emitRoomUpdate(io, room);
  emitGameStates(io, room);
  scheduleTurnTimeout(io, room);
};

const saveFinishedGame = async (room: GameRoom): Promise<void> => {
  if (!room.engine || !room.engine.state.winner || !room.startedAt || room.recordSaved) return;
  const winner = room.players.find((player) => player.playerId === room.engine?.state.winner);
  if (!winner) throw new Error("Không tìm thấy người thắng");

  room.recordSaved = true;
  try {
    await GameRecord.create({
      roomCode: room.code,
      players: room.engine.state.players.map((player) => player.name),
      winner: winner.name,
      startedAt: room.startedAt,
      endedAt: new Date(),
      totalTurns: room.engine.state.turnNumber - 1,
    });
  } catch (error) {
    room.recordSaved = false;
    throw error;
  }
};

const finishGame = async (io: Server, room: GameRoom): Promise<void> => {
  const winner = room.players.find((entry) => entry.playerId === room.engine?.state.winner);
  if (!winner) throw new Error("Không tìm thấy người thắng");
  await saveFinishedGame(room);
  io.to(room.code).emit("game:over", { winnerName: winner.name });
};

const handleTurnTimeout = async (io: Server, room: GameRoom): Promise<void> => {
  if (!room.engine || room.engine.state.phase === "finished") return;
  const deadline = room.engine.state.turnDeadline;
  if (deadline !== null && deadline > Date.now()) {
    scheduleTurnTimeout(io, room);
    return;
  }

  const result = room.engine.timeoutTurn();
  const timedOutPlayer = room.players.find((entry) => entry.playerId === result.timedOutPlayerId);
  io.to(room.code).emit("game:turnTimeout", {
    playerId: result.timedOutPlayerId,
    playerName: timedOutPlayer?.name ?? "Người chơi",
  });
  emitGameStates(io, room);

  if (result.winner) await finishGame(io, room);
  else scheduleTurnTimeout(io, room);
};

const scheduleTurnTimeout = (io: Server, room: GameRoom): void => {
  if (room.turnTimer) clearTimeout(room.turnTimer);
  room.turnTimer = undefined;
  const deadline = room.engine?.state.turnDeadline;
  if (!room.engine || room.engine.state.phase === "finished" || deadline == null) return;
  room.turnTimer = setTimeout(() => {
    void handleTurnTimeout(io, room).catch((error) => {
      console.error(`Xử lý hết giờ phòng ${room.code} thất bại:`, error);
    });
  }, Math.max(0, deadline - Date.now()));
};

const reconnectFromHandshake = (io: Server, socket: Socket<any, any, any, SocketData>): void => {
  const auth = socket.handshake.auth as Record<string, unknown>;
  if (typeof auth.playerId !== "string" || typeof auth.roomCode !== "string") return;
  const room = rooms.get(auth.roomCode.trim().toUpperCase());
  const player = room?.players.find((entry) => entry.playerId === auth.playerId);
  if (!room || !player || player.connected) return;

  if (player.disconnectTimer) clearTimeout(player.disconnectTimer);
  player.disconnectTimer = undefined;
  player.connected = true;
  player.socketId = socket.id;
  socket.data = { roomCode: room.code, playerId: player.playerId };
  void socket.join(room.code);
  emitRoomUpdate(io, room);
  if (room.engine) {
    socket.emit("game:state", viewFor(room.engine.state, player.playerId));
    const winner = room.players.find((entry) => entry.playerId === room.engine?.state.winner);
    if (winner) socket.emit("game:over", { winnerName: winner.name });
  }
};

export const createSocketServer = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: { origin: env.clientOrigins, methods: ["GET", "POST"] },
  });

  io.on("connection", (socket: Socket<any, any, any, SocketData>) => {
    reconnectFromHandshake(io, socket);

    socket.on("room:create", async (payload: CreatePayload) => {
      try {
        if (socket.data.roomCode) throw new Error("Bạn đã ở trong một phòng");
        const name = validateName(payload?.name);
        const code = generateRoomCode();
        const playerId = randomUUID();
        const room: GameRoom = {
          code,
          engine: null,
          players: [{ playerId, name, socketId: socket.id, connected: true }],
          hostId: playerId,
          startedAt: null,
          recordSaved: false,
        };
        rooms.set(code, room);
        socket.data = { roomCode: code, playerId };
        await socket.join(code);
        emitRoomUpdate(io, room);
      } catch (error) { socket.emit("error", { message: errorMessage(error) }); }
    });

    socket.on("room:join", async (payload: JoinPayload) => {
      try {
        if (socket.data.roomCode) throw new Error("Bạn đã ở trong một phòng");
        const code = validateCode(payload?.code);
        const name = validateName(payload?.name);
        const room = rooms.get(code);
        if (!room) throw new Error("Không tìm thấy phòng");
        if (room.engine) throw new Error("Ván chơi đã bắt đầu");
        if (room.players.length >= 4) throw new Error("Phòng đã đủ 4 người");
        const playerId = randomUUID();
        room.players.push({ playerId, name, socketId: socket.id, connected: true });
        socket.data = { roomCode: code, playerId };
        await socket.join(code);
        emitRoomUpdate(io, room);
      } catch (error) { socket.emit("error", { message: errorMessage(error) }); }
    });

    socket.on("room:start", async () => {
      try {
        await connectDatabase();
        const { room, player } = getRoomMembership(socket);
        if (room.hostId !== player.playerId) throw new Error("Chỉ chủ phòng được bắt đầu ván");
        if (room.engine) throw new Error("Ván chơi đã bắt đầu");
        if (room.players.length < 2 || room.players.length > 4) throw new Error("Cần từ 2 đến 4 người để bắt đầu");
        if (room.players.some((entry) => !entry.connected)) throw new Error("Tất cả người chơi phải đang kết nối");

        const cardDocuments = await Card.find().sort({ cardId: 1 }).select({ _id: 0, cardId: 1, image: 1, event: 1, year: 1, month: 1 }).lean();
        const cards = cardDocuments.map(({ cardId, image, event, year, month }) => ({
          cardId, image, event, year, ...(month ? { month } : {}),
        }));
        const turnOrder = room.players.map(({ playerId, name }) => ({ id: playerId, name }));
        for (let index = turnOrder.length - 1; index > 0; index -= 1) {
          const swapIndex = randomInt(index + 1);
          [turnOrder[index], turnOrder[swapIndex]] = [turnOrder[swapIndex], turnOrder[index]];
        }
        const engine = new GameEngine();
        engine.createGame(turnOrder, cards);
        room.engine = engine;
        room.startedAt = new Date();
        emitRoomUpdate(io, room);
        emitGameStates(io, room);
        scheduleTurnTimeout(io, room);
      } catch (error) { socket.emit("error", { message: errorMessage(error) }); }
    });

    socket.on("room:rematch", () => {
      try {
        const { room, player } = getRoomMembership(socket);
        if (room.hostId !== player.playerId) throw new Error("Chỉ chủ phòng được mở ván tiếp theo");
        if (!room.engine || room.engine.state.phase !== "finished") throw new Error("Ván chơi chưa kết thúc");

        if (room.turnTimer) clearTimeout(room.turnTimer);
        room.turnTimer = undefined;
        room.engine = null;
        room.startedAt = null;
        room.recordSaved = false;
        emitRoomUpdate(io, room);
      } catch (error) { socket.emit("error", { message: errorMessage(error) }); }
    });

    socket.on("game:place", (payload: PlacePayload) => {
      try {
        const { room, player } = getRoomMembership(socket);
        if (!room.engine) throw new Error("Ván chơi chưa bắt đầu");
        room.engine.placeCard(player.playerId, validateCardId(payload?.cardId), validateIndex(payload?.index));
        emitGameStates(io, room);
        scheduleTurnTimeout(io, room);
      } catch (error) { socket.emit("error", { message: errorMessage(error) }); }
    });

    socket.on("game:skipChallenge", async () => {
      try {
        const { room, player } = getRoomMembership(socket);
        if (!room.engine) throw new Error("Ván chơi chưa bắt đầu");
        room.engine.skipChallenge(player.playerId);
        emitGameStates(io, room);
        scheduleTurnTimeout(io, room);
        await finishGame(io, room);
      } catch (error) { socket.emit("error", { message: errorMessage(error) }); }
    });

    socket.on("game:challenge", async (payload: ChallengePayload) => {
      try {
        const { room, player } = getRoomMembership(socket);
        if (!room.engine) throw new Error("Ván chơi chưa bắt đầu");
        const lastPlacedBy = room.engine.state.lastPlaced?.playerId;
        const result = room.engine.challenge(player.playerId, validateCardId(payload?.cardId));
        const drawerId = result.correct ? player.playerId : lastPlacedBy;
        const drawerName = room.players.find((entry) => entry.playerId === drawerId)?.name;
        io.to(room.code).emit("game:challengeResult", { ...result, drawerName: drawerName ?? "" });
        emitGameStates(io, room);
        scheduleTurnTimeout(io, room);

        if (room.engine.state.phase === "finished" && room.engine.state.winner) {
          await finishGame(io, room);
        }
      } catch (error) { socket.emit("error", { message: errorMessage(error) }); }
    });

    socket.on("voice:getConfig", async () => {
      try {
        getRoomMembership(socket);
        socket.emit("voice:config", { iceServers: await getIceServers() });
      } catch (error) { socket.emit("voice:error", { message: errorMessage(error) }); }
    });

    socket.on("voice:ready", () => {
      try {
        const { room, player } = getRoomMembership(socket);
        socket.to(room.code).emit("voice:ready", { playerId: player.playerId });
      } catch (error) { socket.emit("voice:error", { message: errorMessage(error) }); }
    });

    socket.on("voice:offer", (payload: VoiceDescriptionPayload) => {
      try {
        const { player, target } = getVoiceTarget(socket, payload?.targetPlayerId);
        if (!isSessionDescription(payload?.description) || payload.description.type !== "offer")
          throw new Error("Dữ liệu voice offer không hợp lệ");
        io.to(target.socketId!).emit("voice:offer", { fromPlayerId: player.playerId, description: payload.description });
      } catch (error) { socket.emit("voice:error", { message: errorMessage(error) }); }
    });

    socket.on("voice:answer", (payload: VoiceDescriptionPayload) => {
      try {
        const { player, target } = getVoiceTarget(socket, payload?.targetPlayerId);
        if (!isSessionDescription(payload?.description) || payload.description.type !== "answer")
          throw new Error("Dữ liệu voice answer không hợp lệ");
        io.to(target.socketId!).emit("voice:answer", { fromPlayerId: player.playerId, description: payload.description });
      } catch (error) { socket.emit("voice:error", { message: errorMessage(error) }); }
    });

    socket.on("voice:ice", (payload: VoiceIcePayload) => {
      try {
        const { player, target } = getVoiceTarget(socket, payload?.targetPlayerId);
        if (!isIceCandidate(payload?.candidate)) throw new Error("ICE candidate không hợp lệ");
        io.to(target.socketId!).emit("voice:ice", { fromPlayerId: player.playerId, candidate: payload.candidate });
      } catch (error) { socket.emit("voice:error", { message: errorMessage(error) }); }
    });

    socket.on("room:leave", () => {
      try {
        const { room, player } = getRoomMembership(socket);
        socket.to(room.code).emit("voice:left", { playerId: player.playerId });
        socket.leave(room.code);
        socket.data = {};
        removePlayer(io, room, player.playerId);
      } catch (error) { socket.emit("error", { message: errorMessage(error) }); }
    });

    socket.on("disconnect", () => {
      const { roomCode, playerId } = socket.data;
      if (!roomCode || !playerId) return;
      const room = rooms.get(roomCode);
      const player = room?.players.find((entry) => entry.playerId === playerId);
      if (!room || !player || player.socketId !== socket.id) return;
      io.to(room.code).emit("voice:left", { playerId });
      player.connected = false;
      player.socketId = null;
      emitRoomUpdate(io, room);
      player.disconnectTimer = setTimeout(() => removePlayer(io, room, playerId), RECONNECT_GRACE_MS);
    });
  });

  return io;
};
