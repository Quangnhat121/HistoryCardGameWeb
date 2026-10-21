import { ChallengeOverlay } from "./components/ChallengeOverlay";
import { ConnectionBanner } from "./components/ConnectionBanner";
import { useGame } from "./hooks/useGame";
import { GamePage } from "./pages/GamePage";
import { LobbyPage } from "./pages/LobbyPage";
import { ResultPage } from "./pages/ResultPage";
import { WaitingRoomPage } from "./pages/WaitingRoomPage";

export default function App() {
  const game = useGame();
  const selfName = game.room?.players.find((player) => player.playerId === game.room?.selfPlayerId)?.name;

  let page = <LobbyPage onCreate={game.createRoom} onJoin={game.joinRoom} />;
  if (game.room && !game.room.started) page = <WaitingRoomPage room={game.room} onStart={game.startGame} onLeave={game.leaveRoom} />;
  if (game.room?.started && game.game) page = <GamePage room={game.room} game={game.game} timeoutNotice={game.turnTimeoutNotice} onPlace={game.placeCard} onChallenge={game.challenge} onSkipChallenge={game.skipChallenge} />;
  if (game.winnerName) page = <ResultPage winnerName={game.winnerName} isSelf={game.winnerName === selfName} onLobby={game.leaveRoom} />;

  return (
    <div className="min-h-screen bg-ink text-white">
      <ConnectionBanner visible={game.reconnecting || !game.connected} />
      {game.error && <div className="fixed right-3 top-12 z-[90] max-w-sm rounded-xl border border-red-400/30 bg-red-950/95 px-4 py-3 text-sm text-red-100 shadow-xl">{game.error}</div>}
      {page}
      <ChallengeOverlay result={game.challengeVisual} />
    </div>
  );
}
