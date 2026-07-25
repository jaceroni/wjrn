import React, { useEffect, useState } from "react";
import { X, Antenna } from "lucide-react";
import { navigate } from "../navigate";
import { usePlayer } from "../context/PlayerContext";
import { Station } from "../types";
import wjrnLogoLight from "../assets/images/wjrn-logo-light.svg";

// Shared across the homepage, station landing pages, and About page — mounted
// once in App.tsx (alongside MiniPlayer) rather than duplicated per-header, so
// all three headers trigger the exact same overlay via one custom event
// instead of drifting out of sync with their own copies.
export const MOBILE_NAV_BREAKPOINT_QUERY = "(min-width: 768px)";

const NAV_HOVER_COLOR: { [key: string]: string } = {
  rock_garden: "hover:text-emerald-400",
  bridge_city: "hover:text-pink-400",
  golden_boombox: "hover:text-yellow-400",
};

const STATION_SLUGS: { [key: string]: string } = {
  rock_garden: "the-rock-garden",
  bridge_city: "bridge-city-hang-suite",
  golden_boombox: "the-golden-boombox",
};

interface Props {
  STATIONS: Station[];
}

export default function MobileNavOverlay({ STATIONS }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { totalListeners } = usePlayer();

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("wjrn:open-mobile-nav", handler);
    return () => window.removeEventListener("wjrn:open-mobile-nav", handler);
  }, []);

  if (!isOpen) return null;

  const go = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-[#0c0908]/98 backdrop-blur-md flex flex-col md:hidden"
      onClick={() => setIsOpen(false)}
    >
      <div className="relative flex items-center justify-center px-6 pt-4">
        <img src={wjrnLogoLight} alt="WJRN" className="h-5 w-auto object-contain" />
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
          className="absolute right-6 top-4 text-white/60 hover:text-white transition-colors p-2 -mr-2"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav
        className="flex-1 flex flex-col items-center justify-center gap-8 text-center font-mono uppercase tracking-[0.2em]"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href="/"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            go("/");
          }}
          className="text-2xl text-white/85 hover:text-[#d7b158] transition-colors"
        >
          Home
        </a>
        <span className="flex flex-col items-center gap-5">
          <span className="text-[11px] text-white/30">Our Stations</span>
          {STATIONS.filter((s) => s.id !== "wjrn").map((station) => (
            <a
              key={station.id}
              href={`/${STATION_SLUGS[station.id]}`}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                go(`/${STATION_SLUGS[station.id]}`);
              }}
              className={`text-2xl text-white/85 transition-colors ${NAV_HOVER_COLOR[station.id] ?? "hover:text-[#d7b158]"}`}
            >
              {station.name}
            </a>
          ))}
        </span>
        <a
          href="/about-wjrn"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            go("/about-wjrn");
          }}
          className="text-2xl text-white/85 hover:text-[#d7b158] transition-colors"
        >
          About WJRN
        </a>
      </nav>

      <div className="pb-8 flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-white/60">
          Broadcasting
          <Antenna className="w-3 h-3 text-red-500 animate-pulse shrink-0 ml-[3px] mr-[3px]" />
          {`${totalListeners.toLocaleString()} Listeners`}
        </span>
      </div>
    </div>
  );
}
