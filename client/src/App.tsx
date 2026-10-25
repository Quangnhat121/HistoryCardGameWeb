import { useEffect, useState } from "react";
import { ChallengeOverlay } from "./components/ChallengeOverlay";
import { ConnectionBanner } from "./components/ConnectionBanner";
import { SoundToggle } from "./components/SoundToggle";
import { VoiceChat } from "./components/VoiceChat";
import { useGame } from "./hooks/useGame";
import { GamePage } from "./pages/GamePage";
import { CardsPage } from "./pages/CardsPage";
import { LobbyPage } from "./pages/LobbyPage";
import { ResultPage } from "./pages/ResultPage";
import { RulesPage } from "./pages/RulesPage";
import { WaitingRoomPage } from "./pages/WaitingRoomPage";
import { startBackgroundMusic, stopBackgroundMusic } from "./sounds";
import { GameHubPage } from "./pages/GameHubPage";
import { useCatan } from "./games/catan/hooks/useCatan";
import { CatanMenuPage } from "./games/catan/pages/CatanMenuPage";
import { CatanWaitingRoomPage } from "./games/catan/pages/CatanWaitingRoomPage";
import { CatanGamePage } from "./games/catan/pages/CatanGamePage";
import { CatanLocalGamePage } from "./games/catan/pages/CatanLocalGamePage";
import { CatanLocalSetupPage } from "./games/catan/pages/CatanLocalSetupPage";
import { APP_ROUTES, resolveAppPage, type AppRoute, type GameCatalogEntry } from "./games/catalog";

interface AppHistoryState {
  historyGamesNavigation?: true;
  from?: string;
}

export default function App() {
  const game = useGame();
  const [pageHash, setPageHash] = useState(() => window.location.hash);
  const [localPlayers, setLocalPlayers] = useState<string[] | null>(null);
  const appPage = resolveAppPage(pageHash);
  const catan = useCatan(appPage === "catan");
  const [speakingPlayerIds, setSpeakingPlayerIds] = useState<string[]>([]);
  const selfName = game.room?.players.find((player) => player.playerId === game.room?.selfPlayerId)?.name;
  const selfReturned = game.room?.players.find((player) => player.playerId === game.room?.selfPlayerId)?.returnedToRoom === true;
  const musicMode = game.room?.started && game.game ? "game" : "home";

  useEffect(() => {
    startBackgroundMusic(musicMode);
    return () => stopBackgroundMusic();
  }, [musicMode]);

  useEffect(() => {
    const syncPageWithHash = () => setPageHash(window.location.hash);
    window.addEventListener("hashchange", syncPageWithHash);
    window.addEventListener("popstate", syncPageWithHash);
    return () => {
      window.removeEventListener("hashchange", syncPageWithHash);
      window.removeEventListener("popstate", syncPageWithHash);
    };
  }, []);

  useEffect(() => {
    const anchorId = pageHash === "#play" ? "play" : pageHash === "#top" ? "top" : null;
    if (!anchorId) return;
    const frame = window.requestAnimationFrame(() => document.getElementById(anchorId)?.scrollIntoView());
    return () => window.cancelAnimationFrame(frame);
  }, [pageHash]);

  const navigate = (route: AppRoute) => {
    if (window.location.hash === route) return;
    window.history.pushState({ historyGamesNavigation: true, from: pageHash } satisfies AppHistoryState, "", route);
    setPageHash(route);
  };
  const navigateBack = (fallback: AppRoute) => {
    const state = window.history.state as AppHistoryState | null;
    if (state?.historyGamesNavigation && state.from !== undefined) window.history.back();
    else navigate(fallback);
  };
  const openCards = () => navigate(APP_ROUTES.cards);
  const openRules = () => navigate(APP_ROUTES.rules);
  const closeTimelinePage = () => navigateBack(APP_ROUTES.timeline);
  const openHub = () => navigateBack(APP_ROUTES.hub);
  const openGame = (selectedGame: GameCatalogEntry) => navigate(selectedGame.route);

  let page = appPage === "cards"
    ? <CardsPage onBack={closeTimelinePage} />
    : appPage === "rules"
      ? <RulesPage onBack={closeTimelinePage} onBrowseCards={openCards} />
      : appPage === "timeline"
        ? <LobbyPage onCreate={game.createRoom} onJoin={game.joinRoom} onBrowseCards={openCards} onBrowseRules={openRules} onBackToHub={openHub} />
        : appPage === "catan"
          ? <CatanMenuPage connected={catan.connected} onCreate={catan.createRoom} onJoin={catan.joinRoom} onBack={openHub} onPlayLocal={() => navigate(APP_ROUTES.catanLocal)} />
          : appPage === "catanLocal"
            ? localPlayers
              ? <CatanLocalGamePage names={localPlayers} onExit={() => { setLocalPlayers(null); navigate(APP_ROUTES.catan); }} />
              : <CatanLocalSetupPage onStart={setLocalPlayers} onBack={() => navigateBack(APP_ROUTES.catan)} />
          : <GameHubPage onOpenGame={openGame} />;
  if (game.room && (!game.room.started || selfReturned)) page = <WaitingRoomPage room={game.room} speakingPlayerIds={speakingPlayerIds} onStart={game.startGame} onLeave={game.leaveRoom} />;
  if (game.room?.started && game.game && !selfReturned) page = <GamePage room={game.room} game={game.game} timeoutNotice={game.turnTimeoutNotice} speakingPlayerIds={speakingPlayerIds} onPlace={game.placeCard} onChallenge={game.challenge} onSkipChallenge={game.skipChallenge} />;
  if (game.winnerName && !selfReturned) page = <ResultPage winnerName={game.winnerName} isSelf={game.winnerName === selfName} onRematch={game.returnToRoom} onLeave={game.leaveRoom} />;
  if (!game.room && catan.room && !catan.room.started) page = <CatanWaitingRoomPage room={catan.room} onStart={catan.startGame} onLeave={catan.leaveRoom} />;
  if (!game.room && catan.room?.started && catan.game) page = <CatanGamePage room={catan.room} game={catan.game} onLeave={catan.leaveRoom} />;

  return (
    <div className="min-h-screen bg-ink text-white">
      <ConnectionBanner visible={appPage !== "catanLocal" && (game.reconnecting || !game.connected)} />
      {appPage !== "catanLocal" && game.error && <div className="fixed right-3 top-12 z-[90] max-w-sm rounded-xl border border-red-400/30 bg-red-950/95 px-4 py-3 text-sm text-red-100 shadow-xl">{game.error}</div>}
      {appPage === "catan" && catan.error && <div className="fixed right-3 top-12 z-[90] max-w-sm rounded-xl border border-red-400/30 bg-red-950/95 px-4 py-3 text-sm text-red-100 shadow-xl">{catan.error}</div>}
      {page}
      <ChallengeOverlay result={game.challengeVisual} />
      {game.room && <VoiceChat room={game.room} onSpeakingPlayersChange={setSpeakingPlayerIds} />}
      <SoundToggle />
    </div>
  );
}
