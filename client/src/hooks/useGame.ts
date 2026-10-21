import { useEffect, useRef, useState } from "react";
import { clearSession, rememberSession, socket } from "../socket";
import type { ChallengeResult, ChallengeVisual, GameState, RoomState } from "../types";

export const useGame = () => {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [challengeVisual, setChallengeVisual] = useState<ChallengeVisual | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnTimeoutNotice, setTurnTimeoutNotice] = useState<string | null>(null);
  const [connected, setConnected] = useState(socket.connected);
  const [reconnecting, setReconnecting] = useState(!socket.connected);
  const gameRef = useRef<GameState | null>(null);
  const pendingChallengeRef = useRef<ChallengeResult | null>(null);
  const delayedStateTimerRef = useRef<number | null>(null);
  const timeoutNoticeTimerRef = useRef<number | null>(null);

  useEffect(() => { gameRef.current = game; }, [game]);

  useEffect(() => {
    const onConnect = () => { setConnected(true); setReconnecting(false); };
    const onDisconnect = () => { setConnected(false); setReconnecting(true); };
    const onReconnectAttempt = () => setReconnecting(true);
    const onRoomUpdate = (nextRoom: RoomState) => {
      rememberSession(nextRoom.selfPlayerId, nextRoom.code);
      setRoom(nextRoom);
    };
    const onGameState = (incomingState: GameState) => {
      const state: GameState = {
        ...incomingState,
        turnDeadline: incomingState.turnDeadline === null
          ? null
          : Date.now() + Math.max(0, incomingState.turnDeadline - incomingState.serverNow),
      };
      const pendingResult = pendingChallengeRef.current;
      pendingChallengeRef.current = null;
      if (pendingResult && !pendingResult.correct) {
        delayedStateTimerRef.current = window.setTimeout(() => {
          setGame(state);
          delayedStateTimerRef.current = null;
        }, 1400);
        return;
      }
      setGame(state);
    };
    const onChallenge = (result: ChallengeResult) => {
      pendingChallengeRef.current = result;
      const previous = gameRef.current?.lastPlaced;
      if (previous?.cardId === result.cardId)
        setChallengeVisual({ ...result, card: previous });
      window.setTimeout(() => setChallengeVisual(null), 1800);
    };
    const onGameOver = ({ winnerName: name }: { winnerName: string }) => {
      setWinnerName(name);
    };
    const onTurnTimeout = ({ playerName }: { playerId: string; playerName: string }) => {
      setTurnTimeoutNotice(`${playerName} hết giờ và mất lượt`);
      if (timeoutNoticeTimerRef.current !== null) window.clearTimeout(timeoutNoticeTimerRef.current);
      timeoutNoticeTimerRef.current = window.setTimeout(() => {
        setTurnTimeoutNotice(null);
        timeoutNoticeTimerRef.current = null;
      }, 3_500);
    };
    const onError = ({ message }: { message: string }) => {
      setError(message);
      window.setTimeout(() => setError(null), 4500);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.on("room:update", onRoomUpdate);
    socket.on("game:state", onGameState);
    socket.on("game:challengeResult", onChallenge);
    socket.on("game:over", onGameOver);
    socket.on("game:turnTimeout", onTurnTimeout);
    socket.on("error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.off("room:update", onRoomUpdate);
      socket.off("game:state", onGameState);
      socket.off("game:challengeResult", onChallenge);
      socket.off("game:over", onGameOver);
      socket.off("game:turnTimeout", onTurnTimeout);
      socket.off("error", onError);
      if (delayedStateTimerRef.current !== null) window.clearTimeout(delayedStateTimerRef.current);
      if (timeoutNoticeTimerRef.current !== null) window.clearTimeout(timeoutNoticeTimerRef.current);
    };
  }, []);

  const createRoom = (name: string) => socket.emit("room:create", { name });
  const joinRoom = (code: string, name: string) => socket.emit("room:join", { code, name });
  const startGame = () => socket.emit("room:start");
  const placeCard = (cardId: number, index: number) => socket.emit("game:place", { cardId, index });
  const challenge = (cardId: number) => socket.emit("game:challenge", { cardId });
  const skipChallenge = () => socket.emit("game:skipChallenge");
  const leaveRoom = () => {
    socket.emit("room:leave");
    clearSession();
    setRoom(null);
    setGame(null);
    setWinnerName(null);
    setChallengeVisual(null);
    setTurnTimeoutNotice(null);
  };

  return {
    room, game, winnerName, challengeVisual, turnTimeoutNotice, error,
    connected, reconnecting, createRoom, joinRoom, startGame,
    placeCard, challenge, skipChallenge, leaveRoom,
  };
};
