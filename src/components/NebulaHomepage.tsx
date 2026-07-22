import React from "react";
import {
  Play,
  Pause,
  Radio,
  Antenna,
  ArrowRight,
} from "lucide-react";
import { Station, NowPlaying, RadioConfig } from "../types";
import { navigate } from "../navigate";
import TwitchSchedule from "./TwitchScheduleRetro";
import wjrnLogoCubed from "../assets/images/wjrn-logo-cubed.svg";
import defaultArt from "../assets/images/jacewon-thumbnail.jpg";

// Premium imported assets for the high-end station player cards
import vinylLogoTrg from "../assets/images/vinyl-logo-trg.png";
import vinylLogoBchs from "../assets/images/vinyl-logo-bchs.png";
import vinylLogoGbs from "../assets/images/vinyl-logo-gbs.png";

import dialLogoTrg from "../assets/images/dial-logos-trg.png";
import dialLogoBchs from "../assets/images/dial-logos-bchs.png";
import dialLogoGbs from "../assets/images/dial-logos-gbs.png";

const VINYL_ARTWORKS: { [key: string]: string } = {
  rock_garden: vinylLogoTrg,
  bridge_city: vinylLogoBchs,
  golden_boombox: vinylLogoGbs,
};

const DIAL_LOGOS: { [key: string]: string } = {
  rock_garden: dialLogoTrg,
  bridge_city: dialLogoBchs,
  golden_boombox: dialLogoGbs,
};

interface NebulaHomepageProps {
  STATIONS: Station[];
  activeStationId: string | null;
  setActiveStationId: (id: string | null) => void;
  toggleStation: (id: string) => void;
  audioState: "idle" | "connecting" | "playing" | "error";
  metadata: { [key: string]: NowPlaying };
  utcTime: string;
  currentConfig: RadioConfig;
  onToggleView: () => void;
}

export default function NebulaHomepage({
  STATIONS,
  activeStationId,
  toggleStation,
  audioState,
  metadata,
  currentConfig,
}: NebulaHomepageProps) {

  const STATION_SLUGS: { [key: string]: string } = {
    rock_garden: "the-rock-garden",
    bridge_city: "bridge-city-hang-suite",
    golden_boombox: "the-golden-boombox",
  };

  return (
    <div id="nebula_homepage_layout" className="relative min-h-screen w-full text-white flex flex-col justify-between overflow-hidden font-sans pt-4 md:pt-6 lg:pt-8 pb-6 md:pb-10 lg:pb-14 px-6 md:px-10 lg:px-14 select-none" style={{ background: "radial-gradient(circle at 80% 20% in oklab, #2a2116 0%, #0e0a06 100%)" }}>

      {/* 1. Nebula Cosmic Fire Background in soft brown and mustard #664d49 spectrum */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">

        {/* SVG Procedural Analog Noise Overlay to soften gradients and prevent banding */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none z-10" xmlns="http://www.w3.org/2000/svg">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>

        {/* Ambient Embers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] opacity-45" />
      </div>

      {/* 2. Top Header - Logo / Nav / Live Indicator */}
      <header className="relative z-30 w-full flex items-center justify-between pb-6 max-w-6xl mx-auto gap-4">
        {/* Logo lockup (Far Upper Left) */}
        <a
          href="/"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
            e.preventDefault();
            navigate("/");
          }}
          className="flex items-center gap-3 cursor-pointer select-none shrink-0"
        >
          <img src={wjrnLogoCubed} alt="WJRN" className="logo-base h-6 md:h-7 w-auto object-contain" />
          <span className="hidden sm:flex items-center gap-3">
            <span className="w-px h-3.5 bg-white/20" />
            <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.2em] text-white/70">
              Jacewon Radio Network
            </span>
          </span>
        </a>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-5 text-[11px] font-mono uppercase tracking-[0.2em]">
          <a
            href="/"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
              e.preventDefault();
              navigate("/");
            }}
            className="text-white/80 hover:text-[#b5945b] transition-colors"
          >
            Home
          </a>
          <span className="text-white/20">&middot;</span>

          {/* Our Stations — hover dropdown */}
          <div className="relative group py-2">
            <span className="text-white/80 group-hover:text-[#b5945b] transition-colors cursor-default">
              Our Stations
            </span>
            <div className="absolute left-1/2 -translate-x-1/2 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pt-2">
              <div className="flex flex-col min-w-[230px] rounded-lg border border-white/10 bg-[#0c0908]/95 backdrop-blur-md shadow-2xl overflow-hidden">
                {STATIONS.filter((s) => s.id !== "wjrn").map((station) => (
                  <a
                    key={station.id}
                    href={`/${STATION_SLUGS[station.id]}`}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
                      e.preventDefault();
                      navigate(`/${STATION_SLUGS[station.id]}`);
                    }}
                    className="px-4 py-2.5 text-[10px] tracking-[0.15em] text-white/70 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
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
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
              e.preventDefault();
              navigate("/about-wjrn");
            }}
            className="text-white/80 hover:text-[#b5945b] transition-colors"
          >
            About WJRN
          </a>
        </nav>

        {/* Live Indicator (Far Upper Right) */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <Antenna className="w-3 h-3 text-red-500 animate-pulse shrink-0" />
          <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.2em] text-white/80">
            Live From California
          </span>
        </div>
      </header>
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white to-transparent mb-8 opacity-20 max-w-6xl mx-auto relative z-10" />

      {/* 3. Hero — Vintage Receiver Player Embed */}
      <section className="relative z-10 w-full max-w-6xl mx-auto mt-2 mb-16 md:mb-24">
        <div className="w-full aspect-[1280/443] overflow-hidden rounded-lg shadow-[0_35px_70px_rgba(0,0,0,0.55)]">
          <iframe
            src="https://radio.jacewonmusic.com/player/?popout=true"
            title="WJRN Vintage Player"
            className="w-full h-full border-0 block"
            allow="autoplay"
          />
        </div>
      </section>

      {/* 5. Glassy Selectable Stream Channels Slider/Deck modules */}
      <section className="relative z-10 w-full max-w-6xl mx-auto mt-10 md:-mt-[7px] mb-6">
        <div className="flex flex-col gap-5">
          <span className="md:hidden text-[10px] font-mono uppercase tracking-[0.25em] text-white/40 text-center w-full block">SELECT THE STATION TO PLAY NOW:</span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STATIONS.filter((s) => s.id !== "wjrn").map((station) => {
              const isActive = activeStationId === station.id;
              const meta = metadata[station.id] || {
                trackTitle: "OFFLINE",
                trackArtist: "WJRN Broadcast Network",
                album: "Offline",
                artUrl: defaultArt,
                listeners: 0,
                isOnline: false,
                isPlayingLive: false,
                nextTrack: null
              };
              let stationColorClass = "border-[#b5945b]/15 hover:border-[#b5945b]/60";
              let activeBorderColor = "border-[#b5945b]/60";
              let textColorClass = "text-[#b5945b]";
              let pulseColorBg = "bg-[#b5945b]";
              let shadowActiveClass = "shadow-[0_20px_50px_-10px_rgba(181,148,91,0.22)]";
              let glowColorBg = "rgba(181,148,91,0.22)";

              if (station.id === "rock_garden") {
                stationColorClass = "border-emerald-500/15 hover:border-emerald-500/60";
                activeBorderColor = "border-emerald-500/60";
                textColorClass = "text-emerald-400";
                pulseColorBg = "bg-emerald-500";
                shadowActiveClass = "shadow-[0_20px_50px_-10px_rgba(116,179,56,0.22)]";
                glowColorBg = "rgba(116,179,56,0.35)";
              }
              if (station.id === "bridge_city") {
                stationColorClass = "border-pink-500/15 hover:border-pink-500/60";
                activeBorderColor = "border-pink-500/60";
                textColorClass = "text-pink-400";
                pulseColorBg = "bg-pink-500";
                shadowActiveClass = "shadow-[0_20px_50px_-10px_rgba(255,0,102,0.22)]";
                glowColorBg = "rgba(255,0,102,0.22)";
              }
              if (station.id === "golden_boombox") {
                stationColorClass = "border-yellow-500/15 hover:border-yellow-500/60";
                activeBorderColor = "border-yellow-500/60";
                textColorClass = "text-yellow-400";
                pulseColorBg = "bg-yellow-500";
                shadowActiveClass = "shadow-[0_20px_50px_-10px_rgba(226,172,0,0.22)]";
                glowColorBg = "rgba(226,172,0,0.22)";
              }

              const learnMoreHoverClass =
                station.id === "rock_garden" ? "hover:bg-emerald-500 hover:border-emerald-500" :
                  station.id === "bridge_city" ? "hover:bg-pink-500 hover:border-pink-500" :
                    station.id === "golden_boombox" ? "hover:bg-yellow-500 hover:border-yellow-500" :
                      "hover:bg-[#b5945b] hover:border-[#b5945b]";

              const isOnline = !!station.streamUrl;
              const vinylArt = VINYL_ARTWORKS[station.id] || station.logoUrl;

              return (
                <div
                  key={station.id}
                  onClick={() => toggleStation(station.id)}
                  className={`pt-7 pb-7 px-7 rounded-3xl border bg-gradient-to-b from-[#0a0706] to-[#040303] backdrop-blur-xl transition-all duration-500 cursor-pointer flex flex-col justify-between min-h-[440px] relative overflow-hidden group ${isActive
                      ? `${activeBorderColor} shadow-2xl -translate-y-1.5 bg-white/[0.045] ${shadowActiveClass}`
                      : `${stationColorClass} hover:shadow-2xl hover:-translate-y-1.5`
                    }`}
                >
                  {/* Premium analog dotted board background matrix on hover */}
                  <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.012)_1.5px,transparent_1.5px)] bg-[size:24px_24px] pointer-events-none transition-opacity duration-700 ${isActive ? "opacity-100" : "opacity-40 group-hover:opacity-100"
                    }`} />

                  {/* Subtle top edge custom color accent strip */}
                  <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-current to-transparent transition-opacity duration-500 ${textColorClass} ${isActive ? "opacity-60" : "opacity-0 group-hover:opacity-60"
                    }`} />

                  {/* STATION CORE TITLE, ROTATING VINYL & BRANDING */}
                  <div className="mt-6 mb-6 flex flex-col gap-6 relative z-10 flex-1 justify-center items-center text-center">
                    {/* Beautiful Vinyl Spinning Disc Cover Artwork with Reflection Glare */}
                    <div className="relative">
                      {isActive && (
                        <div
                          className="absolute -inset-10 rounded-full blur-3xl animate-performant-pulse"
                          style={{ backgroundColor: glowColorBg }}
                        />
                      )}
                      {/* For rock garden always show a subtle faint green glow behind it */}
                      {station.id === "rock_garden" && (
                        <div className="absolute -inset-10 rounded-full bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 pointer-events-none transition-all duration-500" />
                      )}
                      <div className={`w-56 h-56 rounded-full overflow-hidden shrink-0 shadow-[0_15px_35px_rgba(0,0,0,0.8)] flex items-center justify-center bg-black duration-700 transition-transform relative ${isActive ? "scale-105" : "group-hover:scale-105"
                        }`}>
                        <img
                          src={vinylArt}
                          alt={`${station.name} spinning vinyl`}
                          className={`w-full h-full object-cover rounded-full ${isActive && audioState === "playing" ? "animate-[spin_8s_linear_infinite]" : ""
                            }`}
                          referrerPolicy="no-referrer"
                        />
                        {/* Realistic vinyl shine projection layer */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 via-white/[0.04] to-black/40 pointer-events-none mix-blend-overlay" />
                      </div>
                    </div>

                    {/* Core Station Header & Secondary Genres Centered */}
                    <div className="space-y-2 max-w-[270vw]">
                      <h4 className="text-xl sm:text-2xl font-bold tracking-normal text-white uppercase leading-tight font-display transition-colors group-hover:text-white">
                        {station.name}
                      </h4>
                      <span className={`text-[9.5px] font-mono uppercase tracking-[0.22em] block leading-snug font-bold ${textColorClass}`}>
                        {station.genre.replace(/,/g, " •")}
                      </span>
                    </div>
                  </div>

                  {/* NOW PLAYING CONTAINER FOR SONGS & LIVE CONTROL */}
                  <div className="pt-5 flex flex-col gap-4 relative z-10 mt-auto">

                    <div className="relative overflow-hidden rounded-2xl bg-[#090605]/80 border border-white/5 p-3 flex flex-col gap-3 transition-colors duration-300 group-hover:bg-[#0b0807]/90 group-hover:border-white/10 shadow-inner">

                      {/* Compact Now Playing visual header inside the box */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-1.5 w-full">
                        <span className={`text-[8.5px] font-mono uppercase tracking-[0.2em] font-extrabold ${textColorClass}`}>
                          Now Playing
                        </span>
                        {isActive && audioState === "playing" && (
                          <div className="flex items-end gap-[1.5px] h-2.5">
                            <span className={`w-[1px] ${pulseColorBg} animate-bounce h-2`} style={{ animationDelay: "0.1s" }} />
                            <span className={`w-[1px] ${pulseColorBg} animate-bounce h-2.5`} style={{ animationDelay: "0.3s" }} />
                            <span className={`w-[1px] ${pulseColorBg} animate-bounce h-1.5`} style={{ animationDelay: "0.5s" }} />
                          </div>
                        )}
                      </div>

                      {/* Track Details & Control button */}
                      <div className="flex items-center justify-between gap-3 w-full">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {meta.artUrl ? (
                            <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-white/15 shrink-0 shadow-lg bg-black">
                              <img
                                src={meta.artUrl}
                                alt="Track visual"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              {/* Overlay realistic vinyl look inside card */}
                              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
                            </div>
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-neutral-900 border border-white/10 shrink-0 flex items-center justify-center">
                              <Radio className="w-5 h-5 text-neutral-600" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <span className="text-[11.5px] font-mono text-white/95 truncate block uppercase tracking-wide leading-tight font-black">
                              {meta.trackTitle}
                            </span>
                            <span className="text-[8.5px] font-mono text-white/40 truncate block uppercase tracking-widest mt-1">
                              {meta.trackArtist}
                            </span>
                          </div>
                        </div>

                        {/* HIGH FIDELITY CLICK TRIGGER PLAY BUTTON FOR STREAM SELECTION */}
                        <div className="shrink-0 relative z-10">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${isActive
                              ? `${textColorClass} bg-white/10 border border-white/20 scale-105`
                              : "text-neutral-400 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20"
                            }`}>
                            {isActive && audioState === "playing" ? (
                              <Pause className="w-4 h-4 ml-0" />
                            ) : (
                              <Play className="w-4 h-4 translate-x-0.5" />
                            )}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* METRICS & LISTENER TELEMETRY WITH RELOCATED BADGES */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mt-1 uppercase tracking-widest font-semibold">
                      {/* Bottom Left: ON THE AIR component */}
                      <span className="text-[9px] uppercase font-mono tracking-[0.2em] font-extrabold flex items-center gap-1.5">
                        {isOnline ? (
                          <>
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColorBg} opacity-75`}></span>
                              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${pulseColorBg}`}></span>
                            </span>
                            <span className="text-white/80">ON THE AIR</span>
                          </>
                        ) : (
                          <>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-neutral-600"></span>
                            <span className="text-neutral-500">OFFLINE</span>
                          </>
                        )}
                      </span>

                      {/* Bottom Right: Listener statistics */}
                      <span className="flex items-center gap-1.5">
                        <span className={`inline-block w-1 rounded-full ${isActive ? pulseColorBg + " animate-pulse" : "bg-neutral-600"}`} />
                        <span className="text-white/70 font-bold">{meta.listeners.toLocaleString()}</span> LISTENERS
                      </span>
                    </div>

                    {/* LEARN MORE LINK */}
                    <a
                      href={`/${STATION_SLUGS[station.id]}`}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
                        e.preventDefault();
                        navigate(`/${STATION_SLUGS[station.id]}`);
                      }}
                      className={`mt-1 w-full py-4 px-4 rounded-xl border text-[11px] font-mono font-semibold uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 bg-white/[0.03] hover:text-black ${textColorClass} border-current ${learnMoreHoverClass}`}
                    >
                      Learn More <span className="hidden sm:inline">About This Station</span> <ArrowRight className="w-3 h-3" />
                    </a>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Live Twitch Center Embed inside the Secondary layout */}
      <section className="relative z-10 w-full max-w-6xl mx-auto pt-8 mt-4 pb-20">
        <TwitchSchedule
          twitchChannel={currentConfig.twitchChannel}
          scheduledDaysText={currentConfig.twitchLiveSchedule}
        />
      </section>

      {/* 7. Beautiful Minimal Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto border-t border-white/5 pt-5 mt-8 mb-24 flex flex-col md:flex-row items-center justify-between text-[10px] font-mono text-white/60 uppercase tracking-widest gap-4">
        <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
          <span>For Promotional Use Only</span>
          <span>All Music Is The Property Of Its Respective Owners</span>
        </div>
        <div className="flex flex-col items-center md:items-end gap-1 text-center md:text-right">
          <span className="flex items-center gap-1.5">
            Designed with <span className="animate-pulse text-[14px] leading-none">❤</span> in California
          </span>
          <span>Copyright &copy; JWBC 2026 &middot; All Rights Reserved</span>
        </div>
      </footer>

    </div>
  );
}
