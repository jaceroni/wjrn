import React, { useState, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Radio, 
  Antenna,
} from "lucide-react";
import { Station, NowPlaying, RadioConfig } from "../types";
import TwitchSchedule from "./TwitchSchedule";
import wjrnLogoBrown from "../assets/images/wjrn-logo-brown.svg";

// Premium imported assets for the high-end station player cards
import vinylLogoTrg from "@/assets/vinyl-logo-trg.png";
import vinylLogoBchs from "@/assets/vinyl-logo-bchs.png";
import vinylLogoGbs from "@/assets/vinyl-logo-gbs.png";

import dialLogoTrg from "@/assets/dial-logos-trg.png";
import dialLogoBchs from "@/assets/dial-logos-bchs.png";
import dialLogoGbs from "@/assets/dial-logos-gbs.png";

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
}: NebulaHomepageProps) {
  
  // Find current active track details if playing, otherwise default to first station
  const activeStation = STATIONS.find(s => s.id === activeStationId) || STATIONS[0];
  const activeMeta = metadata[activeStation.id];

  // Helper to go to next station
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
      setPacificTimeOnly(`${timeStr} PT`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="nebula_homepage_layout" className="relative min-h-screen w-full bg-[#050201] text-white flex flex-col justify-between overflow-hidden font-sans p-6 md:p-10 lg:p-14 select-none">
      
      {/* Dynamic movement keyframes for premium ambient glow */}
      <style>{`
        @keyframes subtleGlowMoveOne {
          0% {
            transform: translate(0px, 0px) scale(1.0);
          }
          33% {
            transform: translate(6vw, -5vh) scale(1.08);
          }
          66% {
            transform: translate(-4vw, 4vh) scale(0.92);
          }
          100% {
            transform: translate(0px, 0px) scale(1.0);
          }
        }
        @keyframes subtleGlowMoveTwo {
          0% {
            transform: translate(0px, 0px) scale(1.0);
          }
          50% {
            transform: translate(-5vw, -6vh) scale(1.1);
          }
          100% {
            transform: translate(0px, 0px) scale(1.0);
          }
        }
        @keyframes verticalPulse {
          0%, 100% {
            transform: scaleY(0.15);
          }
          50% {
            transform: scaleY(0.95);
          }
        }
        .animate-glow-one {
          animation: subtleGlowMoveOne 24s ease-in-out infinite;
        }
        .animate-glow-two {
          animation: subtleGlowMoveTwo 28s ease-in-out infinite;
        }
      `}</style>
      
      {/* 1. Nebula Cosmic Fire Background in soft brown and mustard #664d49 spectrum */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        
        {/* SVG Procedural Analog Noise Overlay to soften gradients and prevent banding */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05] mix-blend-overlay pointer-events-none z-10" xmlns="http://www.w3.org/2000/svg">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>

        {/* Glow Element One: Mustard Gold Blend */}
        <div 
          className="absolute w-[160vw] h-[160vw] md:w-[110vw] md:h-[110vw] -top-[40vw] -right-[20vw] md:-top-[20vw] md:-right-[10vw] rounded-full filter blur-[130px] md:blur-[170px] opacity-85 mix-blend-screen animate-glow-one"
          style={{
            background: "radial-gradient(circle, rgba(181,148,91,0.42) 0%, rgba(102,77,73,0.30) 45%, rgba(102,77,73,0.05) 80%, rgba(0,0,0,0) 100%)"
          }}
        />

        {/* Glow Element Two: Soft Brown Chocolate Blend */}
        <div 
          className="absolute w-[125vw] h-[125vw] -bottom-[35vw] -left-[20vw] rounded-full filter blur-[13vw] md:blur-[160px] opacity-65 mix-blend-screen animate-glow-two"
          style={{
            background: "radial-gradient(circle, rgba(102,77,73,0.38) 0%, rgba(181,148,91,0.18) 60%, rgba(0,0,0,0) 100%)"
          }}
        />

        {/* Ambient Embers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] opacity-45" />

        {/* Big Background WJRN Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
          <h1 className="text-[25vw] font-black tracking-[0.16em] text-white/[0.015] select-none leading-none uppercase">
            WJRN
          </h1>
        </div>
      </div>

      {/* 2. Top Header - Strict 3 Elements Layout */}
      <header className="relative z-10 w-full flex items-center justify-between border-b border-white/10 pb-6 mb-8 max-w-7xl mx-auto">
        {/* (1) Broadcasting Info (Far Upper Left) */}
        <div className="flex flex-col text-left">
          <span className="text-[9px] uppercase tracking-[0.25em] text-[#b5945b] font-mono mb-1">Broadcasting</span>
          <span className="text-xs md:text-sm font-bold uppercase tracking-wide text-white/95 font-mono flex items-center gap-1.5">
            <Antenna className="w-3.5 h-3.5 text-[#b5945b] animate-pulse shrink-0" />
            LIVE FROM CALIFORNIA
          </span>
        </div>

        {/* (3) SVG Logo (Center Alignment) */}
        <div className="flex justify-center flex-1 max-w-[160px] md:max-w-[240px] px-4">
          <img 
            src={wjrnLogoBrown} 
            alt="WJRN Logo" 
            className="h-10 md:h-12 object-contain" 
          />
        </div>

        {/* (2) Studio Clock Sync Info (Far Upper Right) */}
        <div className="flex flex-col text-right">
          <span className="text-[9px] uppercase tracking-[0.25em] text-[#b5945b] font-mono mb-1">STUDIO CLOCK SYNC</span>
          <span className="text-xs md:text-sm font-bold text-white/95 font-mono flex items-center justify-end gap-2">
            <span>{pacificDate}</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#b5945b] animate-pulse shrink-0"></span>
            <span>{pacificTimeOnly}</span>
          </span>
        </div>
      </header>

      {/* 3. Hero Section & Typography Layout */}
      <section className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start mt-2">
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex items-center mb-3">
            <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#b5945b]">WJRN - JACEWON RADIO NETWORK</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[0.95] tracking-tighter text-white uppercase select-none font-display">
            THE STATION THAT<br />DOESN'T ASK FOR PERMISSION
          </h2>
        </div>
        <div className="lg:col-span-4 lg:pt-6">
          <p className="text-xs md:text-sm lg:text-base text-neutral-400 leading-relaxed font-light font-mono">
            Built outside the algorithm. Shows curated by hand, played live in front of a studio audience, and kept in rotation around the clock.
          </p>
        </div>
      </section>

      {/* 4. Centerpiece Immersive Layout (Smartphone & Side Panels) */}
      <section className="relative z-10 w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 md:my-11 items-center">
        
        {/* LEFT PANEL */}
        <div className="lg:col-span-3 hidden lg:flex flex-col gap-10">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
            <span className="block text-[9px] uppercase tracking-widest text-white/40 font-mono mb-1.5">BROADCAST INFO</span>
            <span className="text-xs text-white/80 font-mono block mb-1">Locale: California, USA</span>
            <span className="text-xs text-white/60 font-mono block">Host: Jacewon</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#b5945b]" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-300">ALWAYS ON ALWAYS FRESH</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#664d49]" />
              <a href="tel:+12135793748" className="text-[10px] font-mono uppercase tracking-wider text-neutral-300 hover:text-[#b5945b] transition-colors">
                HOTLINE OPEN: (213) 579-3748
              </a>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: INTERACTIVE GLASSY PHONE CONTROLLER */}
        <div className="lg:col-span-6 flex justify-center items-center relative py-4">
          <div className="relative w-full max-w-[320px] aspect-[9/18.5] bg-neutral-950/90 rounded-[44px] p-3.5 border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.85),0_0_50px_rgba(181,148,91,0.08)] overflow-hidden group/phone">
            
            {/* Phone Top Speaker Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-950 rounded-b-2xl z-40 border-b border-r border-l border-white/5 flex items-center justify-center">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Simulated Reflection Glare */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.02] to-white/0 pointer-events-none z-30" />

            {/* Inner App Content Screen */}
            <div className="relative w-full h-full bg-[#080605] rounded-[34px] overflow-hidden flex flex-col p-4.5 pt-8 select-none">
              
              {/* Inside Screen Ambient Visualizer Waves Background */}
              {audioState === "playing" && (
                <div className="absolute inset-0 z-0 opacity-30 pointer-events-none overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(181,148,91,0.22),_transparent_70%)] animate-pulse" style={{ animationDuration: "3s" }} />
                  <div className="absolute bottom-0 left-0 right-0 h-72 flex items-end justify-between opacity-35 px-4 gap-[2px]">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const hValues = [12, 28, 48, 20, 36, 16, 42, 30, 24, 38, 54, 32, 44, 28, 50, 18, 35, 45, 12, 22, 40, 28, 14, 32];
                      const delay = (i * 0.08).toFixed(2);
                      const dur = (0.7 + Math.random() * 0.8).toFixed(2);
                      return (
                        <div 
                          key={i} 
                          className="flex-1 bg-gradient-to-t from-[#b5945b] to-transparent rounded-t-sm"
                          style={{ 
                            height: `${hValues[i % hValues.length]}%`,
                            transformOrigin: "bottom",
                            animationName: "verticalPulse",
                            animationDuration: `${dur}s`,
                            animationTimingFunction: "ease-in-out",
                            animationIterationCount: "infinite",
                            animationDirection: "alternate",
                            animationDelay: `${delay}s`
                          }} 
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Inside Screen Header */}
              <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-white/40 uppercase tracking-widest border-b border-white/5 pb-2.5 shrink-0">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-[#b5945b] animate-pulse" />
                  WJRN ONLINE
                </span>
                <span>Stereo 320k</span>
              </div>

              {/* Centered Media Player Components Grouping */}
              <div className="relative z-10 flex-1 flex flex-col justify-center py-2.5 min-h-0">
                
                {/* Album Art & Vinyl Dynamic Combo */}
                <div className="flex flex-col items-center mb-6 shrink-0">
                  <div className="relative w-60 h-60 flex items-center justify-center">
                    
                    {/* Album Cover Art Card - Perfect 1:1 Square */}
                    <div 
                      className={`w-56 h-56 rounded-[16px] overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.95)] relative border border-white/15 transition-all duration-500 ease-out flex items-center justify-center z-10 ${
                        audioState === "playing" ? "scale-[1.02]" : "scale-95"
                      }`}
                    >
                      <img 
                        src={activeMeta.artUrl} 
                        alt="Current station art"
                        className="w-full h-full object-cover transition-all duration-700 ease-in-out"
                        referrerPolicy="no-referrer"
                      />

                      {/* Glass glare effect layer */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.08] to-white/0 pointer-events-none" />
                    </div>
                  </div>

                  {/* Animated Small Soundwave indicators under the Art */}
                  <div className="h-4 flex items-end justify-center gap-[3px] mt-4 shrink-0">
                    {audioState === "playing" ? (
                      Array.from({ length: 9 }).map((_, idx) => {
                        const delays = [0.1, 0.4, 0.2, 0.6, 0.3, 0.5, 0.2, 0.4, 0.1];
                        const heights = ["h-3", "h-2", "h-4", "h-2.5", "h-3.5", "h-2", "h-4", "h-3", "h-1.5"];
                        return (
                          <span 
                            key={idx} 
                            className={`w-[2px] bg-[#b5945b] rounded-full ${heights[idx]} origin-bottom animate-[bounce_1.2s_ease-in-out_infinite]`}
                            style={{ animationDelay: `${delays[idx]}s` }}
                          />
                        );
                      })
                    ) : (
                      <span className="text-[9px] uppercase font-mono tracking-widest text-[#b5945b]/80">STREAM PAUSED</span>
                    )}
                  </div>

                  {/* Meta details inside screen */}
                  <div className="text-center mt-3.5 w-full px-2">
                    <h4 className="text-[13px] font-bold text-white truncate uppercase font-mono tracking-wider">{activeStation.name}</h4>
                    <p className="text-[11px] text-[#b5945b] font-mono mt-0.5 tracking-wider truncate uppercase">{activeMeta.trackTitle}</p>
                    <p className="text-[9.5px] text-white/50 font-mono tracking-wide truncate mt-0.5">by {activeMeta.trackArtist}</p>
                  </div>
                </div>

                {/* INTEGRATED SMARTPHONE MEDIA PLAYER CONTROLS (Under and Inside) */}
                <div className="flex items-center justify-center gap-4 py-2 my-2 border-t border-b border-white/5 shrink-0">
                  <button 
                    onClick={playPrevStation}
                    className="w-10 h-10 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-full flex items-center justify-center text-white transition-all cursor-pointer"
                    title="Previous Channel"
                  >
                    <svg className="w-4 h-4 fill-current text-white/90" viewBox="0 0 24 24">
                      <path d="M6 19h2V5H6v14zm3.5-7L18 19V5l-8.5 7z" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => toggleStation(activeStation.id)}
                    className="w-12 h-12 bg-[#b5945b] hover:bg-[#cbb085] active:scale-95 rounded-full flex items-center justify-center text-black shadow-lg shadow-[#b5945b]/20 transition-all cursor-pointer animate-[pulse_6s_infinite]"
                    title="Play / Pause"
                  >
                    {audioState === "playing" ? (
                      <Pause className="w-5 h-5 text-black fill-current" />
                    ) : (
                      <Play className="w-5 h-5 text-black fill-current translate-x-0.5" />
                    )}
                  </button>
                  
                  <button 
                    onClick={playNextStation}
                    className="w-10 h-10 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-full flex items-center justify-center text-white transition-all cursor-pointer"
                    title="Next Channel"
                  >
                    <svg className="w-4 h-4 fill-current text-white/90" viewBox="0 0 24 24">
                      <path d="M6 5v14l8.5-7L6 5zm10 0v14h2V5h-2z" />
                    </svg>
                  </button>
                </div>

                {/* Simulated Glass Volume REGULATOR Container */}
                <div className="bg-white/[0.02] border border-white/5 rounded-full px-4 py-2.5 mt-2 shrink-0">
                  {/* Micro volume controller */}
                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={() => setIsMuted(!isMuted)} 
                      className="p-0.5 text-white/60 hover:text-white transition-colors cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#b5945b]" /> : <Volume2 className="w-3.5 h-3.5 text-[#b5945b]" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        if (isMuted) setIsMuted(false);
                      }}
                      className="flex-1 h-[2px] bg-white/10 rounded-full appearance-none cursor-pointer accent-[#b5945b]"
                    />
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-3 flex flex-col md:flex-row lg:flex-col justify-between h-full gap-8">
          
          <div className="text-right flex flex-col items-end gap-1.5 p-4 rounded-xl bg-white/[0.01] border border-white/5">
            <span className="block text-[9px] uppercase tracking-widest text-[#b5945b] font-mono">ESTABLISHED</span>
            <span className="text-sm font-bold uppercase font-mono text-white">MAY 2020</span>
            <span className="text-xs text-neutral-500 font-mono uppercase tracking-wider">PACIFIC NORTH FRESH</span>
          </div>

          {/* Premium deliverables list details matching mockup */}
          <div className="text-left lg:text-right flex flex-col gap-5">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">NOT-SO FRIENDLY REMINDERS</span>
            <ul className="text-xs text-neutral-400 space-y-1.5 font-mono">
              <li>• We will never play EDM</li>
              <li>• New country is bad country</li>
              <li>• DJs do not take requests</li>
              <li>• Pop comes in a bottle, not music</li>
            </ul>
          </div>

          <div className="hidden lg:block h-10" />

        </div>

      </section>

      {/* 5. Glassy Selectable Stream Channels Slider/Deck modules */}
      <section className="relative z-10 w-full max-w-7xl mx-auto my-6">
        <div className="flex flex-col gap-5">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">SELECT THE STATION TO PLAY NOW:</span>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STATIONS.map((station) => {
              const isActive = activeStationId === station.id;
              const meta = metadata[station.id];
              let stationColorClass = "border-[#b5945b]/10 hover:border-[#b5945b]/30";
              let textColorClass = "text-[#b5945b]";
              let pulseColorBg = "bg-[#b5945b]";
              let shadowActiveClass = "shadow-[0_20px_50px_-10px_rgba(181,148,91,0.12)]";
              let glowColorBg = "rgba(181,148,91,0.12)";
              
              if (station.id === "rock_garden") {
                stationColorClass = "border-emerald-500/10 hover:border-emerald-500/30";
                textColorClass = "text-emerald-400";
                pulseColorBg = "bg-emerald-500";
                shadowActiveClass = "shadow-[0_20px_50px_-10px_rgba(16,185,129,0.12)]";
                glowColorBg = "rgba(16,185,129,0.25)";
              }
              if (station.id === "bridge_city") {
                stationColorClass = "border-pink-500/10 hover:border-pink-500/30";
                textColorClass = "text-pink-400";
                pulseColorBg = "bg-pink-500";
                shadowActiveClass = "shadow-[0_20px_50px_-10px_rgba(236,72,153,0.12)]";
                glowColorBg = "rgba(236,72,153,0.12)";
              }
              if (station.id === "golden_boombox") {
                stationColorClass = "border-yellow-500/10 hover:border-yellow-500/30";
                textColorClass = "text-yellow-400";
                pulseColorBg = "bg-yellow-400";
                shadowActiveClass = "shadow-[0_20px_50px_-10px_rgba(234,179,8,0.12)]";
                glowColorBg = "rgba(234,179,8,0.12)";
              }

              const isOnline = !!station.streamUrl;
              const vinylArt = VINYL_ARTWORKS[station.id] || station.logoUrl;
              const dialLogo = DIAL_LOGOS[station.id];

              return (
                <div
                  key={station.id}
                  onClick={() => toggleStation(station.id)}
                  className={`pt-7 pb-7 px-7 rounded-3xl border bg-gradient-to-b from-[#0a0706] to-[#040303] backdrop-blur-xl transition-all duration-500 cursor-pointer flex flex-col justify-between min-h-[440px] relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1.5 ${
                    isActive 
                      ? `border-white/40 bg-white/[0.045] ${shadowActiveClass}` 
                      : stationColorClass
                  }`}
                >
                  {/* Premium analog dotted board background matrix on hover */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.012)_1.5px,transparent_1.5px)] bg-[size:24px_24px] pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  {/* Subtle top edge custom color accent strip */}
                  <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-500 ${textColorClass}`} />
 
                  {/* STATION CORE TITLE, ROTATING VINYL & BRANDING */}
                  <div className="mt-6 mb-6 flex flex-col gap-6 relative z-10 flex-1 justify-center items-center text-center">
                    {/* Beautiful Vinyl Spinning Disc Cover Artwork with Reflection Glare */}
                    <div className="relative">
                      {isActive && (
                        <div 
                          className="absolute -inset-10 rounded-full blur-3xl animate-pulse" 
                          style={{ backgroundColor: glowColorBg }}
                        />
                      )}
                      {/* Pulsating interactive visualizer rings responding to active playback */}
                      {isActive && audioState === "playing" && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className={`absolute w-56 h-56 rounded-full border border-current opacity-30 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] ${textColorClass}`} style={{ animationDelay: "0s" }} />
                          <div className={`absolute w-56 h-56 rounded-full border border-current opacity-20 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] ${textColorClass}`} style={{ animationDelay: "0.8s" }} />
                          <div className={`absolute w-56 h-56 rounded-full border border-current opacity-10 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] ${textColorClass}`} style={{ animationDelay: "1.6s" }} />
                        </div>
                      )}
                      {/* For rock garden always show a subtle faint green glow behind it */}
                      {station.id === "rock_garden" && (
                        <div className="absolute -inset-10 rounded-full bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 pointer-events-none transition-all duration-500" />
                      )}
                      <div className={`w-56 h-56 rounded-full overflow-hidden border ${isActive ? "border-white/35 scale-102" : "border-white/10"} shrink-0 shadow-[0_15px_35px_rgba(0,0,0,0.8)] p-0.5 flex items-center justify-center bg-black group-hover:scale-105 duration-700 transition-transform relative`}>
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
                        
                        {/* Spindle mechanical point overlay */}
                        <div className="absolute w-3 h-3 rounded-full bg-black border border-white/15 flex items-center justify-center pointer-events-none">
                          <div className="w-1 h-1 rounded-full bg-[#b5945b]" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Core Station Header & Secondary Genres Centered */}
                    <div className="space-y-2 max-w-[270vw]">
                      <h4 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase leading-tight font-display transition-colors group-hover:text-white">
                        {station.name}
                      </h4>
                      <span className={`text-[9.5px] font-mono uppercase tracking-[0.22em] block leading-snug font-bold ${textColorClass}`}>
                        {station.genre.replace(/,/g, " •")}
                      </span>
                    </div>
                  </div>

                  {/* NOW PLAYING CONTAINER FOR SONGS & LIVE CONTROL */}
                  <div className="border-t border-white/5 pt-5 flex flex-col gap-4 relative z-10 mt-auto">
                    
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
                                className={`w-full h-full object-cover transition-transform duration-[8s] ${
                                  isActive && audioState === "playing" ? "animate-[spin_20s_linear_infinite]" : ""
                                }`}
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
                        <span className={`inline-block w-1 w-1 rounded-full ${isActive ? pulseColorBg + " animate-pulse" : "bg-neutral-600"}`} />
                        <span className="text-white/70 font-bold">{meta.listeners.toLocaleString()}</span> LISTENERS
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Live Twitch Center Embed inside the Secondary layout */}
      <section className="relative z-10 w-full max-w-7xl mx-auto border-t border-white/10 pt-8 mt-4">
        <TwitchSchedule 
          twitchChannel={currentConfig.twitchChannel} 
          scheduledDaysText={currentConfig.twitchLiveSchedule} 
        />
      </section>

      {/* 7. Beautiful Minimal Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto border-t border-white/5 pt-5 mt-8 flex flex-col md:flex-row items-center justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-widest gap-4">
        <div>BROADCASTING FROM CALIFORNIA, USA</div>
        <div>JWBC NETWORK SOURCE • VERSION 3.5</div>
      </footer>

    </div>
  );
}
