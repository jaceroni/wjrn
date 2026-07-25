import React, { useState, useEffect, useRef } from "react";
import { Antenna } from "lucide-react";
import { Station } from "../types";
import { navigate } from "../navigate";
import { usePlayer } from "../context/PlayerContext";
import wjrnLogoLight from "../assets/images/wjrn-logo-light.svg";
import wjrnTileBg from "../assets/images/wjrn-tile-bg-1a.png";
import bustJace from "../assets/images/bust-jace-default.png";
import bustCindy from "../assets/images/bust-cindy-default.png";
import bustPhil from "../assets/images/bust-phil-default.png";
import bustJaceAlt from "../assets/images/bust-jace-alt.png";
import bustCindyAlt from "../assets/images/bust-cindy-alt.png";
import bustPhilAlt from "../assets/images/bust-phil-alt.png";

interface AboutWjrnProps {
  STATIONS: Station[];
}

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  bust: string;
  bustAlt: string;
}

// Nav dropdown hover colors — matches each station's brand accent
const NAV_HOVER_COLOR: { [key: string]: string } = {
  rock_garden: "hover:text-emerald-400",
  bridge_city: "hover:text-pink-400",
  golden_boombox: "hover:text-yellow-400",
};

const TEAM: TeamMember[] = [
  {
    name: "Jace Brown",
    role: "Program Director",
    bio: "Jace started DJing in 1993. By the late 90s he was working at one of Los Angeles's biggest FM stations, learning how the machine worked and eventually why it wasn't for him. So he walked away, and when the technology finally caught up to his vision, he built WJRN. No restrictions. Just a steady flow of killer tunes across every genre and era that we've grown to love.",
    bust: bustJace,
    bustAlt: bustJaceAlt,
  },
  {
    name: "Cindy Whopper",
    role: "Music Librarian + Promotions",
    bio: "Cindy's appetite for music rivals the size of her namesake. When Jace was building WJRN from the ground up, he needed someone who could match his hunger, record for record. Cindy showed up with a whopper of a resume and an even bigger list of what she felt deserves airtime. She keeps the library authentic and makes sure the outside world knows we exist.",
    bust: bustCindy,
    bustAlt: bustCindyAlt,
  },
  {
    name: "Phil Callings",
    role: "Chief Technical Officer",
    bio: "Phil didn't just stumble into a tech gig at a radio station. He heard what Jace and Cindy were trying to build and knew immediately how to get it done. An independent, around the clock broadcast network doesn't run on good taste alone. It runs on infrastructure, and Phil is the reason ours stays up, clean and clear without interruption.",
    bust: bustPhil,
    bustAlt: bustPhilAlt,
  },
];

export default function AboutWjrn({ STATIONS }: AboutWjrnProps) {
  const { isMiniPlayerVisible, totalListeners } = usePlayer();

  // Easter egg: click (no drag) a teammate's bust to toggle default <-> alt pose
  const [clickStage, setClickStage] = useState<Record<number, number>>({});
  const cycleBust = (idx: number) =>
    setClickStage((prev) => ({ ...prev, [idx]: ((prev[idx] ?? 0) + 1) % 2 }));

  // Ambient tilt — each bust computes the real angle from its OWN position on
  // the page to the cursor (basic look-at-cursor trig), rather than sharing one
  // page-wide value. That alone gives the "closer reacts faster" behavior for
  // free: atan2's slope is steepest near 0 and flattens out at wide angles, so
  // a bust the cursor is already far from (large angle) changes much less per
  // pixel of cursor movement than one the cursor is right next to. Grabbing a
  // bust overrides it with manual drag control until release; every other bust
  // keeps following the ambient cursor position.
  const MAX_TILT_DEG = 14;
  const TILT_DEPTH = 4000; // larger = gentler falloff, reaches max angle further out
  const bustRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [ambientTilt, setAmbientTilt] = useState<Record<number, number>>({});
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [draggedTiltDeg, setDraggedTiltDeg] = useState(0);
  const dragStartClientXRef = useRef(0);
  const dragStartTiltDegRef = useRef(0);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setAmbientTilt((prev) => {
        const next = { ...prev };
        bustRefs.current.forEach((el, idx) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const dx = e.clientX - (rect.left + rect.width / 2);
          const deg = (Math.atan2(dx, TILT_DEPTH) * 180) / Math.PI;
          next[idx] = Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, deg));
        });
        return next;
      });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  useEffect(() => {
    if (draggedIdx === null) return;
    const idx = draggedIdx;
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartClientXRef.current;
      const deg = dragStartTiltDegRef.current + (dx / 150) * MAX_TILT_DEG;
      setDraggedTiltDeg(Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, deg)));
    };
    const handleUp = () => {
      setDraggedIdx(null);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [draggedIdx]);

  const handleBustMouseDown = (idx: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    dragStartClientXRef.current = e.clientX;
    dragStartTiltDegRef.current = ambientTilt[idx] ?? 0;
    setDraggedTiltDeg(ambientTilt[idx] ?? 0);
    setDraggedIdx(idx);
    // Clicking (whether or not it turns into a drag) always toggles the pose,
    // so grabbing a bust to manually turn it doubles as revealing the alt one.
    cycleBust(idx);
  };

  const STATION_SLUGS: { [key: string]: string } = {
    rock_garden: "the-rock-garden",
    bridge_city: "bridge-city-hang-suite",
    golden_boombox: "the-golden-boombox",
  };

  const go = (path: string) => (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
    e.preventDefault();
    navigate(path);
  };

  return (
    <div
      id="about_wjrn_layout"
      className="relative min-h-screen w-full text-white flex flex-col gap-[70px] overflow-hidden font-sans pt-4 md:pt-6 lg:pt-8 pb-6 md:pb-10 lg:pb-14 px-6 md:px-10 lg:px-14 select-none"
      style={{ background: "#120e0b" }}
    >
      {/* Nebula Cosmic Fire Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Tiled damask background — SVG <pattern> with a symmetric 1px overdraw on
            each tile so no seam shows between repeats (see NebulaHomepage.tsx). */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <pattern id="wjrnTilePatternAbout" x="0" y="0" width="618" height="618" patternUnits="userSpaceOnUse" overflow="visible" style={{ overflow: "visible" }}>
            <image href={wjrnTileBg} x="-1" y="-1" width="620" height="620" style={{ imageRendering: "pixelated" }} />
          </pattern>
          <rect width="100%" height="100%" fill="url(#wjrnTilePatternAbout)" />
        </svg>

        <svg className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none z-10" xmlns="http://www.w3.org/2000/svg">
          <filter id="aboutNoiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#aboutNoiseFilter)" />
        </svg>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] opacity-45" />
      </div>

      {/* Header — Logo / Nav / Live Indicator */}
      <div className="relative z-30">
      <header className="w-full flex items-center justify-center md:justify-between pb-6 max-w-7xl mx-auto gap-4">
        <a href="/" onClick={go("/")} className="flex items-center gap-3 cursor-pointer select-none shrink-0">
          <img src={wjrnLogoLight} alt="WJRN" className="h-5 md:h-6 w-auto object-contain" />
          <span className="hidden sm:flex items-center gap-3">
            <span className="w-px h-3.5 bg-white/20" />
            <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.2em] text-[#d7b158]">
              Jacewon Radio Network
            </span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-5 text-[11px] font-mono uppercase tracking-[0.2em]">
          <a href="/" onClick={go("/")} className="text-white/80 hover:text-[#d7b158] transition-colors">
            Home
          </a>
          <span className="text-[#d7b158] text-[30px] leading-none">&middot;</span>

          <div className="relative group py-2">
            <span className="text-white/80 group-hover:text-[#d7b158] transition-colors cursor-pointer">
              Our Stations
            </span>
            <div className="absolute left-1/2 -translate-x-1/2 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pt-2">
              <div className="flex flex-col rounded-lg border border-white/10 bg-[#0c0908]/95 backdrop-blur-md shadow-2xl overflow-hidden">
                {STATIONS.filter((s) => s.id !== "wjrn").map((station) => (
                  <a
                    key={station.id}
                    href={`/${STATION_SLUGS[station.id]}`}
                    onClick={go(`/${STATION_SLUGS[station.id]}`)}
                    className={`px-6 py-2.5 text-[10px] tracking-[0.15em] text-white/70 hover:bg-white/5 transition-colors whitespace-nowrap text-center ${NAV_HOVER_COLOR[station.id] ?? "hover:text-white"}`}
                  >
                    {station.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <span className="text-[#d7b158] text-[30px] leading-none">&middot;</span>
          <span className="text-[#d7b158]">About WJRN</span>
        </nav>

        <div className="hidden md:flex items-center shrink-0">
          <span className="inline-flex items-center gap-1.5 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.2em] text-white/80">
            Broadcasting
            <Antenna className="w-3 h-3 text-red-500 animate-pulse shrink-0 ml-[3px] mr-[3px]" />
            {`${totalListeners.toLocaleString()} Listeners`}
          </span>
        </div>
      </header>
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-20 max-w-7xl mx-auto" />
      </div>

      {/* Hero */}
      <section className="relative z-10 w-full max-w-5xl mx-auto text-center flex flex-col items-center">
        <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#d7b158] mb-3">WJRN California USA</span>
        <h1 className="max-w-[12.2em] text-[36px] sm:text-5xl md:text-6xl font-extrabold leading-[0.95] tracking-normal text-white uppercase select-none font-display">
          The People Behind The Signal
        </h1>
        <p className="text-xs md:text-sm lg:text-base text-neutral-400 leading-relaxed font-light font-mono mt-6 max-w-2xl">
          WJRN is an independent, 24/7 broadcast network built and run out of California. No algorithm, no
          label commitments, just a series of shows that are mixed live in front of a studio audience and
          kept in rotation around the clock. Here's the crew that's keeping it fresh...
        </p>
      </section>

      {/* Team */}
      <section className="relative z-10 w-full max-w-7xl mx-auto -mt-[16.84px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-[26.4px]">
          {TEAM.map((member, idx) => {
            const stage = clickStage[idx] ?? 0;
            const tiltDeg = draggedIdx === idx ? draggedTiltDeg : (ambientTilt[idx] ?? 0);
            const bustTransform = `perspective(1000px) rotateY(${tiltDeg}deg)`;
            return (
            <div key={idx} className="flex flex-col gap-[30px]">
              <div
                ref={(el) => { bustRefs.current[idx] = el; }}
                role="button"
                tabIndex={0}
                aria-label={`Toggle ${member.name}'s sculpted bust pose — click and drag to turn`}
                onMouseDown={handleBustMouseDown(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    cycleBust(idx);
                  }
                }}
                className={`relative w-full aspect-[383/434] select-none ${
                  draggedIdx === idx ? "cursor-grabbing" : "cursor-grab"
                }`}
              >
                <img
                  src={member.bust}
                  alt={`${member.name} sculpted bust`}
                  draggable={false}
                  style={{
                    transition: "opacity 500ms ease, transform 150ms ease-out",
                    transform: bustTransform,
                  }}
                  className={`absolute inset-0 m-auto w-auto h-auto max-w-[calc(100%-32px)] max-h-[calc(100%-32px)] select-none pointer-events-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] ${
                    stage === 0 ? "opacity-100" : "opacity-0"
                  }`}
                />
                <img
                  src={member.bustAlt}
                  alt={`${member.name} alternate sculpted bust`}
                  draggable={false}
                  style={{
                    transition: "opacity 500ms ease, transform 150ms ease-out",
                    transform: bustTransform,
                  }}
                  className={`absolute inset-0 m-auto w-auto h-auto max-w-[calc(100%-32px)] max-h-[calc(100%-32px)] select-none pointer-events-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] ${
                    stage === 1 ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
              <div className="pt-8 pb-7 px-7 rounded-3xl border border-[#d7b158]/15 bg-gradient-to-b from-[#0a0706] to-[#040303] backdrop-blur-xl transition-all duration-500 flex flex-col items-center text-center gap-5">
                <div className="space-y-1.5">
                  <h4 className="text-lg font-bold tracking-normal text-white uppercase leading-tight font-display">
                    {member.name}
                  </h4>
                  <span className="text-[9.5px] font-mono uppercase tracking-[0.22em] block leading-snug font-bold text-[#d7b158]">
                    {member.role}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed font-mono">
                  {member.bio}
                </p>
              </div>
            </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
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
