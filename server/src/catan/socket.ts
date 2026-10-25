import { randomInt, randomUUID } from "node:crypto";
import type { Namespace, Server, Socket } from "socket.io";
import { CatanEngine } from "./CatanEngine";
import { catanViewFor } from "./viewFor";

const ROOM_CODE_LENGTH = 5;
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const RECONNECT_GRACE_MS = 60_000;

interface CatanRoomPlayer {
  playerId: string;
  name: string;
  socketId: string | null;
  connected: boolean;
  disconnectTimer?: NodeJS.Timeout;
}

interface CatanRoom {
  code: string;
  hostId: string;
  players: CatanRoomPlayer[];
  engine: CatanEngine | null;
}

interface CatanSocketData { roomCode?: string; playerId?: string }
interface RoomPayload { name?: unknown; code?: unknown }

export const catanRooms = new Map<string, CatanRoom>();

const message = (error: unknown) => error instanceof Error ? error.message : "Đã xảy ra lỗi CATAN không xác định";
const validateName = (value: unknown): string => {
  if (typeof value !== "string") throw new Error("Tên người chơi không hợp lệ");
  const name = value.trim();
  if (name.length < 1 || name.length > 30) throw new Error("Tên người chơi phải có từ 1 đến 30 ký tự");
  return name;
};
const validateCode = (value: unknown): string => {
  if (typeof value !== "string") throw new Error("Mã phòng CATAN không hợp lệ");
  const code = value.trim().toUpperCase();
  if (!new RegExp(`^[${ROOM_CODE_CHARS}]{${ROOM_CODE_LENGTH}}$`).test(code)) throw new Error("Mã phòng CATAN phải gồm 5 ký tự hợp lệ");
  return code;
};
const createCode = (): string => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let code = "";
    for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) code += ROOM_CODE_CHARS[randomInt(ROOM_CODE_CHARS.length)];
    if (!catanRooms.has(code)) return code;
  }
  throw new Error("Không thể tạo mã phòng CATAN, vui lòng thử lại");
};

const membership = (socket: Socket<any, any, any, CatanSocketData>) => {
  const { roomCode, playerId } = socket.data;
  if (!roomCode || !playerId) throw new Error("Bạn chưa tham gia phòng CATAN");
  const room = catanRooms.get(roomCode);
  const player = room?.players.find((entry) => entry.playerId === playerId);
  if (!room || !player) throw new Error("Phòng CATAN không còn tồn tại");
  return { room, player };
};

const emitRoom = (namespace: Namespace, room: CatanRoom): void => {
  room.players.forEach((player) => {
    if (!player.socketId) return;
    namespace.to(player.socketId).emit("catan:room:update", {
      code: room.code,
      hostId: room.hostId,
      selfPlayerId: player.playerId,
      started: room.engine !== null,
      players: room.players.map(({ playerId, name, connected }) => ({ playerId, name, connected })),
    });
  });
};

const emitGame = (namespace: Namespace, room: CatanRoom): void => {
  if (!room.engine?.state) return;
  room.players.forEach((player) => {
    if (player.socketId) namespace.to(player.socketId).emit("catan:game:state", catanViewFor(room.engine!.state!, player.playerId));
  });
};

const removePlayer = (namespace: Namespace, room: CatanRoom, playerId: string): void => {
  const index = room.players.findIndex((player) => player.playerId === playerId);
  if (index < 0) return;
  const [removed] = room.players.splice(index, 1);
  if (removed.disconnectTimer) clearTimeout(removed.disconnectTimer);
  if (room.players.length === 0) {
    catanRooms.delete(room.code);
    return;
  }
  room.engine?.removePlayer(playerId);
  if (room.hostId === playerId) room.hostId = room.players[0].playerId;
  emitRoom(namespace, room);
  emitGame(namespace, room);
};

const reconnect = (namespace: Namespace, socket: Socket<any, any, any, CatanSocketData>): void => {
  const auth = socket.handshake.auth as Record<string, unknown>;
  if (typeof auth.playerId !== "string" || typeof auth.roomCode !== "string") return;
  const room = catanRooms.get(auth.roomCode.trim().toUpperCase());
  const player = room?.players.find((entry) => entry.playerId === auth.playerId);
  if (!room || !player || player.connected) return;
  if (player.disconnectTimer) clearTimeout(player.disconnectTimer);
  player.disconnectTimer = undefined;
  player.connected = true;
  player.socketId = socket.id;
  socket.data = { roomCode: room.code, playerId: player.playerId };
  void socket.join(room.code);
  emitRoom(namespace, room);
  emitGame(namespace, room);
};

export const registerCatanSocket = (io: Server): void => {
  const namespace = io.of("/catan");
  namespace.on("connection", (socket: Socket<any, any, any, CatanSocketData>) => {
    reconnect(namespace, socket);

    socket.on("catan:room:create", async (payload: RoomPayload) => {
      try {
        if (socket.data.roomCode) throw new Error("Bạn đã ở trong một phòng CATAN");
        const name = validateName(payload?.name);
        const code = createCode();
        const playerId = randomUUID();
        const room: CatanRoom = { code, hostId: playerId, engine: null, players: [{ playerId, name, socketId: socket.id, connected: true }] };
        catanRooms.set(code, room);
        socket.data = { roomCode: code, playerId };
        await socket.join(code);
        emitRoom(namespace, room);
      } catch (error) { socket.emit("catan:error", { message: message(error) }); }
    });

    socket.on("catan:room:join", async (payload: RoomPayload) => {
      try {
        if (socket.data.roomCode) throw new Error("Bạn đã ở trong một phòng CATAN");
        const code = validateCode(payload?.code);
        const name = validateName(payload?.name);
        const room = catanRooms.get(code);
        if (!room) throw new Error("Không tìm thấy phòng CATAN");
        if (room.engine) throw new Error("Bàn CATAN đã được khởi tạo");
        if (room.players.length >= 4) throw new Error("Phòng CATAN đã đủ 4 người");
        const playerId = randomUUID();
        room.players.push({ playerId, name, socketId: socket.id, connected: true });
        socket.data = { roomCode: code, playerId };
        await socket.join(code);
        emitRoom(namespace, room);
      } catch (error) { socket.emit("catan:error", { message: message(error) }); }
    });

    socket.on("catan:room:start", () => {
      try {
        const { room, player } = membership(socket);
        if (player.playerId !== room.hostId) throw new Error("Chỉ chủ đảo được khởi tạo bàn CATAN");
        if (room.engine) throw new Error("Bàn CATAN đã được khởi tạo");
        if (room.players.some((entry) => !entry.connected)) throw new Error("Tất cả người chơi phải đang kết nối");
        const engine = new CatanEngine();
        engine.createGame(room.players.map(({ playerId, name }) => ({ id: playerId, name })));
        room.engine = engine;
        emitRoom(namespace, room);
        emitGame(namespace, room);
      } catch (error) { socket.emit("catan:error", { message: message(error) }); }
    });

    socket.on("catan:room:leave", () => {
      try {
        const { room, player } = membership(socket);
        socket.leave(room.code);
        socket.data = {};
        removePlayer(namespace, room, player.playerId);
      } catch (error) { socket.emit("catan:error", { message: message(error) }); }
    });

    socket.on("disconnect", () => {
      const { roomCode, playerId } = socket.data;
      const room = roomCode ? catanRooms.get(roomCode) : undefined;
      const player = room?.players.find((entry) => entry.playerId === playerId);
      if (!room || !player || player.socketId !== socket.id) return;
      player.connected = false;
      player.socketId = null;
      emitRoom(namespace, room);
      player.disconnectTimer = setTimeout(() => removePlayer(namespace, room, player.playerId), RECONNECT_GRACE_MS);
    });
  });
};
