import { Play, Pause, Volume2, VolumeX, X, SkipForward } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import logoWjrn from "../assets/images/miniplayer-logo-wjrn.svg";
import logoTrg  from "../assets/images/miniplayer-logo-trg.svg";
import logoBchs from "../assets/images/miniplayer-logo-bchs.svg";
import logoGbs  from "../assets/images/miniplayer-logo-gbs.svg";

const STATION_LOGOS: Record<string, string> = {
  wjrn: logoWjrn, rock_garden: logoTrg, bridge_city: logoBchs, golden_boombox: logoGbs,
};
const STATION_COLORS: Record<string, string> = {
  wjrn: "#d7b158", rock_garden: "#74b338", bridge_city: "#ff0066", golden_boombox: "#e2ac00",
};
const STATION_NAMES: Record<string, string> = {
  wjrn: "WJRN", rock_garden: "THE ROCK GARDEN", bridge_city: "BRIDGE CITY HANG SUITE", golden_boombox: "THE GOLDEN BOOMBOX",
};
const CYCLE: readonly string[] = ["wjrn", "rock_garden", "bridge_city", "golden_boombox"];

const VIZ_H = [35,70,50,90,60,80,45,75,55,85,65,95,50,70,40,80,60,90,45,75];

interface Props {
  isPip?: boolean;
  onClose?: () => void;
}

export default function PopoutWidget({ onClose }: Props) {
  const {
    activeStationId, audioState, metadata,
    toggleStation, isMuted, setIsMuted,
  } = usePlayer();

  const stationId = activeStationId || "wjrn";
  const accent    = STATION_COLORS[stationId] ?? "#d7b158";
  const meta      = metadata[stationId];
  const isPlaying = audioState === "playing";
  const isConnecting = audioState === "connecting";

  const cycleStation = () => {
    const idx  = CYCLE.indexOf(stationId);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    toggleStation(next as string);
  };

  const trackTitle  = meta?.trackTitle  || "—";
  const trackArtist = meta?.trackArtist || "WJRN Broadcast Network";
  const isLongTitle = trackTitle.length > 22;

  return (
    <div
      className="w-[320px] h-[420px] flex flex-col overflow-hidden font-mono select-none bg-neutral-950"
      style={{ border: `1px solid ${accent}44` }}
    >
      {/* ── Header ───────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: `1px solid ${accent}28` }}
      >
        <span className="text-[8px] uppercase tracking-[0.3em] text-white/35">WJRN POCKET RADIO</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/80 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ── LCD Screen ───────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center justify-between px-5 py-4 bg-[#060504]"
        style={{ borderBottom: `1px solid ${accent}22` }}
      >
        {/* Station logo */}
        <img
          src={STATION_LOGOS[stationId]}
          alt={STATION_NAMES[stationId]}
          className="h-10 w-auto object-contain opacity-85"
        />

        {/* Track info */}
        <div className="w-full text-center space-y-1">
          <span className="text-[8px] uppercase tracking-[0.25em] block" style={{ color: accent }}>
            NOW PLAYING
          </span>
          <div className={`overflow-hidden mask-marquee h-[18px] flex items-center ${isLongTitle ? "" : "justify-center"}`}>
            <p className={`text-[13px] font-black text-white uppercase tracking-wide whitespace-nowrap ${isLongTitle ? "animate-marquee" : ""}`}
              style={isLongTitle ? { animationDuration: "14s" } : undefined}>
              {isLongTitle ? `${trackTitle}     ${trackTitle}` : trackTitle}
            </p>
          </div>
          <p className="text-[9px] text-white/35 uppercase tracking-widest truncate">
            {trackArtist}
          </p>
        </div>

        {/* LED visualizer */}
        <div className="flex items-end gap-[2px] h-10 w-full">
          {VIZ_H.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-[1px]"
              style={{
                height: isPlaying ? `${h}%` : "5%",
                backgroundColor: accent,
                opacity: isPlaying ? 0.75 : 0.2,
                transformOrigin: "bottom",
                ...(isPlaying ? {
                  animationName: "verticalPulse",
                  animationDuration: `${0.35 + (i % 5) * 0.08}s`,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                  animationDirection: "alternate",
                  animationDelay: `${(i * 0.04).toFixed(2)}s`,
                } : {}),
              }}
            />
          ))}
        </div>

        {/* Station name pill */}
        <div
          className="text-[8px] uppercase tracking-[0.22em] px-3 py-1 rounded-full"
          style={{ color: accent, border: `1px solid ${accent}40`, backgroundColor: `${accent}12` }}
        >
          {STATION_NAMES[stationId]}
        </div>
      </div>

      {/* ── Controls ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 bg-neutral-950 shrink-0">
        {/* Mute */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/10 active:scale-95 transition-all border border-white/10"
        >
          {isMuted
            ? <VolumeX className="w-4 h-4 text-white/50" />
            : <Volume2 className="w-4 h-4 text-white/50" />}
        </button>

        {/* Play / Pause */}
        <button
          onClick={() => toggleStation(stationId)}
          className="w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-lg"
          style={{ backgroundColor: accent, boxShadow: `0 0 20px ${accent}44` }}
        >
          {isConnecting ? (
            <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 text-black fill-current" />
          ) : (
            <Play className="w-5 h-5 text-black fill-current translate-x-0.5" />
          )}
        </button>

        {/* Channel cycle */}
        <button
          onClick={cycleStation}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/10 active:scale-95 transition-all border border-white/10"
        >
          <SkipForward className="w-4 h-4 text-white/50" />
        </button>
      </div>
    </div>
  );
}
