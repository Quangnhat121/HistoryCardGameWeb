/**
 * Sound Engine — Web Audio API synthesized sound effects
 * No external audio files needed. All sounds are generated procedurally.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  // Resume if suspended (autoplay policy)
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// Master volume (0-1)
let masterVolume = 1;

export type BackgroundMusic = "home" | "game";

let requestedMusic: BackgroundMusic | null = null;
let activeMusic: BackgroundMusic | null = null;
let backgroundAudio: HTMLAudioElement | null = null;
let unlockListenersInstalled = false;

const musicFiles: Record<BackgroundMusic, string> = {
  home: "/audio/home-theme.mp3",
  game: "/audio/game-theme.mp3",
};

function musicLevel(mode: BackgroundMusic): number {
  return mode === "home" ? 1 : 1;
}

function updateMusicVolume() {
  if (!backgroundAudio) return;
  const level = requestedMusic ? musicLevel(requestedMusic) : 0;
  backgroundAudio.volume = vol(level);
}

export function setVolume(v: number) {
  masterVolume = Math.max(0, Math.min(1, v));
  updateMusicVolume();
}
export function getVolume() {
  return masterVolume;
}

// Mute toggle
let muted = false;
export function setMuted(m: boolean) {
  muted = m;
  updateMusicVolume();
}
export function isMuted() { return muted; }

function vol(v: number) {
  return muted ? 0 : v * masterVolume;
}

function stopActiveMusic() {
  backgroundAudio?.pause();
  if (backgroundAudio) backgroundAudio.currentTime = 0;
  backgroundAudio = null;
  activeMusic = null;
}

function launchMusic(mode: BackgroundMusic) {
  if (activeMusic === mode && backgroundAudio) {
    void backgroundAudio.play().catch(installMusicUnlock);
    return;
  }

  stopActiveMusic();
  activeMusic = mode;
  backgroundAudio = new Audio(musicFiles[mode]);
  backgroundAudio.loop = true;
  backgroundAudio.preload = "auto";
  updateMusicVolume();
  void backgroundAudio.play().catch(installMusicUnlock);
}

function unlockMusic() {
  if (!requestedMusic) return;
  launchMusic(requestedMusic);
}

function installMusicUnlock() {
  if (unlockListenersInstalled) return;
  unlockListenersInstalled = true;
  const unlock = () => {
    unlockMusic();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    unlockListenersInstalled = false;
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

/** Start or cross over to a looping procedural background track. */
export function startBackgroundMusic(mode: BackgroundMusic) {
  requestedMusic = mode;
  launchMusic(mode);
}

export function stopBackgroundMusic() {
  requestedMusic = null;
  stopActiveMusic();
}

/* ═══════════════════════════════════════════════════════════
   Individual sound effects
   ═══════════════════════════════════════════════════════════ */

/** Card flip – short "whoosh" with a snap */
export function playCardFlip() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Noise burst for the "snap"
  const bufferSize = ctx.sampleRate * 0.06;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 3000;
  noiseFilter.Q.value = 1.5;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(vol(0.12), t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

  noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
  noise.start(t);
  noise.stop(t + 0.06);

  // Subtle tonal "whoosh"
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(400, t + 0.08);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(vol(0.06), t);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

  osc.connect(oscGain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

/** Card place – soft thud with a "tap" */
export function playCardPlace() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Low thud
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol(0.2), t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.15);

  // High tap
  const tap = ctx.createOscillator();
  tap.type = "triangle";
  tap.frequency.setValueAtTime(1200, t);
  tap.frequency.exponentialRampToValueAtTime(600, t + 0.04);

  const tapGain = ctx.createGain();
  tapGain.gain.setValueAtTime(vol(0.08), t);
  tapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

  tap.connect(tapGain).connect(ctx.destination);
  tap.start(t);
  tap.stop(t + 0.05);
}

/** Correct reveal – triumphant ascending chime */
export function playCorrect() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Major chord arpeggio: C5, E5, G5, C6
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const start = t + i * 0.08;
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(vol(0.15), start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.55);
  });

  // Shimmer – high frequency sparkle
  const shimmer = ctx.createOscillator();
  shimmer.type = "sine";
  shimmer.frequency.setValueAtTime(2093, t + 0.32);
  shimmer.frequency.exponentialRampToValueAtTime(3000, t + 0.6);

  const shimmerGain = ctx.createGain();
  shimmerGain.gain.setValueAtTime(0.001, t + 0.32);
  shimmerGain.gain.linearRampToValueAtTime(vol(0.05), t + 0.38);
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

  shimmer.connect(shimmerGain).connect(ctx.destination);
  shimmer.start(t + 0.32);
  shimmer.stop(t + 0.85);
}

/** Wrong reveal – dissonant descending buzz */
export function playWrong() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Two dissonant tones descending
  [220, 233.08].forEach((freq) => {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.4);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol(0.12), t);
    gain.gain.linearRampToValueAtTime(vol(0.14), t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  });

  // Impact noise burst
  const bufferSize = ctx.sampleRate * 0.08;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 800;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(vol(0.15), t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

  noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
  noise.start(t);
  noise.stop(t + 0.1);
}

/** Button click – subtle UI feedback */
export function playClick() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(660, t);
  osc.frequency.exponentialRampToValueAtTime(880, t + 0.03);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol(0.06), t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.06);
}

/** Your turn notification – attention chime */
export function playYourTurn() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Two ascending notes
  [587.33, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const start = t + i * 0.12;
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(vol(0.12), start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.35);
  });
}

/** Game over / Victory fanfare */
export function playVictory() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Triumphant fanfare: G4, B4, D5, G5
  const notes = [392, 493.88, 587.33, 784];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.value = freq * 1.002; // Slight detune for richness

    const gain = ctx.createGain();
    const start = t + i * 0.15;
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(vol(0.13), start + 0.04);
    gain.gain.setValueAtTime(vol(0.13), start + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.9);

    osc.connect(gain).connect(ctx.destination);
    osc2.connect(gain);
    osc.start(start);
    osc2.start(start);
    osc.stop(start + 1);
    osc2.stop(start + 1);
  });
}

/** Defeat / loss sound */
export function playDefeat() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Descending minor: D4, Bb3, G3
  const notes = [293.66, 233.08, 196];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const start = t + i * 0.2;
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(vol(0.1), start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.65);
  });
}

/** Timer warning tick */
export function playTimerTick() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 440;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol(0.04), t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.07);
}

/** Timer danger urgent beep */
export function playTimerUrgent() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.value = 880;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol(0.06), t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.09);
}

/** Player join notification */
export function playPlayerJoin() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(523.25, t);
  osc.frequency.setValueAtTime(659.25, t + 0.08);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol(0.08), t);
  gain.gain.setValueAtTime(vol(0.08), t + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.22);
}
