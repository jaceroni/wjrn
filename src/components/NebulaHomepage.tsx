import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Radio,
  Antenna,
  ArrowRight,
} from "lucide-react";
import { Station, NowPlaying, RadioConfig } from "../types";
import { navigate } from "../navigate";
import { usePlayer } from "../context/PlayerContext";
import TwitchSchedule from "./TwitchScheduleRetro";
import wjrnLogoLight from "../assets/images/wjrn-logo-light.svg";
import defaultArt from "../assets/images/jacewon-thumbnail.jpg";

import dialLogoTrg from "../assets/images/dial-logos-trg.png";
import dialLogoBchs from "../assets/images/dial-logos-bchs.png";
import dialLogoGbs from "../assets/images/dial-logos-gbs.png";

// Vintage turntable station card assets
import stationCardCabinet from "../assets/images/station-card-cabinet.png";
import stationCardTonearm from "../assets/images/station-card-tonearm.png";
import stationCardPlatterTrg from "../assets/images/station-card-platter-trg.png";
import stationCardPlatterBchs from "../assets/images/station-card-platter-bchs.png";
import stationCardPlatterGbs from "../assets/images/station-card-platter-gbs.png";

const PLATTER_ARTWORKS: { [key: string]: string } = {
  rock_garden: stationCardPlatterTrg,
  bridge_city: stationCardPlatterBchs,
  golden_boombox: stationCardPlatterGbs,
};

// Anchor points measured against the native station-card-cabinet.png canvas (388x588).
// Keeping these as percentages lets the whole turntable graphic scale responsively with the card.
const PLATTER_POSITION = { left: "7.8%", top: "4.5%", width: "68.557%" };
const TONEARM_POSITION = { left: "68.814%", top: "2.721%", width: "20.619%" };
// Pivot dot measured inside station-card-tonearm.png (80x277) — must match the white dot
// baked into station-card-cabinet.png so the swivel rotates around the correct hinge.
const TONEARM_TRANSFORM_ORIGIN = "66.25% 22.2%";
const TONEARM_REST_DEG = 0;
// Swing distance reduced 40% (was 45deg) so the headshell lands on the vinyl grooves
// instead of overshooting onto the center label.
const TONEARM_PLAYING_DEG = 27;
// The cabinet graphic's blank lower drawer is actually drawn as two sub-panels, split by a
// subtle seam (~y=381 of 588). Title/genre floats centered in the smaller top panel (between
// the gold divider at ~y=307 and that seam); the now playing block centers in the larger
// bottom panel (between the seam and the bottom frame at ~y=567).
const TITLE_ZONE = { top: "52.2%", bottom: "35.2%", left: "9%", right: "9%" };
const PLAYER_ZONE = { top: "64.8%", bottom: "6%", left: "9%", right: "9%" };

const DIAL_LOGOS: { [key: string]: string } = {
  rock_garden: dialLogoTrg,
  bridge_city: dialLogoBchs,
  golden_boombox: dialLogoGbs,
};

// Nav dropdown hover colors — matches each station's brand accent used on the cards below
const NAV_HOVER_COLOR: { [key: string]: string } = {
  rock_garden: "hover:text-emerald-400",
  bridge_city: "hover:text-pink-400",
  golden_boombox: "hover:text-yellow-400",
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

  const {
    togglePlayback,
    setIsMuted,
    setEqBassCut,
    setEqMidCut,
    setEqTrebleCut,
    setEqLoudness,
    setEqMono,
    setEqBalance,
    analyserRef,
    isMiniPlayerVisible,
  } = usePlayer();

  // Cross-frame sync with the embedded vintage player (public/player/index.html).
  // The iframe keeps its own audio graph alive (VU meter, ticker, art all stay
  // real) but its output is never connected to speakers when synced — the
  // MiniPlayer/station cards are the one audible source, so turning the tuner
  // in the vintage player or clicking a station card both drive the same state
  // without the two ever playing the same stream out loud at once.
  const playerIframeRef = useRef<HTMLIFrameElement>(null);

  // Station-card platter "backspin" on hover — once started it plays to completion
  // even if the cursor leaves early, since it's driven by this state (cleared only
  // when the animation itself ends), not by CSS :hover directly.
  const [backspinningStation, setBackspinningStation] = useState<string | null>(null);

  useEffect(() => {
    const sendCurrentState = () => {
      const win = playerIframeRef.current?.contentWindow;
      if (!win) return;
      if (!activeStationId) {
        // Nothing active in the real (audible) player — e.g. the MiniPlayer bar
        // was dismissed. Tell the iframe to pause its own local (muted) audio
        // graph too, so its ticker/art don't keep looking "live" with nothing
        // actually playing anywhere.
        win.postMessage({ source: "wjrn-app", type: "pause" }, "*");
        return;
      }
      win.postMessage({ source: "wjrn-app", type: "setStation", station: activeStationId }, "*");
      // Only mirror a pause when genuinely paused-while-loaded ("idle" with a
      // station still set). Don't do this for "connecting" — that's just the
      // real player buffering, and pausing the iframe's own just-started local
      // playback here races with it and leaves its UI stuck showing paused.
      if (audioState === "idle") {
        win.postMessage({ source: "wjrn-app", type: "pause" }, "*");
      }
    };

    sendCurrentState();

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.source !== "wjrn-player") return;

      if (data.type === "ready") {
        sendCurrentState();
        return;
      }
      if (data.type === "stationChanged") {
        if (data.station && data.station !== activeStationId) {
          toggleStation(data.station);
        }
        return;
      }
      if (data.type === "playStateChanged") {
        if (!data.station) return;
        // "Same station active" means the real (audible) player already has
        // this station loaded — otherwise there's nothing to resume/pause,
        // and a "playing" request needs a full (re)start instead.
        const isSameStationActive =
          data.station === activeStationId && audioState !== "idle" && audioState !== "error";
        if (data.playing) {
          if (isSameStationActive) {
            if (audioState !== "playing") togglePlayback();
          } else {
            toggleStation(data.station);
          }
        } else if (isSameStationActive && audioState === "playing") {
          togglePlayback();
        }
        return;
      }
      if (data.type === "eqControl") {
        switch (data.control) {
          case "mute": setIsMuted(!!data.value); break;
          case "bass": setEqBassCut(!!data.value); break;
          case "mid": setEqMidCut(!!data.value); break;
          case "treble": setEqTrebleCut(!!data.value); break;
          case "loudness": setEqLoudness(!!data.value); break;
          case "mono": setEqMono(!!data.value); break;
          case "balance": setEqBalance(data.value as 0 | 1 | 2); break;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    activeStationId,
    audioState,
    toggleStation,
    togglePlayback,
    setIsMuted,
    setEqBassCut,
    setEqMidCut,
    setEqTrebleCut,
    setEqLoudness,
    setEqMono,
    setEqBalance,
  ]);

  // Feed the embedded player's VU meter from the one real (audible) analyser
  // instead of relying on the embedded copy's own local playback — sidesteps
  // any cross-frame autoplay uncertainty entirely, since this audio is
  // guaranteed to already be playing (it's what you actually hear).
  useEffect(() => {
    if (audioState !== "playing") return;
    let rafId: number;
    let freqData: Uint8Array | null = null;

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const analyser = analyserRef.current;
      const win = playerIframeRef.current?.contentWindow;
      if (!analyser || !win) return;
      if (!freqData || freqData.length !== analyser.frequencyBinCount) {
        freqData = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteFrequencyData(freqData);
      let sum = 0;
      for (let i = 2; i <= 12; i++) sum += freqData[i] ?? 0;
      const avg = sum / 11 / 255;
      win.postMessage({ source: "wjrn-app", type: "vuLevel", level: avg }, "*");
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      const win = playerIframeRef.current?.contentWindow;
      if (win) win.postMessage({ source: "wjrn-app", type: "vuLevel", level: null }, "*");
    };
  }, [audioState, analyserRef]);

  return (
    <div id="nebula_homepage_layout" className="relative min-h-screen w-full text-white flex flex-col gap-[70px] overflow-hidden font-sans pt-4 md:pt-6 lg:pt-8 pb-6 md:pb-10 lg:pb-14 px-6 md:px-10 lg:px-14 select-none" style={{ background: "#120e0b" }}>

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
      <div className="relative z-30">
      <header className="w-full flex items-center justify-between pb-6 max-w-7xl mx-auto gap-4">
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
          <img src={wjrnLogoLight} alt="WJRN" className="h-5 md:h-6 w-auto object-contain" />
          <span className="hidden sm:flex items-center gap-3">
            <span className="w-px h-3.5 bg-white/20" />
            <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.2em] text-[#d7b158]">
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
            className="text-white/80 hover:text-[#d7b158] transition-colors"
          >
            Home
          </a>
          <span className="text-[#d7b158] text-[30px] leading-none">&middot;</span>

          {/* Our Stations — hover dropdown */}
          <div className="relative group py-2">
            <span className="text-white/80 group-hover:text-[#d7b158] transition-colors cursor-default">
              Our Stations
            </span>
            <div className="absolute left-1/2 -translate-x-1/2 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pt-2">
              <div className="flex flex-col rounded-lg border border-white/10 bg-[#0c0908]/95 backdrop-blur-md shadow-2xl overflow-hidden">
                {STATIONS.filter((s) => s.id !== "wjrn").map((station) => (
                  <a
                    key={station.id}
                    href={`/${STATION_SLUGS[station.id]}`}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
                      e.preventDefault();
                      navigate(`/${STATION_SLUGS[station.id]}`);
                    }}
                    className={`px-6 py-2.5 text-[10px] tracking-[0.15em] text-white/70 hover:bg-white/5 transition-colors whitespace-nowrap text-center ${NAV_HOVER_COLOR[station.id] ?? "hover:text-white"}`}
                  >
                    {station.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <span className="text-[#d7b158] text-[30px] leading-none">&middot;</span>
          <a
            href="/about-wjrn"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
              e.preventDefault();
              navigate("/about-wjrn");
            }}
            className="text-white/80 hover:text-[#d7b158] transition-colors"
          >
            About WJRN
          </a>
        </nav>

        {/* Live Indicator (Far Upper Right) */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Antenna className="w-3 h-3 text-red-500 animate-pulse shrink-0" />
          <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.2em] text-white/80">
            Live From California
          </span>
        </div>
      </header>
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-20 max-w-7xl mx-auto" />
      </div>

      {/* 3. Hero — Vintage Receiver Player Embed */}
      <section className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="w-full aspect-[1280/443] overflow-hidden rounded-lg shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
          <iframe
            ref={playerIframeRef}
            src="https://radio.jacewonmusic.com/player/?popout=true&sync=1"
            title="WJRN Vintage Player"
            className="w-full h-full border-0 block"
            allow="autoplay"
          />
        </div>
      </section>

      {/* 5. Glassy Selectable Stream Channels Slider/Deck modules */}
      <section className="relative z-10 w-full max-w-7xl mx-auto -mt-[3.5px] -mb-[3.5px]">
        <div className="flex flex-col gap-5">
          <span className="md:hidden text-[10px] font-mono uppercase tracking-[0.25em] text-white/40 text-center w-full block">SELECT THE STATION TO PLAY NOW:</span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-13">
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
              let textColorClass = "text-[#d7b158]";
              let pulseColorBg = "bg-[#d7b158]";

              if (station.id === "rock_garden") {
                textColorClass = "text-emerald-400";
                pulseColorBg = "bg-emerald-500";
              }
              if (station.id === "bridge_city") {
                textColorClass = "text-pink-400";
                pulseColorBg = "bg-pink-500";
              }
              if (station.id === "golden_boombox") {
                textColorClass = "text-yellow-400";
                pulseColorBg = "bg-yellow-500";
              }

              const learnMoreHoverClass =
                station.id === "rock_garden" ? "hover:bg-emerald-500 hover:border-emerald-500" :
                  station.id === "bridge_city" ? "hover:bg-pink-500 hover:border-pink-500" :
                    station.id === "golden_boombox" ? "hover:bg-yellow-500 hover:border-yellow-500" :
                      "hover:bg-[#d7b158] hover:border-[#d7b158]";

              const isOnline = !!station.streamUrl;
              const platterArt = PLATTER_ARTWORKS[station.id] || station.logoUrl;
              const isSpinning = isActive && audioState === "playing";

              return (
                <div
                  key={station.id}
                  onClick={() => {
                    setBackspinningStation(null);
                    toggleStation(station.id);
                  }}
                  onMouseEnter={() => {
                    if (!isSpinning && backspinningStation !== station.id) {
                      setBackspinningStation(station.id);
                    }
                  }}
                  className="rounded-2xl cursor-pointer relative overflow-hidden group shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
                >
                  {/* VINTAGE TURNTABLE CABINET GRAPHIC — defines the card's shape; everything below overlays on top of it */}
                  <img
                    src={stationCardCabinet}
                    alt=""
                    draggable={false}
                    className="relative z-0 w-full h-auto block select-none pointer-events-none"
                  />

                  <img
                    src={platterArt}
                    alt={`${station.name} vinyl on turntable platter`}
                    draggable={false}
                    referrerPolicy="no-referrer"
                    onAnimationEnd={() => {
                      if (backspinningStation === station.id) setBackspinningStation(null);
                    }}
                    className={`absolute z-[1] rounded-full select-none pointer-events-none ${
                      isSpinning
                        ? "animate-[spin_8s_linear_infinite]"
                        : backspinningStation === station.id
                          ? "animate-[platterBackspin_1200ms_ease-out]"
                          : ""
                    }`}
                    style={{ left: PLATTER_POSITION.left, top: PLATTER_POSITION.top, width: PLATTER_POSITION.width }}
                  />

                  <img
                    src={stationCardTonearm}
                    alt=""
                    draggable={false}
                    className="absolute z-[2] select-none pointer-events-none transition-transform duration-1000 ease-out"
                    style={{
                      left: TONEARM_POSITION.left,
                      top: TONEARM_POSITION.top,
                      width: TONEARM_POSITION.width,
                      transformOrigin: TONEARM_TRANSFORM_ORIGIN,
                      transform: `rotate(${isSpinning ? TONEARM_PLAYING_DEG : TONEARM_REST_DEG}deg)`,
                    }}
                  />

                  {/* TITLE — floats centered (both axes) in the cabinet's upper drawer sub-panel */}
                  <div
                    className="absolute z-[3] flex flex-col items-center justify-center text-center"
                    style={{ top: TITLE_ZONE.top, bottom: TITLE_ZONE.bottom, left: TITLE_ZONE.left, right: TITLE_ZONE.right }}
                  >
                    <h4 className="text-lg sm:text-xl font-bold tracking-normal text-white uppercase leading-tight font-display">
                      {station.name}
                    </h4>
                    <span className={`mt-1.5 text-[9.5px] font-mono uppercase tracking-[0.18em] block leading-snug font-bold ${textColorClass}`}>
                      {station.genre.replace(/,/g, " •")}
                    </span>
                  </div>

                  {/* PLAYER — floats centered in the cabinet's lower drawer sub-panel */}
                  <div
                    className="absolute z-[3] flex flex-col justify-center"
                    style={{ top: PLAYER_ZONE.top, bottom: PLAYER_ZONE.bottom, left: PLAYER_ZONE.left, right: PLAYER_ZONE.right }}
                  >
                    {/* Premium analog dotted board background matrix on hover */}
                    <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.012)_1.5px,transparent_1.5px)] bg-[size:24px_24px] pointer-events-none transition-opacity duration-700 ${isActive ? "opacity-100" : "opacity-40 group-hover:opacity-100"
                      }`} />

                    {/* NOW PLAYING CONTAINER FOR SONGS & LIVE CONTROL */}
                    <div className="relative z-10 shrink-0">

                    <div className="relative overflow-hidden rounded-2xl bg-[#090605]/85 border border-white/5 p-2.5 flex flex-col gap-2 transition-colors duration-300 group-hover:bg-[#0b0807]/90 group-hover:border-white/10 shadow-inner">

                      {/* Compact Now Playing visual header inside the box */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-1 w-full">
                        <span className={`text-[8px] font-mono uppercase tracking-[0.2em] font-extrabold ${textColorClass}`}>
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
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/15 shrink-0 shadow-lg bg-black">
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
                            <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-white/10 shrink-0 flex items-center justify-center">
                              <Radio className="w-5 h-5 text-neutral-600" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <span className="text-[11px] font-mono text-white/95 truncate block uppercase tracking-wide leading-tight font-black">
                              {meta.trackTitle}
                            </span>
                            <span className="text-[8px] font-mono text-white/40 truncate block uppercase tracking-widest mt-0.5">
                              {meta.trackArtist}
                            </span>
                          </div>
                        </div>

                        {/* HIGH FIDELITY CLICK TRIGGER PLAY BUTTON FOR STREAM SELECTION */}
                        <div className="shrink-0 relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${isActive
                              ? `${textColorClass} bg-white/10 border border-white/20 scale-105`
                              : "text-neutral-400 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20"
                            }`}>
                            {isActive && audioState === "playing" ? (
                              <Pause className="w-3.5 h-3.5 ml-0" />
                            ) : (
                              <Play className="w-3.5 h-3.5 translate-x-0.5" />
                            )}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* METRICS & LISTENER TELEMETRY WITH RELOCATED BADGES */}
                    <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-semibold">
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
                      className={`mt-2 w-full py-2.5 px-4 rounded-xl border text-[10px] font-mono font-semibold uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 bg-white/[0.03] hover:text-black ${textColorClass} border-current ${learnMoreHoverClass}`}
                    >
                      Learn More <span className="hidden sm:inline">About This Station</span> <ArrowRight className="w-3 h-3" />
                    </a>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Live Twitch Center Embed inside the Secondary layout */}
      <section className="relative z-10 w-full max-w-7xl mx-auto">
        <TwitchSchedule
          twitchChannel={currentConfig.twitchChannel}
          scheduledDaysText={currentConfig.twitchLiveSchedule}
        />
      </section>

      {/* 7. Beautiful Minimal Footer */}
      <div>
        <footer className="relative z-10 w-full max-w-7xl mx-auto border-t border-white/5 pt-5 flex flex-col md:flex-row items-center justify-between text-[10px] font-mono text-white/60 uppercase tracking-widest gap-4">
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

        {/* Reserves space below the footer so the fixed mini-player bar never covers it —
            collapses back to 0 the instant the bar is dismissed/hidden. */}
        <div
          aria-hidden="true"
          className="transition-[height] duration-300 ease-in-out"
          style={{ height: isMiniPlayerVisible ? "83px" : "0px" }}
        />
      </div>

    </div>
  );
}
