import { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, X, Radio, ArrowRight, RotateCcw } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { navigate } from "../navigate";

// Station display metadata used only for the mini-player bar
const STATION_NAMES: Record<string, string> = {
  wjrn: "WJRN",
  rock_garden: "THE ROCK GARDEN",
  bridge_city: "BRIDGE CITY HANG SUITE",
  golden_boombox: "THE GOLDEN BOOMBOX",
};

const STATION_SLUGS: Record<string, string> = {
  wjrn: "/",
  rock_garden: "/the-rock-garden",
  bridge_city: "/bridge-city-hang-suite",
  golden_boombox: "/the-golden-boombox",
};

const STATION_COLORS: Record<string, string> = {
  wjrn: "#b5945b",
  rock_garden: "#74b338",
  bridge_city: "#ff0066",
  golden_boombox: "#e2ac00",
};

export default function MiniPlayer() {
  const {
    activeStationId,
    audioState,
    metadata,
    toggleStation,
    stopPlayback,
    isMuted,
    setIsMuted,
    isOnDemand,
    onDemandItem,
    togglePlayback,
    seekBackward,
    seekForward,
    seekToStart,
  } = usePlayer();

  // Track the last station that was playing so the bar stays populated after pause
  const lastStationRef = useRef<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Update last station and un-dismiss whenever a station becomes active
  if (activeStationId) {
    lastStationRef.current = activeStationId;
    if (dismissed) setDismissed(false);
  }

  const displayStationId = activeStationId ?? lastStationRef.current;
  const isVisible = displayStationId !== null && !dismissed;
  const isPlaying = audioState === "playing";
  const isConnecting = audioState === "connecting";

  const activeMeta = displayStationId ? metadata[displayStationId] : null;
  const stationName = displayStationId ? (STATION_NAMES[displayStationId] ?? "") : "";
  const accentColor = displayStationId ? (STATION_COLORS[displayStationId] ?? "#ffffff") : "#ffffff";

  const handleStop = () => {
    stopPlayback();
    setDismissed(true);
  };

  const handlePlayPause = () => {
    if (!displayStationId) return;
    // On-demand: just pause/resume — don't switch to live
    if (isOnDemand) {
      togglePlayback();
    } else {
      toggleStation(displayStationId);
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-label="Global audio player"
      role="region"
    >
      {/* Station color accent line — gradient fades to transparent at both edges */}
      <div
        className="h-[3px] w-full transition-all duration-500"
        style={{ background: `linear-gradient(to right, transparent, ${accentColor}, transparent)` }}
      />

      {/* Main bar */}
      <div className="bg-[#080808]/96 backdrop-blur-2xl border-t border-white/[0.07] px-4 md:px-8 h-16 flex items-center gap-4">

        {/* Album art — episode art when on-demand, otherwise live station art */}
        <div className="w-9 h-9 rounded-md overflow-hidden border border-white/10 shrink-0 bg-neutral-900 flex items-center justify-center">
          {(isOnDemand ? onDemandItem?.art : activeMeta?.artUrl) ? (
            <img
              src={isOnDemand ? onDemandItem!.art : activeMeta!.artUrl}
              alt="Now playing"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <Radio className="w-4 h-4 text-neutral-600" />
          )}
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span className="text-[8px] font-mono uppercase tracking-[0.22em] leading-none mb-1 transition-colors duration-500" style={{ color: accentColor }}>
            {stationName}
          </span>
          <span className="text-[11px] font-mono font-black text-white/90 uppercase tracking-wide truncate leading-tight">
            {isOnDemand ? (onDemandItem?.title || "—") : (activeMeta?.trackTitle || "—")}
          </span>
          {!isOnDemand && (
            <span className="text-[8px] font-mono text-white/35 uppercase tracking-widest truncate leading-none mt-0.5">
              {activeMeta?.trackArtist || ""}
            </span>
          )}
        </div>

        {/* LIVE badge — hidden during on-demand */}
        {!isOnDemand && activeMeta?.isPlayingLive && (
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: accentColor }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: accentColor }} />
            </span>
            <span className="text-[8px] font-mono font-extrabold uppercase tracking-[0.2em] text-white/60">LIVE</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Station page link */}
          {displayStationId && displayStationId !== "wjrn" && (
            <a
              href={STATION_SLUGS[displayStationId]}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
                e.preventDefault();
                navigate(STATION_SLUGS[displayStationId!]);
              }}
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-[0.18em] transition-colors duration-150 text-white/60 hover:text-white mr-5 shrink-0"
            >
              Go to this station <ArrowRight className="w-3 h-3" />
            </a>
          )}

          {/* Mute toggle */}
          <button id="mini-player-mute" onClick={() => setIsMuted(!isMuted)}
            className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors duration-150 rounded-full hover:bg-white/5"
            aria-label={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* On-demand seek controls — only when playing an episode */}
          {isOnDemand && (
            <>
              <button onClick={seekToStart} title="Start from beginning"
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors rounded-full hover:bg-white/5">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button onClick={seekBackward} title="Back 15 seconds"
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/80 text-[10px] font-mono font-black transition-colors rounded-full hover:bg-white/5">
                -15
              </button>
            </>
          )}

          {/* Play / Pause / Connecting spinner */}
          <button
            id="mini-player-playpause"
            onClick={handlePlayPause}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{ backgroundColor: accentColor }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isConnecting ? (
              <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 text-black" fill="black" />
            ) : (
              <Play className="w-4 h-4 text-black ml-0.5" fill="black" />
            )}
          </button>

          {/* +15 — on-demand only */}
          {isOnDemand && (
            <button onClick={seekForward} title="Forward 15 seconds"
              className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/80 text-[10px] font-mono font-black transition-colors rounded-full hover:bg-white/5">
              +15
            </button>
          )}

          {/* Stop / Dismiss */}
          <button
            id="mini-player-stop"
            onClick={handleStop}
            className="w-8 h-8 flex items-center justify-center text-white/25 hover:text-white/60 transition-colors duration-150 rounded-full hover:bg-white/5"
            aria-label="Stop playback"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
