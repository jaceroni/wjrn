import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { NowPlaying } from "../types";
import defaultArt from "../assets/images/jacewon-thumbnail.jpg";
import wjrnThumbnail from "../assets/images/wjrn-thumbnail.jpg";

// ---------------------------------------------------------------------------
// Internal station map — stream URLs & shortcodes only (no visual assets)
// ---------------------------------------------------------------------------

const AZURACAST_HOST = "https://radio.jacewonmusic.com";

const STATION_STREAM_MAP: Record<string, { streamUrl: string; shortcode: string; name: string }> = {
  wjrn: {
    streamUrl: "https://radio.jacewonmusic.com/listen/wjrn/radio.mp3",
    shortcode: "wjrn",
    name: "WJRN",
  },
  rock_garden: {
    streamUrl: "https://radio.jacewonmusic.com/listen/the_rock_garden/radio.mp3",
    shortcode: "the_rock_garden",
    name: "THE ROCK GARDEN",
  },
  bridge_city: {
    streamUrl: "https://radio.jacewonmusic.com/listen/bridge_city_hang_suite/radio.mp3",
    shortcode: "bridge_city_hang_suite",
    name: "BRIDGE CITY HANG SUITE",
  },
  golden_boombox: {
    streamUrl: "https://radio.jacewonmusic.com/listen/golden_boombox_sessions/radio.mp3",
    shortcode: "golden_boombox_sessions",
    name: "THE GOLDEN BOOMBOX",
  },
};

// Deterministic-but-organically-fluctuating "listener count" per station, shown
// in place of the real (currently very low) Azuracast listener totals. It's a
// continuous function of wall-clock time rather than a fresh random draw, so a
// page refresh a few seconds or minutes later shows a number close to what was
// there before, while still drifting naturally over longer stretches — never a
// jarring jump. Range is bounded to (roughly) 50-150, with a different phase
// per station so the three don't move in lockstep.
function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function fakeListenerCount(stationId: string, min = 50, max = 150): number {
  const seed = hashSeed(stationId);
  const t = Date.now() / 1000;
  const phase1 = seed % 1000;
  const phase2 = (seed * 7) % 1000;
  const phase3 = (seed * 13) % 1000;
  const wave =
    Math.sin(t / 3000 + phase1) * 0.6 +
    Math.sin(t / 900 + phase2) * 0.3 +
    Math.sin(t / 300 + phase3) * 0.1;
  const mid = (min + max) / 2;
  const amplitude = (max - min) / 2;
  return Math.min(max - 1, Math.max(min + 1, Math.round(mid + wave * amplitude)));
}

// Fallback mock track data for when Azuracast is unreachable
const MOCK_PLAYLISTS: Record<string, Array<{ title: string; artist: string; album: string; nextTitle: string; nextArtist: string }>> = {
  wjrn: [
    { title: "Instrumental Groove", artist: "WJRN", album: "Work/Lurk", nextTitle: "Funk Session", nextArtist: "WJRN" }
  ],
  rock_garden: [
    { title: "Riders on the Storm", artist: "The Doors", album: "L.A. Woman", nextTitle: "Sunshine of Your Love", nextArtist: "Cream" },
    { title: "Whole Lotta Love", artist: "Led Zeppelin", album: "Led Zeppelin II", nextTitle: "Purple Haze", nextArtist: "Jimi Hendrix" },
    { title: "Superstition", artist: "Stevie Wonder", album: "Talking Book", nextTitle: "Feelin' Alright", nextArtist: "Joe Cocker" },
    { title: "Sultans of Swing", artist: "Dire Straits", album: "Dire Straits", nextTitle: "Gimme Shelter", nextArtist: "The Rolling Stones" },
  ],
  bridge_city: [
    { title: "Find Your Way Back", artist: "Kem", album: "Album II", nextTitle: "Prototype", nextArtist: "Outkast" },
    { title: "Golden", artist: "Jill Scott", album: "Beautifully Human", nextTitle: "If I Ain't Got You", nextArtist: "Alicia Keys" },
    { title: "Untitled (How Does It Feel)", artist: "D'Angelo", album: "Voodoo", nextTitle: "On & On", nextArtist: "Erykah Badu" },
    { title: "Adorn", artist: "Miguel", album: "Kaleidoscope Dream", nextTitle: "What You Don't Do", nextArtist: "Lianne La Havas" },
  ],
  golden_boombox: [
    { title: "C.R.E.A.M.", artist: "Wu-Tang Clan", album: "Enter the Wu-Tang", nextTitle: "N.Y. State of Mind", nextArtist: "Nas" },
    { title: "Juicy", artist: "The Notorious B.I.G.", album: "Ready to Die", nextTitle: "The Next Episode", nextArtist: "Dr. Dre" },
    { title: "Mass Appeal", artist: "Gang Starr", album: "Hard to Earn", nextTitle: "Electric Relaxation", nextArtist: "A Tribe Called Quest" },
    { title: "Passin' Me By", artist: "The Pharcyde", album: "Bizarre Ride II the Pharcyde", nextTitle: "Resurrection", nextArtist: "Common" },
  ],
};

// Initial mock metadata shown before the Azuracast API responds
const INITIAL_METADATA: Record<string, NowPlaying> = {
  wjrn: {
    trackTitle: "Lurk and Work Soundtrack",
    trackArtist: "WJRN",
    album: "Instrumental 24/7",
    artUrl: wjrnThumbnail,
    listeners: fakeListenerCount("wjrn"),
    isPlayingLive: false,
    isOnline: true,
    nextTrack: null,
  },
  rock_garden: {
    trackTitle: "Riders on the Storm",
    trackArtist: "The Doors",
    album: "L.A. Woman",
    artUrl: "https://picsum.photos/seed/rockgarden/300/300",
    listeners: fakeListenerCount("rock_garden"),
    isPlayingLive: false,
    isOnline: true,
    nextTrack: { title: "Sunshine of Your Love", artist: "Cream" },
  },
  bridge_city: {
    trackTitle: "Find Your Way Back",
    trackArtist: "Kem",
    album: "Album II",
    artUrl: "https://picsum.photos/seed/bridgecity/300/300",
    listeners: fakeListenerCount("bridge_city"),
    isPlayingLive: true,
    isOnline: true,
    nextTrack: { title: "Prototype", artist: "Outkast" },
  },
  golden_boombox: {
    trackTitle: "C.R.E.A.M.",
    trackArtist: "Wu-Tang Clan",
    album: "Enter the Wu-Tang (36 Chambers)",
    artUrl: "https://picsum.photos/seed/goldenboom/300/300",
    listeners: fakeListenerCount("golden_boombox"),
    isPlayingLive: false,
    isOnline: true,
    nextTrack: { title: "N.Y. State of Mind", artist: "Nas" },
  },
};

// ---------------------------------------------------------------------------
// Shared utility
// ---------------------------------------------------------------------------

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// On-demand episode type
// ---------------------------------------------------------------------------

export interface OnDemandItem {
  id: string;
  title: string;
  art: string;
  streamUrl: string;
  stationId: string;
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface PlayerContextValue {
  activeStationId: string | null;
  setActiveStationId: (id: string | null) => void;
  audioState: "idle" | "connecting" | "playing" | "error";
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  metadata: Record<string, NowPlaying>;
  toggleStation: (stationId: string) => void;
  togglePlayback: () => void;
  stopPlayback: () => void;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  // Real-time frequency data for whatever is actually audible right now —
  // lets any UI (e.g. the embedded vintage player) drive a truthful VU meter
  // off the one real audio graph instead of needing its own local playback.
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  // On-demand
  onDemandItem: OnDemandItem | null;
  isOnDemand: boolean;
  playEpisode: (ep: OnDemandItem) => void;
  seekBackward: () => void;
  seekForward: () => void;
  seekToStart: () => void;
  onDemandCurrentTime: number;
  onDemandDuration: number;
  // EQ — remote-controlled by the vintage player's knobs, applied to the one
  // real shared audio graph so the effect is genuinely audible everywhere.
  eqBassCut: boolean;
  setEqBassCut: (cut: boolean) => void;
  eqMidCut: boolean;
  setEqMidCut: (cut: boolean) => void;
  eqTrebleCut: boolean;
  setEqTrebleCut: (cut: boolean) => void;
  eqLoudness: boolean;
  setEqLoudness: (on: boolean) => void;
  eqMono: boolean;
  setEqMono: (on: boolean) => void;
  eqBalance: 0 | 1 | 2;
  setEqBalance: (state: 0 | 1 | 2) => void;
  // Mini-player bar — exposed so page layouts (footers) can reserve space for it
  displayStationId: string | null;
  isMiniPlayerVisible: boolean;
  dismissMiniPlayer: () => void;
  // Sum of the 3 advertised stations' listener counts (excludes the unlisted
  // "wjrn" default stream) — shown in each page header's "Broadcasting to..." line.
  totalListeners: number;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within a <PlayerProvider>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [audioState, setAudioState] = useState<"idle" | "connecting" | "playing" | "error">("idle");
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [hasFetchedLive, setHasFetchedLive] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, NowPlaying>>(INITIAL_METADATA);
  const [onDemandItem, setOnDemandItem] = useState<OnDemandItem | null>(null);
  const [onDemandCurrentTime, setOnDemandCurrentTime] = useState(0);
  const [onDemandDuration, setOnDemandDuration] = useState(0);

  // Mini-player bar visibility — stays populated (paused) after the first play
  // until explicitly dismissed, so pages can reserve space for it (e.g. the
  // footer dropping below it) without duplicating this logic themselves.
  const [isMiniPlayerDismissed, setIsMiniPlayerDismissed] = useState(false);
  const lastStationRef = useRef<string | null>(null);
  if (activeStationId) {
    lastStationRef.current = activeStationId;
    if (isMiniPlayerDismissed) setIsMiniPlayerDismissed(false);
  }
  const displayStationId = activeStationId ?? lastStationRef.current;
  const isMiniPlayerVisible = displayStationId !== null && !isMiniPlayerDismissed;
  const dismissMiniPlayer = () => {
    stopPlayback();
    setIsMiniPlayerDismissed(true);
  };

  // Single audio element that persists for the lifetime of the app session
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Debounce timer for seek operations
  const seekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether playback is *intended* to be active — distinct from audio.paused,
  // which is also true in the brief window before the very first play() resolves.
  // A live stream keeps buffering (and re-firing 'canplay') even while genuinely
  // paused; without this guard oncanplay's retry-play below would silently resume
  // playback right after the user pauses, leaving audioState stuck out of sync with
  // activeStationId (station cards/vintage player show paused while audio is actually
  // playing again — fixed 2026-07-24).
  const wantsPlaybackRef = useRef(false);

  // EQ state — remote-controlled by the vintage player's knobs
  const [eqBassCut, setEqBassCutState] = useState(false);
  const [eqMidCut, setEqMidCutState] = useState(false);
  const [eqTrebleCut, setEqTrebleCutState] = useState(false);
  const [eqLoudness, setEqLoudnessState] = useState(false);
  const [eqMono, setEqMonoState] = useState(false);
  const [eqBalance, setEqBalanceState] = useState<0 | 1 | 2>(0);

  // Shared Web Audio graph — one persistent AudioContext + filter chain for the
  // whole session. Only the MediaElementSourceNode at the front gets swapped out
  // whenever a new <audio> element is created (station switch / on-demand play).
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const shaperRef = useRef<WaveShaperNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const makeFlatCurve = () => {
    const c = new Float32Array(256);
    for (let i = 0; i < 256; i++) c[i] = (i * 2 / 255) - 1;
    return c;
  };
  const makeTubeCurve = () => {
    const c = new Float32Array(256);
    const drive = 4.0;
    const denom = Math.tanh(drive);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2 / 255) - 1;
      c[i] = Math.tanh(drive * x) / denom;
    }
    return c;
  };

  // Wires panner -> gainNode directly (stereo) or via a splitter/merger (mono)
  const applyMonoRouting = (mono: boolean) => {
    const ctx = audioCtxRef.current;
    const panner = pannerRef.current;
    const gain = gainNodeRef.current;
    if (!ctx || !panner || !gain) return;
    try { panner.disconnect(); } catch { /* not yet connected */ }
    if (mono) {
      const splitter = ctx.createChannelSplitter(2);
      const merger = ctx.createChannelMerger(2);
      panner.connect(splitter);
      splitter.connect(merger, 0, 0);
      splitter.connect(merger, 0, 1);
      merger.connect(gain);
    } else {
      panner.connect(gain);
    }
  };

  // Builds the persistent filter chain once; safe to call repeatedly
  const ensureAudioGraph = () => {
    if (audioCtxRef.current) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = "lowshelf";
    bassFilter.frequency.value = 350;
    bassFilter.gain.value = eqBassCut ? -16 : 0;
    bassFilterRef.current = bassFilter;

    const midFilter = ctx.createBiquadFilter();
    midFilter.type = "peaking";
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 0.7;
    midFilter.gain.value = eqMidCut ? -12 : 0;
    midFilterRef.current = midFilter;

    const trebleFilter = ctx.createBiquadFilter();
    trebleFilter.type = "highshelf";
    trebleFilter.frequency.value = 2500;
    trebleFilter.gain.value = eqTrebleCut ? -16 : 0;
    trebleFilterRef.current = trebleFilter;

    const shaper = ctx.createWaveShaper();
    shaper.curve = eqLoudness ? makeTubeCurve() : makeFlatCurve();
    shaperRef.current = shaper;

    const panner = ctx.createStereoPanner();
    panner.pan.value = [0, -1, 1][eqBalance];
    pannerRef.current = panner;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 1;
    gainNodeRef.current = gainNode;

    analyser.connect(bassFilter);
    bassFilter.connect(midFilter);
    midFilter.connect(trebleFilter);
    trebleFilter.connect(shaper);
    shaper.connect(panner);
    applyMonoRouting(eqMono);
    gainNode.connect(ctx.destination);
  };

  // Routes a freshly-created <audio> element through the persistent EQ chain
  const connectAudioGraph = (audio: HTMLAudioElement) => {
    ensureAudioGraph();
    const ctx = audioCtxRef.current!;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    if (mediaSourceRef.current) {
      try { mediaSourceRef.current.disconnect(); } catch { /* already disconnected */ }
    }
    try {
      const source = ctx.createMediaElementSource(audio);
      mediaSourceRef.current = source;
      source.connect(analyserRef.current!);
    } catch {
      // Some browsers (older iOS Safari) don't support routing live-stream
      // elements through Web Audio — playback still works, just without EQ.
    }
  };

  const setEqBassCut = (cut: boolean) => {
    setEqBassCutState(cut);
    if (bassFilterRef.current) bassFilterRef.current.gain.value = cut ? -16 : 0;
  };
  const setEqMidCut = (cut: boolean) => {
    setEqMidCutState(cut);
    if (midFilterRef.current) midFilterRef.current.gain.value = cut ? -12 : 0;
  };
  const setEqTrebleCut = (cut: boolean) => {
    setEqTrebleCutState(cut);
    if (trebleFilterRef.current) trebleFilterRef.current.gain.value = cut ? -16 : 0;
  };
  const setEqLoudness = (on: boolean) => {
    setEqLoudnessState(on);
    if (shaperRef.current) shaperRef.current.curve = on ? makeTubeCurve() : makeFlatCurve();
  };
  const setEqMono = (on: boolean) => {
    setEqMonoState(on);
    applyMonoRouting(on);
  };
  const setEqBalance = (state: 0 | 1 | 2) => {
    setEqBalanceState(state);
    if (pannerRef.current) pannerRef.current.pan.value = [0, -1, 1][state];
  };

  // Keep volume in sync whenever it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Mock metadata tick — simulates listener drift and occasional track rolls
  // Runs only until the live Azuracast API responds successfully
  useEffect(() => {
    if (hasFetchedLive) return;
    const interval = setInterval(() => {
      setMetadata((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          next[id] = { ...next[id], listeners: fakeListenerCount(id) };
          if (Math.random() > 0.96) {
            const list = MOCK_PLAYLISTS[id];
            if (list) {
              const track = list[Math.floor(Math.random() * list.length)];
              next[id] = {
                ...next[id],
                trackTitle: track.title,
                trackArtist: track.artist,
                album: track.album,
                artUrl: `https://picsum.photos/seed/${id}-${track.title.replace(/\s+/g, "")}/300/300`,
                nextTrack: { title: track.nextTitle, artist: track.nextArtist },
              };
            }
          }
        });
        return next;
      });
    }, 12000);
    return () => clearInterval(interval);
  }, [hasFetchedLive]);

  // Live Azuracast now-playing polling — all stations in one request
  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch(`${AZURACAST_HOST}/api/nowplaying`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("non-ok");
        const data = await res.json();
        if (!Array.isArray(data)) return;

        setHasFetchedLive(true);
        setMetadata((prev) => {
          const next = { ...prev };

          // Default all to offline first
          Object.keys(next).forEach((id) => {
            next[id] = {
              ...next[id],
              isOnline: false,
              trackTitle: "OFFLINE",
              trackArtist: "WJRN Broadcast Network",
              album: "Offline",
              artUrl: defaultArt,
              listeners: 0,
              nextTrack: null,
            };
          });

          data.forEach((azStation: any) => {
            const short = (azStation.station?.shortcode || "").toLowerCase();
            const matchId = Object.entries(STATION_STREAM_MAP).find(
              ([, v]) => v.shortcode.toLowerCase() === short
            )?.[0];
            if (!matchId) return;

            const np = azStation.now_playing;
            const isOnline = azStation.is_online ?? false;
            next[matchId] = {
              trackTitle: isOnline ? (np?.song?.title || "Live Stream") : "OFFLINE",
              trackArtist: isOnline ? (np?.song?.artist || "WJRN DJ Set") : "WJRN Broadcast Network",
              album: isOnline ? (np?.song?.album || "Live") : "Offline",
              artUrl: isOnline ? (np?.song?.art || prev[matchId]?.artUrl || defaultArt) : defaultArt,
              // Real listener totals are shown nowhere — the actual counts are still
              // low this early on, so we show the same realistic-looking fluctuating
              // number used everywhere else instead (see fakeListenerCount above).
              listeners: isOnline ? fakeListenerCount(matchId) : 0,
              isPlayingLive: isOnline ? (azStation.live?.is_active || false) : false,
              isOnline,
              nextTrack:
                isOnline && azStation.playing_next?.song?.title
                  ? { title: azStation.playing_next.song.title, artist: azStation.playing_next.song.artist }
                  : null,
            };
          });

          return next;
        });
      } catch {
        // Silently fall through to mock data
      }
    };

    fetchLive();
    const id = setInterval(fetchLive, 15000);
    return () => clearInterval(id);
  }, []);

  // ---------------------------------------------------------------------------
  // Playback control
  // ---------------------------------------------------------------------------

  const toggleStation = (stationId: string) => {
    const station = STATION_STREAM_MAP[stationId];
    if (!station) return;

    // Block offline stations
    if (metadata[stationId] && !metadata[stationId].isOnline) {
      console.warn(`Playback blocked: ${stationId} is offline.`);
      return;
    }

    // Switching to live always clears on-demand
    setOnDemandItem(null);

    // Toggle off if this station is already active (and not on-demand)
    if (activeStationId === stationId && !onDemandItem) {
      wantsPlaybackRef.current = false;
      audioRef.current?.pause();
      setActiveStationId(null);
      setAudioState("idle");
      return;
    }

    // Tear down existing stream
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    wantsPlaybackRef.current = true;
    setAudioState("connecting");
    setActiveStationId(stationId);

    const audio = new Audio(station.streamUrl);
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;
    connectAudioGraph(audio);

    audio.onplay = () => setAudioState("playing");
    audio.onplaying = () => setAudioState("playing");
    audio.onwaiting = () => setAudioState("connecting");
    audio.oncanplay = () => {
      if (!wantsPlaybackRef.current) return;
      audio.play().catch(() => setAudioState("error"));
    };
    audio.onerror = () => setAudioState("error");

    audio.load();
    audio.play().then(() => setAudioState("playing")).catch(() => {});
  };

  const stopPlayback = () => {
    wantsPlaybackRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setActiveStationId(null);
    setAudioState("idle");
    setOnDemandItem(null);
    setOnDemandCurrentTime(0);
    setOnDemandDuration(0);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (audioState === "playing") {
      wantsPlaybackRef.current = false;
      audioRef.current.pause();
      setAudioState("idle");
    } else {
      wantsPlaybackRef.current = true;
      setAudioState("connecting");
      audioRef.current.play()
        .then(() => setAudioState("playing"))
        .catch(() => setAudioState("error"));
    }
  };

  const playEpisode = (ep: OnDemandItem) => {
    if (seekTimerRef.current) { clearTimeout(seekTimerRef.current); seekTimerRef.current = null; }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    wantsPlaybackRef.current = true;
    setAudioState("connecting");
    setActiveStationId(ep.stationId);
    setOnDemandItem(ep);

    const audio = new Audio(ep.streamUrl);
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;
    connectAudioGraph(audio);

    audio.onplay    = () => setAudioState("playing");
    audio.onplaying = () => setAudioState("playing");
    audio.onwaiting = () => {};
    audio.oncanplay = () => {
      if (!wantsPlaybackRef.current) return;
      audio.play().catch(() => setAudioState("error"));
    };
    audio.onerror   = () => setAudioState("error");
    audio.onended   = () => { wantsPlaybackRef.current = false; setAudioState("idle"); setOnDemandItem(null); setOnDemandCurrentTime(0); setOnDemandDuration(0); };
    audio.ontimeupdate = () => {
      setOnDemandCurrentTime(audio.currentTime);
      if (isFinite(audio.duration)) setOnDemandDuration(audio.duration);
    };

    audio.load();
    audio.play().then(() => setAudioState("playing")).catch(() => {});
  };

  // Debounced seeks — 250ms delay prevents flooding the server with range requests
  const seekBackward = () => {
    if (seekTimerRef.current) clearTimeout(seekTimerRef.current);
    seekTimerRef.current = setTimeout(() => {
      if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
    }, 250);
  };
  const seekForward = () => {
    if (seekTimerRef.current) clearTimeout(seekTimerRef.current);
    seekTimerRef.current = setTimeout(() => {
      if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 15);
    }, 250);
  };
  const seekToStart = () => {
    if (seekTimerRef.current) clearTimeout(seekTimerRef.current);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const totalListeners =
    (metadata.rock_garden?.listeners || 0) +
    (metadata.bridge_city?.listeners || 0) +
    (metadata.golden_boombox?.listeners || 0);

  return (
    <PlayerContext.Provider
      value={{
        activeStationId,
        setActiveStationId,
        audioState,
        volume,
        setVolume,
        isMuted,
        setIsMuted,
        metadata,
        toggleStation,
        togglePlayback,
        stopPlayback,
        audioRef,
        analyserRef,
        onDemandItem,
        isOnDemand: onDemandItem !== null,
        playEpisode,
        seekBackward,
        seekForward,
        seekToStart,
        onDemandCurrentTime,
        onDemandDuration,
        eqBassCut,
        setEqBassCut,
        eqMidCut,
        setEqMidCut,
        eqTrebleCut,
        setEqTrebleCut,
        eqLoudness,
        setEqLoudness,
        eqMono,
        setEqMono,
        eqBalance,
        setEqBalance,
        displayStationId,
        isMiniPlayerVisible,
        dismissMiniPlayer,
        totalListeners,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
