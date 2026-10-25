import { useEffect, useState } from "react";
import { catanSocket, clearCatanSession, rememberCatanSession } from "../socket";
import type { CatanGameState, CatanRoomState } from "../types";

export const useCatan = (active: boolean) => {
  const [room, setRoom] = useState<CatanRoomState | null>(null);
  const [game, setGame] = useState<CatanGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(catanSocket.connected);

  useEffect(() => {
    if (!active) return;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onRoomUpdate = (nextRoom: CatanRoomState) => {
      rememberCatanSession(nextRoom.selfPlayerId, nextRoom.code);
      setRoom(nextRoom);
      if (!nextRoom.started) setGame(null);
    };
    const onGameState = (state: CatanGameState) => setGame(state);
    const onError = ({ message }: { message: string }) => {
      setError(message);
      window.setTimeout(() => setError(null), 4_500);
    };

    catanSocket.on("connect", onConnect);
    catanSocket.on("disconnect", onDisconnect);
    catanSocket.on("catan:room:update", onRoomUpdate);
    catanSocket.on("catan:game:state", onGameState);
    catanSocket.on("catan:error", onError);
    catanSocket.connect();

    return () => {
      catanSocket.disconnect();
      catanSocket.off("connect", onConnect);
      catanSocket.off("disconnect", onDisconnect);
      catanSocket.off("catan:room:update", onRoomUpdate);
      catanSocket.off("catan:game:state", onGameState);
      catanSocket.off("catan:error", onError);
      setConnected(false);
    };
  }, [active]);

  const createRoom = (name: string) => catanSocket.emit("catan:room:create", { name });
  const joinRoom = (code: string, name: string) => catanSocket.emit("catan:room:join", { code, name });
  const startGame = () => catanSocket.emit("catan:room:start");
  const leaveRoom = () => {
    catanSocket.emit("catan:room:leave");
    clearCatanSession();
    setRoom(null);
    setGame(null);
  };

  return { room, game, error, connected, createRoom, joinRoom, startGame, leaveRoom };
};
