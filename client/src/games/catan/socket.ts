import { io } from "socket.io-client";
import { SERVER_URL } from "../../socket";

const playerId = localStorage.getItem("catan-player-id");
const roomCode = localStorage.getItem("catan-room-code");

export const catanSocket = io(`${SERVER_URL || window.location.origin}/catan`, {
  autoConnect: false,
  transports: ["websocket"],
  path: (import.meta.env.VITE_SOCKET_PATH as string | undefined) || "/socket.io",
  reconnection: true,
  reconnectionDelay: 600,
  reconnectionDelayMax: 4_000,
  auth: { playerId: playerId ?? undefined, roomCode: roomCode ?? undefined },
});

export const rememberCatanSession = (nextPlayerId: string, nextRoomCode: string): void => {
  localStorage.setItem("catan-player-id", nextPlayerId);
  localStorage.setItem("catan-room-code", nextRoomCode);
  catanSocket.auth = { playerId: nextPlayerId, roomCode: nextRoomCode };
};

export const clearCatanSession = (): void => {
  localStorage.removeItem("catan-player-id");
  localStorage.removeItem("catan-room-code");
  catanSocket.auth = {};
};
