import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Antenna,
  ArrowRight,
} from "lucide-react";
import { Station, NowPlaying, RadioConfig } from "../types";
import { navigate } from "../navigate";
import { usePlayer } from "../context/PlayerContext";
import TwitchSchedule from "./TwitchScheduleRetro";
import wjrnLogoCubed from "../assets/images/wjrn-logo-cubed.svg";
import defaultArt from "../assets/images/jacewon-thumbnail.jpg";
import AudioVisualizer from "./AudioVisualizer";

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
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  metadata: { [key: string]: NowPlaying };
  utcTime: string;
  currentConfig: RadioConfig;
  visualizerType: "bars" | "wave" | "retro";
  setVisualizerType: (type: "bars" | "wave" | "retro") => void;
  onToggleView: () => void;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
}

export default function NebulaHomepage({
  STATIONS,
  activeStationId,
  toggleStation,
  audioState,
  volume,
  setVolume,
  isMuted,
  setIsMuted,
  metadata,
  currentConfig,
  visualizerType,
  setVisualizerType,
  audioRef,
}: NebulaHomepageProps) {
  
  const STATION_SLUGS: { [key: string]: string } = {
    rock_garden: "the-rock-garden",
    bridge_city: "bridge-city-hang-suite",
    golden_boombox: "the-golden-boombox",
  };

  // Remember the last station that was played so the smartphone
  // component doesn't snap back to Rock Garden when playback is paused.
  const lastActiveStationIdRef = useRef<string>(STATIONS[0]?.id ?? "rock_garden");
  if (activeStationId) lastActiveStationIdRef.current = activeStationId;

  // Resolve the displayed station: playing station > last played station > first station
  const displayStationId = activeStationId ?? lastActiveStationIdRef.current;
  const activeStation = STATIONS.find(s => s.id === displayStationId) || STATIONS[0] || { id: "rock_garden", name: "THE ROCK GARDEN", genre: "", logoUrl: "", streamUrl: "", shortcode: "", showUrl: "" };
  const activeMeta = metadata[activeStation.id] || {
    trackTitle: "OFFLINE",
    trackArtist: "WJRN Broadcast Network",
    album: "Offline",
    artUrl: defaultArt,
    listeners: 0,
    isOnline: false,
    isPlayingLive: false,
    nextTrack: null
  };

  // Helper to go to next station
  const { isOnDemand, onDemandItem, togglePlayback } = usePlayer();

  const cycleViz = () => {
    setVisualizerType(
      visualizerType === "bars" ? "wave" :
      visualizerType === "wave" ? "retro" : "bars"
    );
  };

  const playNextStation = () => {
    const currentIndex = STATIONS.findIndex(s => s.id === (activeStationId || STATIONS[0].id));
    const nextIndex = (currentIndex + 1) % STATIONS.length;
    toggleStation(STATIONS[nextIndex].id);
  };

  // Helper to go to previous station
  const playPrevStation = () => {
    const currentIndex = STATIONS.findIndex(s => s.id === (activeStationId || STATIONS[0].id));
    const prevIndex = (currentIndex - 1 + STATIONS.length) % STATIONS.length;
    toggleStation(STATIONS[prevIndex].id);
  };

  // Parallax refs — DOM mutation on scroll, no re-render
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (window.innerWidth < 1024) return;
      const y = window.scrollY;
      if (leftPanelRef.current)  leftPanelRef.current.style.transform  = `translateX(${y * -0.06}px)`;
      if (rightPanelRef.current) rightPanelRef.current.style.transform = `translateX(${y * 0.05}px)`;
      if (phoneRef.current)      phoneRef.current.style.transform      = `translateY(${y * -0.09}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // State to track Pacific Time (PST/PDT) Split for custom separator
  const [pacificDate, setPacificDate] = useState("");
  const [pacificTimeOnly, setPacificTimeOnly] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const timeStr = d.toLocaleTimeString("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
      const dateStr = d.toLocaleDateString("en-US", {
        timeZone: "America/Los_Angeles",
        month: "short",
        day: "2-digit",
        year: "numeric"
      });
      setPacificDate(dateStr);
      setPacificTimeOnly(`${timeStr} PACIFIC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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

      {/* 2. Top Header - Strict 3 Elements Layout */}
      <header className="relative z-10 w-full flex items-center justify-between pb-6 max-w-7xl mx-auto">
        {/* (1) Broadcasting Info (Far Upper Left) */}
        <div className="hidden md:flex flex-col text-left">
          <span className="text-[9px] uppercase tracking-[0.25em] text-[#b5945b] font-mono mb-1">Broadcasting</span>
          <span className="text-xs md:text-sm font-bold uppercase tracking-wide text-white/95 font-mono flex items-center gap-1.5">
            <Antenna className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />
            LIVE FROM CALIFORNIA
          </span>
        </div>

        {/* (3) SVG Logo (Center Alignment) */}
        <div className="flex justify-center flex-1 md:max-w-[240px] px-4">
          <a href="/" onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
            e.preventDefault();
            navigate("/");
          }} className="relative h-[53px] md:h-[63px] group-logo logo-load-distortion cursor-pointer select-none">
            {/* Base Brown Logo */}
            <img
              src={wjrnLogoCubed}
              alt="WJRN Logo"
              className="h-full object-contain logo-base"
            />
            {/* White Logo Overlay (Revealed from center) */}
            <img
              src={wjrnLogoCubed}
              alt="WJRN Logo White"
              className="absolute inset-0 w-full h-full object-contain logo-white-reveal pointer-events-none"
            />
          </a>
        </div>

        {/* (2) Studio Clock Sync Info (Far Upper Right) */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-[9px] uppercase tracking-[0.25em] text-[#b5945b] font-mono mb-1">STUDIO CLOCK SYNC</span>
          <span className="text-xs md:text-sm font-bold text-white/95 font-mono flex items-center justify-end gap-2">
            <span>{pacificTimeOnly}</span>
          </span>
        </div>
      </header>
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white to-transparent mb-8 opacity-20 max-w-7xl mx-auto relative z-10" />

      {/* 3. Hero Section & Typography Layout */}
      <section className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start mt-2">
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex items-center justify-center lg:justify-start mb-3">
            <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#b5945b]">WJRN - JACEWON RADIO NETWORK</span>
          </div>
          <h2 className="text-[44px] sm:text-5xl md:text-6xl lg:text-[90px] font-extrabold leading-[0.95] tracking-normal text-white uppercase select-none font-display text-center lg:text-left">
            STATIONS THAT DON'T ASK FOR PERMISSION
          </h2>
        </div>
        <div className="lg:col-span-4 lg:pt-6">
          <p className="text-xs md:text-sm lg:text-base text-neutral-400 leading-relaxed font-light font-mono text-center lg:text-left">
            Every show we broadcast is built with intent and taste, mixed live in front of a studio audience, and kept in rotation around the clock.
          </p>
        </div>
      </section>

      {/* 4. Centerpiece Immersive Layout (Smartphone & Side Panels) */}
      <section className="relative z-20 w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-[15px] mb-8 md:mt-[19px] md:mb-11 items-center">
        
        {/* LEFT PANEL */}
        <div ref={leftPanelRef} style={{ willChange: "transform" }} className="lg:col-span-3 hidden lg:flex flex-col gap-10">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-md w-fit">
            <span className="block text-[9px] uppercase tracking-widest text-[#b5945b] font-mono mb-1.5">BROADCAST INFO</span>
            <span className="text-xs text-white/80 font-mono block mb-1">Locale: California, USA</span>
            <span className="text-xs text-white/80 font-mono block">Host: Jacewon</span>
          </div>

          <div className="space-y-4 w-fit">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#b5945b]" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-300">ALWAYS ON ALWAYS FRESH</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#664d49]" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-300">LIVE STREAMS WEEKLY</span>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: INTERACTIVE GLASSY PHONE CONTROLLER */}
        <div ref={phoneRef} style={{ willChange: "transform" }} className="lg:col-span-6 flex justify-center items-center relative py-4 z-30">
          <div className="relative w-full max-w-[422px] aspect-[9/18.5] bg-neutral-950/90 rounded-[44px] p-3.5 border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.85),0_0_50px_rgba(181,148,91,0.08)] overflow-hidden group/phone">
            
            {/* Phone Top Speaker Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-950 rounded-b-2xl z-40 border-b border-r border-l border-white/5 flex items-center justify-center">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Simulated Reflection Glare */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.02] to-white/0 pointer-events-none z-30" />

            {/* Inner App Content Screen */}
            <div
              className="relative w-full h-full bg-[#080605] rounded-[34px] overflow-hidden flex flex-col select-none cursor-pointer"
              onClick={cycleViz}
            >
              {/* Ambient glow when playing */}
              {audioState === "playing" && (
                <div className="absolute inset-0 z-0 pointer-events-none">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(181,148,91,0.10),_transparent_70%)] animate-pulse" style={{ animationDuration: "3s" }} />
                </div>
              )}

              {/* Screen Header */}
              <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-white/40 uppercase tracking-widest border-b border-white/5 pt-8 px-[18px] pb-2.5 shrink-0">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-[#b5945b] animate-pulse" />
                  WJRN ONLINE
                </span>
                <span>Stereo 320k</span>
              </div>

              {/* TOP VISUALIZER BAND — fills space above content */}
              <div className="relative z-10 flex-1 overflow-hidden px-[18px] pt-2 pb-1 min-h-[44px] opacity-60">
                <AudioVisualizer isPlaying={audioState === "playing" || audioState === "connecting"} type={visualizerType} accentColor="#b5945b" audioRef={audioRef} isFlipped={true} />
              </div>

              {/* CONTENT GROUP — art + status + meta + controls + volume */}
              <div className="relative z-10 shrink-0 flex flex-col gap-2 px-[18px]">

                {/* Album Cover Art — full width, clicking cycles viz */}
                <div
                  className={`w-full aspect-square rounded-xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.9)] relative border border-white/15 transition-all duration-500 ease-out ${
                    audioState === "playing" ? "scale-[1.01]" : "scale-[0.99]"
                  }`}
                >
                  <img
                    src={(isOnDemand ? onDemandItem?.art : activeMeta.artUrl) || defaultArt}
                    alt="Current station art"
                    className="w-full h-full object-cover transition-all duration-700 ease-in-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.08] to-white/0 pointer-events-none" />
                </div>

                {/* Soundwave / status */}
                <div className="h-4 flex items-end justify-center gap-[3px]">
                  {audioState === "playing" ? (
                    Array.from({ length: 9 }).map((_, idx) => {
                      const delays = [0.1,0.4,0.2,0.6,0.3,0.5,0.2,0.4,0.1];
                      const heights = ["h-3","h-2","h-4","h-2.5","h-3.5","h-2","h-4","h-3","h-1.5"];
                      return (
                        <span key={idx} className={`w-[2px] bg-[#b5945b] rounded-full ${heights[idx]} origin-bottom animate-[bounce_1.2s_ease-in-out_infinite]`} style={{ animationDelay: `${delays[idx]}s` }} />
                      );
                    })
                  ) : (
                    <span className="text-[9px] uppercase font-mono tracking-widest text-[#b5945b]/80">STREAM PAUSED</span>
                  )}
                </div>

                {/* Station + track meta */}
                <div className="text-center">
                  <h4 className="text-[13px] font-bold text-white truncate uppercase font-mono tracking-wider">{activeStation.name}</h4>
                  <p className="text-[11px] text-[#b5945b] font-mono mt-0.5 tracking-wider truncate uppercase">{isOnDemand ? (onDemandItem?.title ?? "") : activeMeta.trackTitle}</p>
                  <p className="text-[9.5px] text-white/50 font-mono tracking-wide truncate mt-0.5">{isOnDemand ? "ON DEMAND" : `by ${activeMeta.trackArtist}`}</p>
                </div>

                {/* Controls — stopPropagation so clicks don't cycle viz */}
                <div
                  className="flex items-center justify-center gap-4 py-1.5 border-t border-b border-white/5"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  <button onClick={playPrevStation} className="w-10 h-10 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-full flex items-center justify-center text-white transition-all cursor-pointer" title="Previous Channel">
                    <svg className="w-4 h-4 fill-current text-white/90" viewBox="0 0 24 24"><path d="M6 19h2V5H6v14zm3.5-7L18 19V5l-8.5 7z" /></svg>
                  </button>
                  <button onClick={() => isOnDemand ? togglePlayback() : toggleStation(activeStation.id)} className="w-12 h-12 bg-[#b5945b] hover:bg-[#cbb085] active:scale-95 rounded-full flex items-center justify-center text-black shadow-lg shadow-[#b5945b]/20 transition-all cursor-pointer animate-[pulse_6s_infinite]" title="Play / Pause">
                    {audioState === "playing" ? <Pause className="w-5 h-5 text-black fill-current" /> : <Play className="w-5 h-5 text-black fill-current translate-x-0.5" />}
                  </button>
                  <button onClick={playNextStation} className="w-10 h-10 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-full flex items-center justify-center text-white transition-all cursor-pointer" title="Next Channel">
                    <svg className="w-4 h-4 fill-current text-white/90" viewBox="0 0 24 24"><path d="M6 5v14l8.5-7L6 5zm10 0v14h2V5h-2z" /></svg>
                  </button>
                </div>

                {/* Volume — stopPropagation */}
                <div
                  className="bg-white/[0.02] border border-white/5 rounded-full px-4 py-2"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => setIsMuted(!isMuted)} className="p-0.5 text-white/60 hover:text-white transition-colors cursor-pointer">
                      {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#b5945b]" /> : <Volume2 className="w-3.5 h-3.5 text-[#b5945b]" />}
                    </button>
                    <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
                      onChange={(e) => { setVolume(parseFloat(e.target.value)); if (isMuted) setIsMuted(false); }}
                      className="flex-1 h-[2px] bg-white/10 rounded-full appearance-none cursor-pointer accent-[#b5945b]"
                    />
                  </div>
                </div>

              </div>

              {/* BOTTOM VISUALIZER BAND — fills space below content */}
              <div className="relative z-10 flex-1 overflow-hidden px-[18px] pb-2 pt-1 min-h-[44px] opacity-60">
                <AudioVisualizer isPlaying={audioState === "playing" || audioState === "connecting"} type={visualizerType} accentColor="#b5945b" audioRef={audioRef} />
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div ref={rightPanelRef} style={{ willChange: "transform" }} className="lg:col-span-3 flex flex-col md:flex-row lg:flex-col justify-between h-full gap-8 items-center lg:items-end">
          
          <div className="text-center lg:text-right flex flex-col items-center lg:items-end gap-1.5 p-4 rounded-xl bg-white/[0.01] border border-white/5 w-fit mx-auto lg:mr-0 lg:ml-auto md:mx-0">
            <span className="block text-[9px] uppercase tracking-widest text-[#b5945b] font-mono">ESTABLISHED</span>
            <span className="text-sm font-bold uppercase font-mono text-white">MAY 2020</span>
            <span className="text-xs text-neutral-500 font-mono uppercase tracking-wider">PACIFIC NORTH FRESH</span>
          </div>

          {/* Premium deliverables list details matching mockup */}
          <div className="text-center lg:text-right flex flex-col items-center lg:items-end gap-5 w-fit mx-auto lg:mr-0 lg:ml-auto md:mx-0">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#b5945b] text-center lg:text-right">NOT-SO FRIENDLY REMINDERS</span>
            <ul className="text-xs text-neutral-400 space-y-1.5 font-mono text-center lg:text-right">
              <li>Playlists are for elevators</li>
              <li>Support your local musicians</li>
              <li>New country is bad country</li>
              <li>Pop is a drink, not a genre</li>
            </ul>
          </div>

          <div className="hidden lg:block h-10" />

        </div>

      </section>

      {/* 5. Glassy Selectable Stream Channels Slider/Deck modules */}
      <section className="relative z-10 w-full max-w-7xl mx-auto mt-10 md:-mt-[7px] mb-6">
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
                  className={`pt-7 pb-7 px-7 rounded-3xl border bg-gradient-to-b from-[#0a0706] to-[#040303] backdrop-blur-xl transition-all duration-500 cursor-pointer flex flex-col justify-between min-h-[440px] relative overflow-hidden group ${
                    isActive 
                      ? `${activeBorderColor} shadow-2xl -translate-y-1.5 bg-white/[0.045] ${shadowActiveClass}` 
                      : `${stationColorClass} hover:shadow-2xl hover:-translate-y-1.5`
                  }`}
                >
                  {/* Premium analog dotted board background matrix on hover */}
                  <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.012)_1.5px,transparent_1.5px)] bg-[size:24px_24px] pointer-events-none transition-opacity duration-700 ${
                    isActive ? "opacity-100" : "opacity-40 group-hover:opacity-100"
                  }`} />
                  
                  {/* Subtle top edge custom color accent strip */}
                  <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-current to-transparent transition-opacity duration-500 ${textColorClass} ${
                    isActive ? "opacity-60" : "opacity-0 group-hover:opacity-60"
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
                      <div className={`w-56 h-56 rounded-full overflow-hidden shrink-0 shadow-[0_15px_35px_rgba(0,0,0,0.8)] flex items-center justify-center bg-black duration-700 transition-transform relative ${
                        isActive ? "scale-105" : "group-hover:scale-105"
                      }`}>
                        <img 
                          src={vinylArt} 
                          alt={`${station.name} spinning vinyl`} 
                          className={`w-full h-full object-cover rounded-full ${
                            isActive && audioState === "playing" ? "animate-[spin_8s_linear_infinite]" : ""
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
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                            isActive 
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
      <section className="relative z-10 w-full max-w-7xl mx-auto pt-8 mt-4 pb-20">
        <TwitchSchedule 
          twitchChannel={currentConfig.twitchChannel} 
          scheduledDaysText={currentConfig.twitchLiveSchedule} 
        />
      </section>

      {/* 7. Beautiful Minimal Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto border-t border-white/5 pt-5 mt-8 mb-24 flex flex-col md:flex-row items-center justify-between text-[10px] font-mono text-white/95 uppercase tracking-widest gap-4">
        <div className="flex items-center gap-1.5 uppercase">
          <span>Broadcasted with</span>
          <span className="animate-pulse text-[23px] leading-none">❤</span>
          <span>from California</span>
        </div>
        <div>COPYRIGHT © JWBC 2026 • ALL RIGHTS RESERVED</div>
      </footer>

    </div>
  );
}
