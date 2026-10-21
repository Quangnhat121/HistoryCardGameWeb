import { io, Socket } from "socket.io-client";
import { cardsData } from "../src/seed/cards.data";

const serverUrl = process.env.SOCKET_TEST_URL ?? "http://localhost:3000";
const yearByCardId = new Map(cardsData.map((card) => [card.cardId, card.year]));

interface RoomUpdate {
  code: string;
  selfPlayerId: string;
}

interface FrontCard {
  cardId: number;
}

interface GameState {
  players: Array<{ id: string; hand?: FrontCard[] }>;
  rootCard: { year: number };
  lastPlaced: { cardId: number } | null;
  timeline: Array<{ cardId: number }>;
  currentPlayerId: string;
  phase: "turn" | "awaiting_verdict" | "finished";
  winner: string | null;
}

interface ClientContext {
  socket: Socket;
  playerId: string;
  latestState?: GameState;
}

const waitForConnect = (socket: Socket): Promise<void> =>
  new Promise((resolve, reject) => {
    socket.once("connect", () => resolve());
    socket.once("connect_error", reject);
  });

const waitForRoom = (socket: Socket): Promise<RoomUpdate> =>
  new Promise((resolve) => socket.once("room:update", resolve));

const main = async (): Promise<void> => {
  const first: ClientContext = { socket: io(serverUrl, { transports: ["websocket"] }), playerId: "" };
  const second: ClientContext = { socket: io(serverUrl, { transports: ["websocket"] }), playerId: "" };
  const clients = [first, second];
  let actionLocked = false;

  await Promise.all(clients.map(({ socket }) => waitForConnect(socket)));

  const firstRoomPromise = waitForRoom(first.socket);
  first.socket.emit("room:create", { name: "Socket Tester 1" });
  const firstRoom = await firstRoomPromise;
  first.playerId = firstRoom.selfPlayerId;

  const secondRoomPromise = waitForRoom(second.socket);
  second.socket.emit("room:join", { code: firstRoom.code, name: "Socket Tester 2" });
  const secondRoom = await secondRoomPromise;
  second.playerId = secondRoom.selfPlayerId;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Socket smoke test quá thời gian 120 giây")), 120_000);

    for (const client of clients) {
      client.socket.on("error", ({ message }: { message: string }) => reject(new Error(message)));
      client.socket.on("game:state", (state: GameState) => {
        client.latestState = state;
        if (
          actionLocked ||
          state.currentPlayerId !== client.playerId ||
          (state.winner !== null && state.lastPlaced === null)
        ) return;

        actionLocked = true;
        setTimeout(() => {
          if (state.lastPlaced) {
            client.socket.emit("game:challenge", { cardId: state.lastPlaced.cardId });
          } else {
            const ownHand = state.players.find((player) => player.id === client.playerId)?.hand;
            const card = ownHand?.[0];
            if (!card) return reject(new Error("Không tìm thấy thẻ trên tay người đang đi lượt"));
            const year = yearByCardId.get(card.cardId);
            if (year === undefined) return reject(new Error(`Không có năm cho cardId ${card.cardId}`));
            const index = state.timeline.findIndex((entry) => {
              const entryYear = yearByCardId.get(entry.cardId);
              return entryYear !== undefined && entryYear > year;
            });
            client.socket.emit("game:place", { cardId: card.cardId, index: index === -1 ? state.timeline.length : index });
          }
          actionLocked = false;
        }, 10);
      });
      client.socket.once("game:over", ({ winnerName }: { winnerName: string }) => {
        clearTimeout(timeout);
        console.log(`Socket smoke test thành công. Người thắng: ${winnerName}`);
        resolve();
      });
    }

    first.socket.emit("room:start");
  });

  for (const { socket } of clients) socket.disconnect();
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
