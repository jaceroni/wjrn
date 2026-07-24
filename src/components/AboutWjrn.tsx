import React from "react";
import { Antenna, User } from "lucide-react";
import { Station } from "../types";
import { navigate } from "../navigate";
import { usePlayer } from "../context/PlayerContext";
import wjrnLogoLight from "../assets/images/wjrn-logo-light.svg";

interface AboutWjrnProps {
  STATIONS: Station[];
}

interface TeamMember {
  name: string;
  role: string;
  bio: string;
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
    bio: "Over 30 years in the crates and he's still diggin! Jace missed old school radio, so he built one. The vision, the vinyl, the voice, that's all him. If it's on WJRN, it passed through his ears first.",
  },
  {
    name: "Cindy Whopper",
    role: "Music Librarian + Promotions",
    bio: "Jace knew that you needed more than just good music. You need a deeeeeep catalog. Cindy keeps the library stacked, the rotation honest, and makes sure the world knows WJRN iisn't playin. Her appetite for records is bottomless.",
  },
  {
    name: "Phil Callings",
    role: "Chief Technical Officer",
    bio: "When the signal drops or the server crashes at 3am, Phil jumps on it. He is the reason WJRN is on the air around the clock and if you listen closely, you can hear him tinkering in the air tonight...you hear it?",
  },
];

export default function AboutWjrn({ STATIONS }: AboutWjrnProps) {
  const { isMiniPlayerVisible } = usePlayer();

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
      <header className="w-full flex items-center justify-between pb-6 max-w-7xl mx-auto gap-4">
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
            <span className="text-white/80 group-hover:text-[#d7b158] transition-colors cursor-default">
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

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Antenna className="w-3 h-3 text-red-500 animate-pulse shrink-0" />
          <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.2em] text-white/80">
            Live From California
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
      <section className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEAM.map((member, idx) => (
            <div
              key={idx}
              className="pt-8 pb-7 px-7 rounded-3xl border border-[#d7b158]/15 hover:border-[#d7b158]/60 bg-gradient-to-b from-[#0a0706] to-[#040303] backdrop-blur-xl transition-all duration-500 flex flex-col items-center text-center gap-5 group"
            >
              <div className="w-28 h-28 rounded-full overflow-hidden shrink-0 shadow-[0_15px_35px_rgba(0,0,0,0.8)] flex items-center justify-center bg-white/[0.03] border border-white/10 transition-transform duration-500 group-hover:scale-105">
                <User className="w-10 h-10 text-white/20" />
              </div>
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
          ))}
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
