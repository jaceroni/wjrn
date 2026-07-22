import React, { useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Antenna, RotateCcw, X } from "lucide-react";
import { navigate } from "../navigate";
import { formatTime } from "../context/PlayerContext";
import { NowPlaying } from "../types";
import { usePlayer } from "../context/PlayerContext";
import wjrnLogoLight from "../assets/images/wjrn-logo-light.svg";
import defaultArt from "../assets/images/jacewon-thumbnail.jpg";
import logoRockGarden from "../assets/images/miniplayer-logo-trg.svg";
import logoBridgeCity from "../assets/images/miniplayer-logo-bchs.svg";
import logoGoldenBoombox from "../assets/images/miniplayer-logo-gbs.svg";
import djBoothBg from "../assets/images/wjrn-thumbnail.jpg";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StationLandingProps {
  stationId: string;
}

// Nav dropdown — kept as a small local lookup (matches the pattern already
// used on the homepage/About pages) rather than threading the full STATIONS
// array down as a prop.
const NAV_STATIONS = [
  { id: "rock_garden", name: "THE ROCK GARDEN", slug: "the-rock-garden" },
  { id: "bridge_city", name: "BRIDGE CITY HANG SUITE", slug: "bridge-city-hang-suite" },
  { id: "golden_boombox", name: "THE GOLDEN BOOMBOX", slug: "the-golden-boombox" },
];

interface OnDemandEpisode {
  title: string;
  subtitle: string;
  runtime: string;
  date: string;
}

interface StationConfig {
  name: string;
  genres: string[];
  description: string;
  sensory: {
    soundsLike: string;
    smellsLike: string;
    tastesLike: string;
    feelsLike: string;
  };
  meshGradient: string;
  primaryColor: string;
  glowColorA: string;
  glowColorB: string;
  logoFilter: string;
  logoSrc: string;
  textColorClass: string;
  buttonClass: string;
  borderClass: string;
  pulseClass: string;
  streamUrl: string;
  shortcode: string;
  demandLabel: string;
  onDemand: OnDemandEpisode[];
}

// ---------------------------------------------------------------------------
// Station configs
// ---------------------------------------------------------------------------

const STATION_CONFIGS: { [key: string]: StationConfig } = {
  rock_garden: {
    name: "THE ROCK GARDEN",
    genres: ["CLASSIC ROCK", "FUNK", "BLUES", "JAZZ"],
    description:
      "Where the groove was born, the funk was forged, and every sample we love found its soul. This is The Rock Garden — an all-vinyl experience broadcasted live every Tuesday at 7PM Pacific.",
    sensory: {
      soundsLike: "Wax & Wires",
      smellsLike: "Leather & Tobacco",
      tastesLike: "Whiskey & Regret",
      feelsLike: "The Open Road",
    },
    meshGradient: "radial-gradient(circle at 80% 20% in oklab, #222b15 0%, #121809 100%)",
    primaryColor: "#74b338",
    glowColorA: "rgba(116,179,56,0.36)",
    glowColorB: "rgba(116,179,56,0.12)",
    logoFilter:
      "brightness(0) sepia(1) hue-rotate(88deg) saturate(12) brightness(0.28)",
    logoSrc: logoRockGarden,
    textColorClass: "text-emerald-400",
    buttonClass: "bg-emerald-500 hover:bg-emerald-400",
    borderClass: "border-emerald-500/15 hover:border-emerald-500/55",
    pulseClass: "bg-emerald-500",
    streamUrl:
      "https://radio.jacewonmusic.com/listen/the_rock_garden/radio.mp3",
    shortcode: "the_rock_garden",
    demandLabel: "LISTEN TO PAST TRIBUTES ON DEMAND",
    onDemand: [
      {
        title: "Groove Architects Vol. 12",
        subtitle: "An all-vinyl deep dive into the Motown vault",
        runtime: "1h 47m",
        date: "MAY 27, 2025",
      },
      {
        title: "Tuesday Night Wax Session",
        subtitle: "B-sides, bootlegs & buried funk gems",
        runtime: "2h 03m",
        date: "MAY 20, 2025",
      },
      {
        title: "The Blues Don't Lie",
        subtitle: "Chicago electric blues from first press vinyl",
        runtime: "1h 55m",
        date: "MAY 13, 2025",
      },
      {
        title: "Crate Diggers Anonymous",
        subtitle: "Jazz, soul, and the records your dad lost",
        runtime: "1h 38m",
        date: "MAY 6, 2025",
      },
    ],
  },

  bridge_city: {
    name: "BRIDGE CITY HANG SUITE",
    genres: ["GROWNFOLK R&B", "SOUL", "ELECTRONICA"],
    description:
      "Late nights, deep cuts, and all the feelings you didn't know you needed to feel. Bridge City Hang Suite is grown-folk R&B at its purest — curated for the after-hours crowd, live every Wednesday at 7PM Pacific.",
    sensory: {
      soundsLike: "Candlelight & Bass",
      smellsLike: "Cognac & Jasmine",
      tastesLike: "Dark Chocolate",
      feelsLike: "2AM on a Friday",
    },
    meshGradient: "radial-gradient(circle at 80% 20% in oklab, #3a1725 0%, #13050b 100%)",
    primaryColor: "#ff0066",
    glowColorA: "rgba(255,0,102,0.34)",
    glowColorB: "rgba(255,0,102,0.1)",
    logoFilter:
      "brightness(0) sepia(1) hue-rotate(278deg) saturate(14) brightness(0.22)",
    logoSrc: logoBridgeCity,
    textColorClass: "text-pink-400",
    buttonClass: "bg-pink-500 hover:bg-pink-400",
    borderClass: "border-pink-500/15 hover:border-pink-500/55",
    pulseClass: "bg-pink-500",
    streamUrl:
      "https://radio.jacewonmusic.com/listen/bridge_city_hang_suite/radio.mp3",
    shortcode: "bridge_city_hang_suite",
    demandLabel: "LISTEN TO PAST SESSIONS ON DEMAND",
    onDemand: [
      {
        title: "After Hours With The Hang Suite",
        subtitle: "Late night slow jams and atmospheric soul",
        runtime: "2h 11m",
        date: "MAY 28, 2025",
      },
      {
        title: "Velvet Frequencies",
        subtitle: "Neo-soul meets electronica in a dark room",
        runtime: "1h 58m",
        date: "MAY 21, 2025",
      },
      {
        title: "Grown Folks Only",
        subtitle: "R&B for the thirty-somethings who stayed up",
        runtime: "2h 04m",
        date: "MAY 14, 2025",
      },
      {
        title: "The Wednesday Wind-Down",
        subtitle: "Electric soul and whispered basslines",
        runtime: "1h 44m",
        date: "MAY 7, 2025",
      },
    ],
  },

  golden_boombox: {
    name: "THE GOLDEN BOOMBOX",
    genres: ["GOLDEN ERA HIP-HOP", "FUTURE CLASSICS"],
    description:
      "From Queensbridge to Compton, from '88 to now — The Golden Boombox runs the full spectrum of real hip-hop, no features required. Live every Friday at 7PM Pacific.",
    sensory: {
      soundsLike: "College Radio",
      smellsLike: "Blacktop & Cardboard",
      tastesLike: "Malt Liquor",
      feelsLike: "1993",
    },
    meshGradient: "radial-gradient(circle at 80% 20% in oklab, #372e16 0%, #161205 100%)",
    primaryColor: "#e2ac00",
    glowColorA: "rgba(226,172,0,0.32)",
    glowColorB: "rgba(226,172,0,0.1)",
    logoFilter:
      "brightness(0) sepia(1) hue-rotate(8deg) saturate(5) brightness(0.24)",
    logoSrc: logoGoldenBoombox,
    textColorClass: "text-yellow-400",
    buttonClass: "bg-yellow-500 hover:bg-yellow-400",
    borderClass: "border-yellow-500/15 hover:border-yellow-500/55",
    pulseClass: "bg-yellow-500",
    streamUrl:
      "https://radio.jacewonmusic.com/listen/golden_boombox_sessions/radio.mp3",
    shortcode: "golden_boombox_sessions",
    demandLabel: "LISTEN TO PAST SESSIONS ON DEMAND",
    onDemand: [
      {
        title: "The Golden Era Codex",
        subtitle: "Boom bap from '88 to '98, no skips",
        runtime: "2h 22m",
        date: "MAY 30, 2025",
      },
      {
        title: "Friday Night Cyphers",
        subtitle: "West Coast classics and East Coast essentials",
        runtime: "1h 51m",
        date: "MAY 23, 2025",
      },
      {
        title: "Dust & Diamonds",
        subtitle: "Underrated gems from the golden age vaults",
        runtime: "2h 07m",
        date: "MAY 16, 2025",
      },
      {
        title: "No Features Required",
        subtitle: "Solo runs from the greats — no collabs, no fillers",
        runtime: "1h 39m",
        date: "MAY 9, 2025",
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Podcast / on-demand types
// ---------------------------------------------------------------------------

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  art: string;
  created_at: number;
  duration: string;
  streamUrl: string;
}

// Public RSS podcast feeds — no auth required
const STATION_PODCAST_RSS: Record<string, string> = {
  rock_garden:   "https://radio.jacewonmusic.com/public/2/podcast/1f163acc-8bf3-6530-930d-97733b708762/feed",
  bridge_city:   "https://radio.jacewonmusic.com/public/4/podcast/1f163af9-33ea-6eb0-a61f-152390e696af/feed",
  golden_boombox:"https://radio.jacewonmusic.com/public/3/podcast/1f163b5a-9eb7-6bc4-b5cd-43d7c7b481e2/feed",
};

const EPISODES_PER_PAGE = 6;

function formatDate(ts: number): string {
  if (!ts) return "";
  return new Date(ts * 1000)
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Default NowPlaying
// ---------------------------------------------------------------------------

const DEFAULT_META: NowPlaying = {
  trackTitle: "OFFLINE",
  trackArtist: "WJRN Broadcast Network",
  album: "Offline",
  artUrl: defaultArt,
  listeners: 0,
  isOnline: false,
  isPlayingLive: false,
  nextTrack: null,
};


// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StationLanding({ stationId }: StationLandingProps) {
  const config = STATION_CONFIGS[stationId] ?? STATION_CONFIGS["rock_garden"];

  // Consume global audio state from PlayerContext
  const {
    activeStationId,
    audioState,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    metadata,
    toggleStation,
    isOnDemand,
    onDemandItem,
    playEpisode,
    togglePlayback,
    seekBackward,
    seekForward,
    seekToStart,
    onDemandCurrentTime,
    onDemandDuration,
  } = usePlayer();

  // Derive per-page state from context
  // audioState only reflects this station's play state when it's the active one
  const isThisStationActive = activeStationId === stationId;
  const pageAudioState = isThisStationActive ? audioState : "idle";

  // Use context metadata for this station (kept fresh by global polling)
  const contextMeta = metadata[stationId] ?? DEFAULT_META;

  // --- Podcast episodes ---
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(true);
  const [episodesError, setEpisodesError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(EPISODES_PER_PAGE);

  useEffect(() => {
    const feedUrl = STATION_PODCAST_RSS[stationId];
    if (!feedUrl) { setEpisodesLoading(false); return; }

    setEpisodesLoading(true);
    setEpisodesError(false);
    setVisibleCount(EPISODES_PER_PAGE);

    (async () => {
      try {
        const res = await fetch(feedUrl);
        if (!res.ok) throw new Error("RSS fetch failed");
        const xml = await res.text();

        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const ITUNES = "http://www.itunes.com/dtds/podcast-1.0.dtd";

        // Channel-level artwork as fallback for episodes without their own art
        const channel = doc.querySelector("channel");
        const channelArt =
          channel?.getElementsByTagNameNS(ITUNES, "image")[0]?.getAttribute("href") ??
          channel?.querySelector("image > url")?.textContent ??
          djBoothBg;

        const items = Array.from(doc.querySelectorAll("channel > item"));

        const parsed: PodcastEpisode[] = items.map((item) => {
          const title = item.querySelector("title")?.textContent ?? "Untitled";
          const description = item.querySelector("description")?.textContent ?? "";
          const pubDateStr = item.querySelector("pubDate")?.textContent ?? "";
          const guid = item.querySelector("guid")?.textContent ?? crypto.randomUUID();
          const art =
            item.getElementsByTagNameNS(ITUNES, "image")[0]?.getAttribute("href") ??
            channelArt; // fall back to podcast-level art before using placeholder
          const created_at = pubDateStr
            ? Math.floor(new Date(pubDateStr).getTime() / 1000)
            : 0;

          const streamUrl = item.querySelector("enclosure")?.getAttribute("url") ?? "";
          return { id: guid, title, description, art, created_at, duration: "", streamUrl };
        });

        // newest first
        parsed.sort((a, b) => b.created_at - a.created_at);
        setEpisodes(parsed);
      } catch {
        setEpisodesError(true);
      } finally {
        setEpisodesLoading(false);
      }
    })();
  }, [stationId]);

  const isLive = contextMeta.isOnline;
  const isThisStationOnDemand = isOnDemand && activeStationId === stationId;
  const pageAudioStateFull = isThisStationOnDemand ? audioState : pageAudioState;

  return (
    <div
      className="relative min-h-screen w-full text-white flex flex-col overflow-hidden font-mono pt-4 md:pt-6 lg:pt-8 pb-6 md:pb-10 lg:pb-14 px-6 md:px-10 lg:px-14"
      style={{ background: config.meshGradient }}
    >
      {/* Extra bottom padding so content isn't hidden behind the global MiniPlayer bar */}
      {/* Shared lava lamp keyframes + logo hover CSS live in index.css */}

      {/* ------------------------------------------------------------------ */}
      {/* Background blobs                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Noise overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id="sl-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#sl-noise)" />
        </svg>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Header — Logo / Nav / Live Indicator                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative z-30">
      <header className="w-full flex items-center justify-between pb-6 max-w-7xl mx-auto gap-4">
        <a
          href="/"
          onClick={(e: React.MouseEvent) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
            e.preventDefault();
            navigate("/");
          }}
          className="flex items-center gap-3 cursor-pointer select-none shrink-0"
        >
          <img src={wjrnLogoLight} alt="WJRN" className="h-5 md:h-6 w-auto object-contain" />
          <span className="hidden sm:flex items-center gap-3">
            <span className="w-px h-3.5 bg-white/20" />
            <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.2em] text-white/70">
              Jacewon Radio Network
            </span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-5 text-[11px] font-mono uppercase tracking-[0.2em]">
          <a
            href="/"
            onClick={(e: React.MouseEvent) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
              e.preventDefault();
              navigate("/");
            }}
            className="text-white/80 hover:text-[#b5945b] transition-colors"
          >
            Home
          </a>
          <span className="text-white/20">&middot;</span>

          <div className="relative group py-2">
            <span className="text-white/80 group-hover:text-[#b5945b] transition-colors cursor-default">
              Our Stations
            </span>
            <div className="absolute left-1/2 -translate-x-1/2 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pt-2">
              <div className="flex flex-col min-w-[230px] rounded-lg border border-white/10 bg-[#0c0908]/95 backdrop-blur-md shadow-2xl overflow-hidden">
                {NAV_STATIONS.map((station) => (
                  <a
                    key={station.id}
                    href={`/${station.slug}`}
                    onClick={(e: React.MouseEvent) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
                      e.preventDefault();
                      navigate(`/${station.slug}`);
                    }}
                    className={`px-4 py-2.5 text-[10px] tracking-[0.15em] transition-colors whitespace-nowrap hover:bg-white/5 ${
                      station.id === stationId ? config.textColorClass : "text-white/70 hover:text-white"
                    }`}
                  >
                    {station.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <span className="text-white/20">&middot;</span>
          <a
            href="/about-wjrn"
            onClick={(e: React.MouseEvent) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
              e.preventDefault();
              navigate("/about-wjrn");
            }}
            className="text-white/80 hover:text-[#b5945b] transition-colors"
          >
            About WJRN
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <Antenna className="w-3 h-3 text-red-500 animate-pulse shrink-0" />
          <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.2em] text-white/80">
            Live From California
          </span>
        </div>
      </header>
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-20 max-w-7xl mx-auto" />
      </div>

      {/* 3. Main Centerpiece Grid Layout */}
      <section className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-2 md:mt-4">
        
        {/* Left Column: Eyebrow, Station Name, Description, and Sensory Cards */}
        <div className="lg:col-span-7 flex flex-col gap-6 lg:gap-8">
          
          {/* Eyebrow & Station Title */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center lg:justify-start">
              <span className={`text-[10px] uppercase font-mono tracking-[0.25em] font-bold ${config.textColorClass}`}>
                {config.genres.join(" • ")}
              </span>
            </div>
            <h2
              className="text-[44px] sm:text-5xl md:text-6xl lg:text-[90px] font-extrabold leading-[0.95] tracking-normal text-white uppercase select-none font-display text-center lg:text-left">
              {config.name}
            </h2>
          </div>

          {/* Description Paragraph */}
          <p className="text-sm text-neutral-400 font-mono leading-relaxed max-w-xl pl-6 border-l border-white/20">
            {config.description}
          </p>

          {/* Sensory Info Cards */}
          <div className="grid grid-cols-2 gap-4 mt-[10px]">
            {(
              [
                { label: "SOUNDS LIKE", value: config.sensory.soundsLike },
                { label: "SMELLS LIKE", value: config.sensory.smellsLike },
                { label: "TASTES LIKE", value: config.sensory.tastesLike },
                { label: "FEELS LIKE",  value: config.sensory.feelsLike  },
              ] as const
            ).map(({ label, value }) => (
               <div
                key={label}
                className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex flex-col gap-2"
              >
                <span
                  className={`text-[10px] font-mono uppercase tracking-[0.22em] font-bold ${config.textColorClass}`}
                >
                  {label}
                </span>
                <span className="text-xs text-white/80 font-mono leading-tight">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Player Visualizer Card */}
        <div className="lg:col-span-5 flex flex-col">
          <div
            className={`relative overflow-hidden group bg-gradient-to-b from-[#0a0706] to-[#040303] border ${config.borderClass} rounded-2xl transition-all duration-500`}
            style={{ boxShadow: `0 20px 50px -10px ${config.glowColorA}` }}
          >
            {/* Top accent strip */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-current to-transparent ${config.textColorClass} opacity-30 group-hover:opacity-60 transition-opacity duration-500`} />
            {/* Dotted pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.012)_1.5px,transparent_1.5px)] bg-[size:24px_24px] pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity duration-700" />
            {/* Content */}
            <div className="relative z-10 p-6 flex flex-col gap-6">

              {/* Card top row: ON THE AIR badge + listener count */}
              <div className="flex items-center justify-between">
                {isLive ? (
                  <span className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.2em] font-bold text-white/80">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pulseClass} opacity-75`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${config.pulseClass}`}
                      />
                    </span>
                    ON THE AIR
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.2em] font-bold text-neutral-500">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-600" />
                    OFFLINE
                  </span>
                )}
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">
                  <span className="text-white/70 font-bold">
                    {contextMeta.listeners.toLocaleString()}
                  </span>{" "}
                  LISTENERS
                </span>
              </div>

              {/* Album art */}
              <div className="flex justify-center">
                <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                  <img
                    src={isThisStationOnDemand ? (onDemandItem?.art || defaultArt) : (contextMeta.artUrl || defaultArt)}
                    alt="Now playing art"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* NOW PLAYING label + track info */}
              <div className="flex flex-col gap-2">
                <span className={`text-[8px] font-mono uppercase tracking-[0.28em] font-bold ${config.textColorClass}`}>
                  {isThisStationOnDemand ? "ON DEMAND" : "NOW PLAYING"}
                </span>
                {(() => {
                  const title = isThisStationOnDemand
                    ? (onDemandItem?.title ?? "")
                    : contextMeta.trackTitle;
                  return title.length > 22 ? (
                    <div className="overflow-hidden mask-marquee w-full">
                      <p className="animate-marquee font-bold text-base sm:text-lg leading-tight uppercase tracking-wide whitespace-nowrap" style={{ animationDuration: "18s" }}>
                        {title}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{title}
                      </p>
                    </div>
                  ) : (
                    <p className="text-white font-bold text-base sm:text-lg leading-tight uppercase tracking-wide">
                      {title}
                    </p>
                  );
                })()}
                {!isThisStationOnDemand && (
                  <p className="text-neutral-400 text-xs font-mono uppercase tracking-widest truncate">
                    {contextMeta.trackArtist}
                  </p>
                )}
              </div>

              {/* On-demand playback controls — only active during episode playback */}
              {isThisStationOnDemand && (
                <>
                <div className="flex items-center justify-center gap-3 py-1 border-t border-b border-white/5">
                  <button onClick={seekToStart} title="Start from beginning" className={`w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all ${config.textColorClass}`}>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={seekBackward} title="Back 15 seconds" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all text-white/70 hover:text-white text-[10px] font-mono font-black">
                    -15
                  </button>
                  <button
                    onClick={togglePlayback}
                    className={`w-11 h-11 rounded-full flex items-center justify-center ${config.buttonClass} text-black shadow-lg transition-all active:scale-95`}
                  >
                    {pageAudioStateFull === "connecting" ? (
                      <span className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                    ) : pageAudioStateFull === "playing" ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current translate-x-0.5" />
                    )}
                  </button>
                  <button onClick={seekForward} title="Forward 15 seconds" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all text-white/70 hover:text-white text-[10px] font-mono font-black">
                    +15
                  </button>
                  <button onClick={() => toggleStation(stationId)} title="Stop on-demand" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Playback position readout */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-white/40 tracking-widest">
                  <span>{formatTime(onDemandCurrentTime)}</span>
                  <span>/</span>
                  <span>{formatTime(onDemandDuration)}</span>
                </div>
                </>
              )}

              {/* Volume slider */}
              <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-full px-4 py-2.5">
                <button onClick={() => setIsMuted(!isMuted)} className="text-white/60 hover:text-white transition-colors cursor-pointer shrink-0" aria-label={isMuted ? "Unmute" : "Mute"}>
                  {isMuted ? <VolumeX className={`w-4 h-4 ${config.textColorClass}`} /> : <Volume2 className={`w-4 h-4 ${config.textColorClass}`} />}
                </button>
                <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
                  onChange={(e) => { setVolume(parseFloat(e.target.value)); if (isMuted) setIsMuted(false); }}
                  className="flex-1 h-[2px] bg-white/10 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: config.primaryColor }}
                />
              </div>

              {/* Listen live button — hidden during on-demand playback */}
              {!isThisStationOnDemand && (
                <button
                  onClick={() => toggleStation(stationId)}
                  className={`w-full py-4 rounded-xl text-[10px] font-mono font-extrabold uppercase tracking-[0.25em] text-black transition-all duration-300 active:scale-[0.98] ${config.buttonClass} flex items-center justify-center gap-3`}
                >
                  {pageAudioState === "connecting" ? (
                    <><span className="w-3 h-3 border-2 border-black/40 border-t-black rounded-full animate-spin" />CONNECTING...</>
                  ) : pageAudioState === "playing" ? (
                    <><Pause className="w-4 h-4 fill-current" />PAUSE STREAM</>
                  ) : pageAudioState === "error" ? (
                    "CONNECTION ERROR — RETRY"
                  ) : (
                    <><Play className="w-4 h-4 fill-current translate-x-0.5" />LISTEN TO THIS STATION NOW</>
                  )}
                </button>
              )}

            </div>{/* end content z-10 */}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* On-demand section                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative z-10 w-full max-w-7xl mx-auto pt-16 md:pt-24 pb-20">

        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <span className={`text-[9px] font-mono uppercase tracking-[0.28em] font-bold ${config.textColorClass}`}>
              ON DEMAND
            </span>
            <h2 className="text-[26px] leading-tight sm:text-2xl sm:leading-snug font-extrabold uppercase text-white tracking-tight font-display">
              {config.demandLabel}
            </h2>
          </div>
          {!episodesLoading && !episodesError && (
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">
              {episodes.length} {episodes.length === 1 ? "EPISODE" : "EPISODES"} AVAILABLE
            </span>
          )}
        </div>

        {/* Loading state */}
        {episodesLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl bg-white/[0.02] border border-white/5 p-4 h-[112px] animate-pulse" />
            ))}
          </div>
        )}

        {/* Error state */}
        {episodesError && !episodesLoading && (
          <p className="text-white/30 text-[11px] font-mono uppercase tracking-widest py-8 text-center">
            Could not load episodes — check back soon.
          </p>
        )}

        {/* Empty state */}
        {!episodesLoading && !episodesError && episodes.length === 0 && (
          <p className="text-white/30 text-[11px] font-mono uppercase tracking-widest py-8 text-center">
            No episodes available yet.
          </p>
        )}

        {/* Episode grid */}
        {!episodesLoading && !episodesError && episodes.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {episodes.slice(0, visibleCount).map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => playEpisode({ id: ep.id, title: ep.title, art: ep.art, streamUrl: ep.streamUrl, stationId })}
                  className={`relative overflow-hidden group bg-gradient-to-b from-[#0a0706] to-[#040303] border ${config.borderClass} rounded-xl transition-all duration-500 cursor-pointer hover:shadow-2xl hover:-translate-y-0.5`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-current to-transparent ${config.textColorClass} opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.012)_1.5px,transparent_1.5px)] bg-[size:24px_24px] pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative z-10 p-4 flex items-start gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-white/10">
                      <img
                        src={ep.art || djBoothBg}
                        alt={ep.title}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                      <p className="text-white text-sm font-bold uppercase tracking-wide leading-tight line-clamp-2 font-display">
                        {ep.title}
                      </p>
                      {ep.description && (
                        <p className="text-neutral-500 text-[10px] font-mono leading-snug line-clamp-2">
                          {ep.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-auto pt-1">
                        {ep.duration && (
                          <span className={`text-[8px] font-mono uppercase tracking-[0.18em] font-bold ${config.textColorClass}`}>
                            {ep.duration}
                          </span>
                        )}
                        {ep.created_at > 0 && (
                          <span className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/25">
                            {formatDate(ep.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More — only when there are more than 2 rows worth (>6) */}
            {episodes.length > visibleCount && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setVisibleCount(v => v + EPISODES_PER_PAGE)}
                  className={`px-8 py-3 rounded-xl border text-[9px] font-mono font-extrabold uppercase tracking-[0.2em] transition-all duration-300 ${config.textColorClass} border-current opacity-50 hover:opacity-100 hover:bg-white/5`}
                >
                  Load More Episodes
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Footer                                                              */}
      {/* ------------------------------------------------------------------ */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto border-t border-white/5 pt-5 mt-8 mb-24 flex flex-col md:flex-row items-center justify-between text-[10px] font-mono text-white/60 uppercase tracking-widest gap-4">
        <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
          <span>For Promotional Use Only</span>
          <span>All Music Is The Property Of Its Respective Owners</span>
        </div>
        <div className="flex flex-col items-center md:items-end gap-1 text-center md:text-right">
          <span className="flex items-center gap-1.5">
            Designed with <span className="animate-pulse text-[20px] leading-none mb-1">❤</span> in California
          </span>
          <span>Copyright &copy; JWBC 2026 &middot; All Rights Reserved</span>
        </div>
      </footer>
    </div>
  );
}
