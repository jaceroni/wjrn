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
    listeners: 50,
    isPlayingLive: false,
    isOnline: true,
    nextTrack: null,
  },
  rock_garden: {
    trackTitle: "Riders on the Storm",
    trackArtist: "The Doors",
    album: "L.A. Woman",
    artUrl: "https://picsum.photos/seed/rockgarden/300/300",
    listeners: 142,
    isPlayingLive: false,
    isOnline: true,
    nextTrack: { title: "Sunshine of Your Love", artist: "Cream" },
  },
  bridge_city: {
    trackTitle: "Find Your Way Back",
    trackArtist: "Kem",
    album: "Album II",
    artUrl: "https://picsum.photos/seed/bridgecity/300/300",
    listeners: 98,
    isPlayingLive: true,
    isOnline: true,
    nextTrack: { title: "Prototype", artist: "Outkast" },
  },
  golden_boombox: {
    trackTitle: "C.R.E.A.M.",
    trackArtist: "Wu-Tang Clan",
    album: "Enter the Wu-Tang (36 Chambers)",
    artUrl: "https://picsum.photos/seed/goldenboom/300/300",
    listeners: 215,
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
  // On-demand
  onDemandItem: OnDemandItem | null;
  isOnDemand: boolean;
  playEpisode: (ep: OnDemandItem) => void;
  seekBackward: () => void;
  seekForward: () => void;
  seekToStart: () => void;
  onDemandCurrentTime: number;
  onDemandDuration: number;
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

  // Single audio element that persists for the lifetime of the app session
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Debounce timer for seek operations
  const seekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          const drift = Math.random() > 0.6 ? (Math.random() > 0.5 ? 2 : -2) : 0;
          next[id] = { ...next[id], listeners: Math.max(12, next[id].listeners + drift) };
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
              listeners: isOnline ? (azStation.listeners?.total || azStation.listeners?.unique || 0) : 0,
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

    setAudioState("connecting");
    setActiveStationId(stationId);

    const audio = new Audio(station.streamUrl);
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    audio.onplay = () => setAudioState("playing");
    audio.onplaying = () => setAudioState("playing");
    audio.onwaiting = () => setAudioState("connecting");
    audio.oncanplay = () => {
      audio.play().catch(() => setAudioState("error"));
    };
    audio.onerror = () => setAudioState("error");

    audio.load();
    audio.play().then(() => setAudioState("playing")).catch(() => {});
  };

  const stopPlayback = () => {
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
      audioRef.current.pause();
      setAudioState("idle");
    } else {
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
    setAudioState("connecting");
    setActiveStationId(ep.stationId);
    setOnDemandItem(ep);

    const audio = new Audio(ep.streamUrl);
    audio.preload = "auto";
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    audio.onplay    = () => setAudioState("playing");
    audio.onplaying = () => setAudioState("playing");
    audio.onwaiting = () => {};
    audio.oncanplay = () => { audio.play().catch(() => setAudioState("error")); };
    audio.onerror   = () => setAudioState("error");
    audio.onended   = () => { setAudioState("idle"); setOnDemandItem(null); setOnDemandCurrentTime(0); setOnDemandDuration(0); };
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
        onDemandItem,
        isOnDemand: onDemandItem !== null,
        playEpisode,
        seekBackward,
        seekForward,
        seekToStart,
        onDemandCurrentTime,
        onDemandDuration,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
