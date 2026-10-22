import { io } from "socket.io-client";

export const SERVER_URL = (import.meta.env.VITE_SERVER_URL as string | undefined)?.replace(/\/$/, "") ?? "";

const savedPlayerId = localStorage.getItem("history-player-id");
const savedRoomCode = localStorage.getItem("history-room-code");

export const socket = io(SERVER_URL || window.location.origin, {
  autoConnect: true,
  transports: ["websocket"],
  path: (import.meta.env.VITE_SOCKET_PATH as string | undefined) || "/socket.io",
  reconnection: true,
  reconnectionDelay: 600,
  reconnectionDelayMax: 4_000,
  auth: {
    playerId: savedPlayerId ?? undefined,
    roomCode: savedRoomCode ?? undefined,
  },
});

export const rememberSession = (playerId: string, roomCode: string): void => {
  localStorage.setItem("history-player-id", playerId);
  localStorage.setItem("history-room-code", roomCode);
  socket.auth = { playerId, roomCode };
};

export const clearSession = (): void => {
  localStorage.removeItem("history-player-id");
  localStorage.removeItem("history-room-code");
  socket.auth = {};
};

const toWebpPath = (path: string): string => path.replace(/\.png$/i, ".webp");

export const assetUrl = (path: string): string =>
  path.startsWith("http") ? path : `${SERVER_URL}${toWebpPath(path)}`;

export const thumbnailAssetUrl = (path: string): string => {
  if (path.startsWith("http")) return path;
  const filename = toWebpPath(path).split("/").pop();
  return `${SERVER_URL}/cards/thumbs/${filename}`;
};
