import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Radio,
  Antenna,
  ArrowRight,
  Menu,
} from "lucide-react";
import { Station, NowPlaying, RadioConfig } from "../types";
import { navigate } from "../navigate";
import { usePlayer } from "../context/PlayerContext";
import TwitchSchedule from "./TwitchScheduleRetro";
import StationCardVisualizer from "./StationCardVisualizer";
import HeroQuote from "./HeroQuote";
import wjrnLogoLight from "../assets/images/wjrn-logo-light.svg";
import wjrnTileBg from "../assets/images/wjrn-tile-bg-1a.png";
import defaultArt from "../assets/images/jacewon-thumbnail.jpg";
import homeCrate from "../assets/images/wjrn-home-crate-1a.png";

import dialLogoTrg from "../assets/images/dial-logos-trg.png";
import dialLogoBchs from "../assets/images/dial-logos-bchs.png";
import dialLogoGbs from "../assets/images/dial-logos-gbs.png";

// Vintage turntable station card assets
import stationCardCabinet from "../assets/images/station-card-cabinet.png";
import stationCardTonearm from "../assets/images/station-card-tonearm.png";
import stationCardPlatterTrg from "../assets/images/station-card-platter-trg.png";
import stationCardPlatterBchs from "../assets/images/station-card-platter-bchs.png";
import stationCardPlatterGbs from "../assets/images/station-card-platter-gbs.png";
import homePlayerButtonTrg from "../assets/images/wjrn-home-player-button-trg.png";
import homePlayerButtonBchs from "../assets/images/wjrn-home-player-button-bchs.png";
import homePlayerButtonGbs from "../assets/images/wjrn-home-player-button-gbs.png";

const PLATTER_ARTWORKS: { [key: string]: string } = {
  rock_garden: stationCardPlatterTrg,
  bridge_city: stationCardPlatterBchs,
  golden_boombox: stationCardPlatterGbs,
};

const LEARN_MORE_BUTTON_ARTWORKS: { [key: string]: string } = {
  rock_garden: homePlayerButtonTrg,
  bridge_city: homePlayerButtonBchs,
  golden_boombox: homePlayerButtonGbs,
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
// bottom measured against the cabinet's true inner frame edge (~row 573 of 588, where the
// wood-grain trim begins) — the previous "6%" stopped ~15px short of that edge, so the
// justify-center block below had less slack to distribute than the panel actually offers,
// leaving the content hugging the seam above with a lopsided gap below the button.
const PLAYER_ZONE = { top: "64.8%", bottom: "3%", left: "9%", right: "9%" };

// Manifesto crate ambient tilt — same values as HeroQuote.tsx's busts, for a
// consistent feel across every look-at-cursor element on the page.
const CRATE_MAX_TILT_DEG = 14;
const CRATE_TILT_DEPTH = 4000;

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
    totalListeners,
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
  // when the animation itself ends), not by CSS :hover directly. Keyed per-station
  // so backspinning one card can't cancel another card's still-running animation.
  const [backspinningStations, setBackspinningStations] = useState<Record<string, boolean>>({});

  // Manifesto crate — ambient look-at-cursor tilt + click-drag override, same
  // interaction/constants as the HeroQuote and About page busts (see those
  // files). Only one image here (no alt pose), so the ref/handlers sit
  // directly on the <img> itself rather than needing a separate hit-box
  // wrapper div to unify two overlapping images.
  const crateRef = useRef<HTMLImageElement | null>(null);
  const [crateAmbientTilt, setCrateAmbientTilt] = useState(0);
  const [isCrateDragging, setIsCrateDragging] = useState(false);
  const [crateDraggedTiltDeg, setCrateDraggedTiltDeg] = useState(0);
  const crateDragStartClientXRef = useRef(0);
  const crateDragStartTiltDegRef = useRef(0);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const el = crateRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const deg = (Math.atan2(dx, CRATE_TILT_DEPTH) * 180) / Math.PI;
      setCrateAmbientTilt(Math.max(-CRATE_MAX_TILT_DEG, Math.min(CRATE_MAX_TILT_DEG, deg)));
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  useEffect(() => {
    if (!isCrateDragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - crateDragStartClientXRef.current;
      const deg = crateDragStartTiltDegRef.current + (dx / 150) * CRATE_MAX_TILT_DEG;
      setCrateDraggedTiltDeg(Math.max(-CRATE_MAX_TILT_DEG, Math.min(CRATE_MAX_TILT_DEG, deg)));
    };
    const handleUp = () => setIsCrateDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isCrateDragging]);

  const handleCrateMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    crateDragStartClientXRef.current = e.clientX;
    crateDragStartTiltDegRef.current = crateAmbientTilt;
    setCrateDraggedTiltDeg(crateAmbientTilt);
    setIsCrateDragging(true);
  };

  const crateTiltDeg = isCrateDragging ? crateDraggedTiltDeg : crateAmbientTilt;
  const crateTransform = `perspective(1000px) rotateY(${crateTiltDeg}deg)`;

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
        return;
      }
      // Re-dispatched as real window mousemove/mouseup events (not consumed
      // directly) so every ambient look-at-cursor tilt effect on the page —
      // HeroQuote's bust, the manifesto crate — keeps tracking the cursor
      // via the same `window.addEventListener("mousemove"/"mouseup", ...)`
      // listeners they already have, with zero changes needed in those
      // components. Without this, the browser never delivers mousemove to
      // this document while the cursor is over the vintage player iframe
      // (a cross-frame boundary, even same-origin), so those effects would
      // otherwise visibly freeze the moment the cursor crosses onto it.
      if (data.type === "mouseMove" || data.type === "mouseUp") {
        if (typeof data.clientX === "number" && typeof data.clientY === "number") {
          window.dispatchEvent(
            new MouseEvent(data.type === "mouseMove" ? "mousemove" : "mouseup", {
              clientX: data.clientX,
              clientY: data.clientY,
              bubbles: true,
            })
          );
        }
        return;
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
    <div id="nebula_homepage_layout" className="relative min-h-screen w-full text-[#f3ede2] flex flex-col gap-[70px] overflow-hidden font-sans pt-[19px] md:pt-6 lg:pt-8 pb-6 md:pb-10 lg:pb-14 px-6 md:px-10 lg:px-14 select-none" style={{ backgroundColor: "#120e0b" }}>

      {/* 1. Nebula Cosmic Fire Background in soft brown and mustard #664d49 spectrum */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">

        {/* Tiled damask background — an SVG <pattern> instead of a raw CSS background-repeat,
            since the latter showed a faint seam between tiles from browser texture-sampling
            at tile boundaries even though the source PNG is pixel-perfectly seamless. */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <pattern id="wjrnTilePattern" x="0" y="0" width="618" height="618" patternUnits="userSpaceOnUse" overflow="visible" style={{ overflow: "visible" }}>
            <image href={wjrnTileBg} x="-1" y="-1" width="620" height="620" style={{ imageRendering: "pixelated" }} />
          </pattern>
          <rect width="100%" height="100%" fill="url(#wjrnTilePattern)" />
        </svg>

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
      <header className="w-full flex items-center justify-between pb-[22px] max-w-7xl mx-auto gap-4">
        {/* Antenna — mobile-only live indicator, no text/listener count, just the
            blinking icon so there's still a "we're on the air" signal even though
            the full Broadcasting/Listeners block is desktop-only. */}
        <div className="md:hidden flex items-center shrink-0">
          <Antenna className="w-5 h-5 text-red-500 animate-pulse" />
        </div>

        {/* Logo lockup — always navigates home; the mobile menu now has its own
            dedicated hamburger trigger (see below) instead of living on the logo. */}
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
              Online Radio Network
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
            className="text-[#f3ede2]/80 hover:text-[#d7b158] transition-colors"
          >
            Home
          </a>
          <span className="text-[#d7b158] text-[30px] leading-none">&middot;</span>

          {/* Our Stations — hover dropdown */}
          <div className="relative group py-2">
            <span className="text-[#f3ede2]/80 group-hover:text-[#d7b158] transition-colors cursor-pointer">
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
                    className={`px-6 py-2.5 text-[10px] tracking-[0.15em] text-[#f3ede2]/70 hover:bg-white/5 transition-colors whitespace-nowrap text-center ${NAV_HOVER_COLOR[station.id] ?? "hover:text-[#f3ede2]"}`}
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
            className="text-[#f3ede2]/80 hover:text-[#d7b158] transition-colors"
          >
            About WJRN
          </a>
        </nav>

        {/* Live Indicator (Far Upper Right) */}
        <div className="hidden md:flex items-center shrink-0">
          <span className="inline-flex items-center gap-1.5 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.2em] text-[#f3ede2]/80">
            Broadcasting
            <Antenna className="w-3 h-3 text-red-500 animate-pulse shrink-0 ml-[3px] mr-[3px]" />
            {`${totalListeners.toLocaleString()} Listeners`}
          </span>
        </div>

        {/* Hamburger — mobile-only menu trigger, same height as the mobile logo */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("wjrn:open-mobile-nav"))}
          aria-label="Open menu"
          className="md:hidden flex items-center shrink-0 text-[#f3ede2]"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-20 max-w-7xl mx-auto" />
      </div>

      {/* Hero Quote — rotating artist spotlight, sits above the vintage player embed */}
      <HeroQuote />

      {/* 3. Hero — Vintage Receiver Player Embed — hidden on mobile, the controls
          are too small to interact with reliably at that size; fine from md/tablet up.
          md:-mt-[10px] trims 10px off the shared gap-[70px] between this and HeroQuote
          above it (60px net) — only meaningful at md+ since this section is hidden below it. */}
      <section className="relative z-10 w-full max-w-7xl mx-auto hidden md:block md:-mt-[10px]">
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

      {/* Brand Manifesto — crate graphic + copy, sits between the vintage player and the
          station cards. Image sits below the text column on mobile (order-2), to the left
          of it on desktop (order-1) — plain grid-order swap, no separate mobile JSX tree
          needed since the layout itself is simple enough not to warrant one. */}
      <section className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
          <div className="order-2 md:order-1 md:col-span-5 flex justify-center md:justify-start">
            <img
              ref={crateRef}
              src={homeCrate}
              alt="A wooden crate of vinyl records — click and drag to tilt"
              draggable={false}
              onMouseDown={handleCrateMouseDown}
              role="button"
              tabIndex={0}
              style={{ transition: "transform 150ms ease-out", transform: crateTransform }}
              className={`w-auto h-auto max-w-full max-h-[380px] sm:max-h-[420px] select-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] ${
                isCrateDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
            />
          </div>
          <div className="order-1 md:order-2 md:col-span-7 flex flex-col gap-5 text-center md:text-left items-center md:items-start">
            <h2 className="uppercase text-[32px] sm:text-4xl md:text-5xl lg:text-[56px] font-extrabold leading-[1.05] font-display">
              <span className="text-[#f3ede2] block">Built for the Music.</span>
              <span className="text-[#d7b158] block">Not the Market.</span>
            </h2>
            <div className="flex flex-col gap-4 max-w-2xl">
              <p className="text-[#f3ede2]/80 text-sm md:text-base font-mono leading-relaxed">
                There was a time in radio when the program director's taste was the filter. And if you tuned in any night of the week, you felt it. That era didn't end because the music was wack. It ended because labels got greedy. WJRN was built to fix that.
              </p>
              <p className="text-[#f3ede2]/80 text-sm md:text-base font-mono leading-relaxed">
                Three shows every week, curated by one program director: Classic Rock, Grownfolk R&B, and Hip-Hop. Each mixed live, full of personality, and rooted in the tradition that connects them all. Commercial free. Label influence free. And broadcasting 24/7.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Glassy Selectable Stream Channels Slider/Deck modules */}
      <section className="relative z-10 w-full max-w-7xl mx-auto -mt-[3.5px] -mb-[3.5px]">
        <div className="flex flex-col gap-5">
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

              const isOnline = !!station.streamUrl;
              const platterArt = PLATTER_ARTWORKS[station.id] || station.logoUrl;
              const isSpinning = isActive && audioState === "playing";
              // Same marquee treatment as the vintage hero player's ticker — only
              // scrolls a track title that's actually long, and only while this
              // specific card's station is the one genuinely playing.
              const shouldMarqueeTitle = isSpinning && meta.trackTitle.length > 22;

              return (
                <div
                  key={station.id}
                  onClick={() => {
                    setBackspinningStations((prev) => ({ ...prev, [station.id]: false }));
                    toggleStation(station.id);
                  }}
                  onMouseEnter={() => {
                    if (!isSpinning && !backspinningStations[station.id]) {
                      setBackspinningStations((prev) => ({ ...prev, [station.id]: true }));
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
                      if (backspinningStations[station.id]) {
                        setBackspinningStations((prev) => ({ ...prev, [station.id]: false }));
                      }
                    }}
                    className={`absolute z-[1] aspect-square rounded-full select-none pointer-events-none ${
                      isSpinning
                        ? "animate-[spin_8s_linear_infinite]"
                        : backspinningStations[station.id]
                          ? "animate-[platterBackspin_1200ms_ease-out]"
                          : ""
                    }`}
                    style={{
                      left: PLATTER_POSITION.left,
                      top: PLATTER_POSITION.top,
                      width: PLATTER_POSITION.width,
                      // Keeps this on a stable GPU layer permanently, rather than the
                      // browser promoting/demoting it right as the rotation starts and
                      // stops — that promotion is what reads as a visible size "pop".
                      // (A static `transform: translateZ(0)` here wouldn't help: the
                      // spin/backspin keyframes replace `transform` outright whenever
                      // they're running, clobbering it at the exact moment it matters.)
                      willChange: "transform",
                      backfaceVisibility: "hidden",
                    }}
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
                    <h4 className="text-lg sm:text-xl font-bold tracking-normal text-[#f3ede2] uppercase leading-tight font-display">
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
                      <div className="flex items-center gap-3 border-b border-white/5 pb-1 w-full">
                        <span className={`text-[8px] font-mono uppercase tracking-[0.2em] font-extrabold shrink-0 ${textColorClass}`}>
                          Now Playing
                        </span>
                        <StationCardVisualizer
                          active={isSpinning}
                          analyserRef={analyserRef}
                          barColorClass={pulseColorBg}
                        />
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
                            <div className={`overflow-hidden ${shouldMarqueeTitle ? "mask-marquee" : ""}`}>
                              <span
                                className={`text-[11px] font-mono text-[#f3ede2]/95 uppercase tracking-wide leading-tight font-black block ${
                                  shouldMarqueeTitle ? "animate-marquee" : "truncate"
                                }`}
                                style={shouldMarqueeTitle ? { animationDuration: "14s" } : undefined}
                              >
                                {shouldMarqueeTitle ? `${meta.trackTitle}     ${meta.trackTitle}` : meta.trackTitle}
                              </span>
                            </div>
                            <span className="text-[8px] font-mono text-[#f3ede2]/40 truncate block uppercase tracking-widest mt-0.5">
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
                            <span className="text-[#f3ede2]/80">ON THE AIR</span>
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
                        <span className="text-[#f3ede2]/70 font-bold">{meta.listeners.toLocaleString()}</span> LISTENERS
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
                      className={`mt-2 w-full pt-[14px] pb-[14px] px-4 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer transition-[text-shadow] duration-300 hover:[text-shadow:0_0_6px_rgba(0,0,0,0.7)] ${textColorClass}`}
                      style={{
                        backgroundImage: `url(${LEARN_MORE_BUTTON_ARTWORKS[station.id] ?? homePlayerButtonTrg})`,
                        backgroundSize: "100% 100%",
                        backgroundRepeat: "no-repeat",
                      }}
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
        <footer className="relative z-10 w-full max-w-7xl mx-auto border-t border-white/5 pt-5 flex flex-col md:flex-row items-center justify-between text-[10px] font-mono text-[#f3ede2]/60 uppercase tracking-widest gap-4">
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
