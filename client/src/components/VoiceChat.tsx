import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import type { RoomState } from "../types";

interface VoiceConfigPayload { iceServers?: RTCIceServer[] }
interface VoiceDescriptionPayload { fromPlayerId: string; description: RTCSessionDescriptionInit }
interface VoiceIcePayload { fromPlayerId: string; candidate: RTCIceCandidateInit | null }

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] },
];

function RemoteAudio({ stream, deafened }: { stream: MediaStream; deafened: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = stream;
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline muted={deafened} />;
}

function MicrophoneIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v5a4 4 0 0 0 4 4Z" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v3M9 21h6" />
      {off && <path className="voice-slash" d="M3 3l18 18" />}
    </svg>
  );
}

function HeadphonesIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 1 2-2h1v7H6a2 2 0 0 1-2-2v-3ZM20 14a2 2 0 0 0-2-2h-1v7h1a2 2 0 0 0 2-2v-3Z" />
      {off && <path className="voice-slash" d="M3 3l18 18" />}
    </svg>
  );
}

export function VoiceChat({ room }: { room: RoomState }) {
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const queuedIceRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const playersRef = useRef(room.players);

  useEffect(() => {
    playersRef.current = room.players;
    const activeIds = new Set(room.players.map((player) => player.playerId));
    for (const [playerId, peer] of peersRef.current) {
      if (activeIds.has(playerId)) continue;
      peer.close();
      peersRef.current.delete(playerId);
      queuedIceRef.current.delete(playerId);
      setRemoteStreams((current) => {
        const { [playerId]: _removed, ...rest } = current;
        return rest;
      });
    }
    if (localStreamRef.current) socket.emit("voice:ready");
  }, [room.players]);

  useEffect(() => {
    let disposed = false;
    let iceServers = DEFAULT_ICE_SERVERS;
    let resolveMediaReady: () => void = () => undefined;
    const mediaReady = new Promise<void>((resolve) => { resolveMediaReady = resolve; });

    const removePeer = (playerId: string) => {
      peersRef.current.get(playerId)?.close();
      peersRef.current.delete(playerId);
      queuedIceRef.current.delete(playerId);
      setRemoteStreams((current) => {
        const { [playerId]: _removed, ...rest } = current;
        return rest;
      });
    };

    const ensurePeer = (playerId: string): RTCPeerConnection => {
      const existing = peersRef.current.get(playerId);
      if (existing) return existing;

      const peer = new RTCPeerConnection({ iceServers });
      localStreamRef.current?.getTracks().forEach((track) => peer.addTrack(track, localStreamRef.current!));
      peer.onicecandidate = ({ candidate }) => {
        socket.emit("voice:ice", { targetPlayerId: playerId, candidate: candidate?.toJSON() ?? null });
      };
      peer.ontrack = ({ streams }) => {
        const [stream] = streams;
        if (stream) setRemoteStreams((current) => ({ ...current, [playerId]: stream }));
      };
      peer.onconnectionstatechange = () => {
        if (["failed", "closed"].includes(peer.connectionState)) removePeer(playerId);
      };
      peersRef.current.set(playerId, peer);
      return peer;
    };

    const flushIce = async (playerId: string, peer: RTCPeerConnection) => {
      const candidates = queuedIceRef.current.get(playerId) ?? [];
      queuedIceRef.current.delete(playerId);
      for (const candidate of candidates) await peer.addIceCandidate(candidate);
    };

    const createOffer = async (playerId: string) => {
      if (!localStreamRef.current || playerId === room.selfPlayerId) return;
      const peer = ensurePeer(playerId);
      if (peer.signalingState !== "stable") return;
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("voice:offer", { targetPlayerId: playerId, description: peer.localDescription });
    };

    const onConfig = async ({ iceServers: configuredServers }: VoiceConfigPayload) => {
      if (configuredServers?.length) iceServers = configuredServers;
      if (localStreamRef.current || disposed) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        });
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        setPermissionError(false);
        socket.emit("voice:ready");
        for (const player of playersRef.current) {
          if (player.connected && room.selfPlayerId.localeCompare(player.playerId) < 0)
            void createOffer(player.playerId);
        }
      } catch {
        setPermissionError(true);
        setMuted(true);
      } finally {
        resolveMediaReady();
      }
    };

    const onReady = ({ playerId }: { playerId: string }) => {
      if (room.selfPlayerId.localeCompare(playerId) < 0) void createOffer(playerId);
    };
    const onOffer = async ({ fromPlayerId, description }: VoiceDescriptionPayload) => {
      await mediaReady;
      if (disposed) return;
      const peer = ensurePeer(fromPlayerId);
      await peer.setRemoteDescription(description);
      await flushIce(fromPlayerId, peer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("voice:answer", { targetPlayerId: fromPlayerId, description: peer.localDescription });
    };
    const onAnswer = async ({ fromPlayerId, description }: VoiceDescriptionPayload) => {
      const peer = peersRef.current.get(fromPlayerId);
      if (!peer) return;
      await peer.setRemoteDescription(description);
      await flushIce(fromPlayerId, peer);
    };
    const onIce = async ({ fromPlayerId, candidate }: VoiceIcePayload) => {
      if (!candidate) return;
      const peer = peersRef.current.get(fromPlayerId);
      if (peer?.remoteDescription) await peer.addIceCandidate(candidate);
      else queuedIceRef.current.set(fromPlayerId, [...(queuedIceRef.current.get(fromPlayerId) ?? []), candidate]);
    };
    const onLeft = ({ playerId }: { playerId: string }) => removePeer(playerId);

    socket.on("voice:config", onConfig);
    socket.on("voice:ready", onReady);
    socket.on("voice:offer", onOffer);
    socket.on("voice:answer", onAnswer);
    socket.on("voice:ice", onIce);
    socket.on("voice:left", onLeft);
    socket.emit("voice:getConfig");

    return () => {
      disposed = true;
      socket.off("voice:config", onConfig);
      socket.off("voice:ready", onReady);
      socket.off("voice:offer", onOffer);
      socket.off("voice:answer", onAnswer);
      socket.off("voice:ice", onIce);
      socket.off("voice:left", onLeft);
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      peersRef.current.forEach((peer) => peer.close());
      peersRef.current.clear();
      queuedIceRef.current.clear();
      setRemoteStreams({});
    };
  }, [room.code, room.selfPlayerId]);

  const toggleMicrophone = () => {
    const nextMuted = !muted;
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
    setMuted(nextMuted);
  };

  return (
    <div className="voice-controls" aria-label="Điều khiển voice chat">
      <button
        type="button"
        className={muted || permissionError ? "is-off" : "is-on"}
        onClick={toggleMicrophone}
        disabled={permissionError}
        aria-pressed={muted}
        aria-label={permissionError ? "Không có quyền dùng micro" : muted ? "Bật micro" : "Tắt micro"}
        title={permissionError ? "Hãy cấp quyền micro trong trình duyệt" : muted ? "Bật micro" : "Tắt micro"}
      >
        <MicrophoneIcon off={muted || permissionError} />
      </button>
      <button
        type="button"
        className={deafened ? "is-off" : "is-on"}
        onClick={() => setDeafened((value) => !value)}
        aria-pressed={deafened}
        aria-label={deafened ? "Bật nghe voice" : "Tắt nghe voice"}
        title={deafened ? "Bật nghe voice" : "Tắt nghe voice"}
      >
        <HeadphonesIcon off={deafened} />
      </button>
      <span className="voice-status" aria-hidden="true" data-error={permissionError || undefined} />
      {Object.entries(remoteStreams).map(([playerId, stream]) => (
        <RemoteAudio key={playerId} stream={stream} deafened={deafened} />
      ))}
    </div>
  );
}
