import React from "react";
import { Antenna, Menu } from "lucide-react";
import { Station } from "../types";
import { navigate } from "../navigate";
import { usePlayer } from "../context/PlayerContext";
import wjrnLogoLight from "../assets/images/wjrn-logo-light.svg";
import wjrnTileBg from "../assets/images/wjrn-tile-bg-1a.png";

interface TermsProps {
  STATIONS: Station[];
}

// Nav dropdown hover colors — matches each station's brand accent
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

interface PolicySection {
  heading: string;
  body: React.ReactNode;
}

const SECTIONS: PolicySection[] = [
  {
    heading: "Acceptance Of Terms",
    body: (
      <>
        By accessing or using the WJRN Vintage Radio app or the wjrnradio.com website (together, the "Service"),
        you agree to be bound by these Terms of Use. If you do not agree, please do not use the Service.
      </>
    ),
  },
  {
    heading: "The Service",
    body: (
      <>
        WJRN provides 24/7 internet radio streams and on-demand tribute podcast episodes for promotional and
        entertainment purposes. The Service is provided "as is," and streams or episodes may change, be
        interrupted, or become unavailable at any time without notice.
      </>
    ),
  },
  {
    heading: "Acceptable Use",
    body: (
      <>
        You agree to use the Service only for lawful, personal, non-commercial listening. You may not attempt to
        rebroadcast, redistribute, record for resale, reverse-engineer, or otherwise interfere with the Service or
        the infrastructure that delivers it.
      </>
    ),
  },
  {
    heading: "Intellectual Property",
    body: (
      <>
        All music, artwork, and other content played or displayed through the Service remains the property of its
        respective owners and is used for promotional purposes only. The WJRN name, logo, and site design are the
        property of WJRN and may not be used without permission.
      </>
    ),
  },
  {
    heading: "Third-Party Services",
    body: (
      <>
        The Service may embed or link to third-party content (for example, a Twitch livestream player). Your use
        of any embedded third-party service is governed by that provider's own terms, and WJRN is not responsible
        for third-party content or availability.
      </>
    ),
  },
  {
    heading: "Disclaimer & Limitation Of Liability",
    body: (
      <>
        The Service is provided without warranties of any kind, express or implied. To the fullest extent
        permitted by law, WJRN is not liable for any damages arising from your use of, or inability to use, the
        Service.
      </>
    ),
  },
  {
    heading: "Changes To These Terms",
    body: <>We may update these Terms from time to time. Changes will be posted on this page with an updated "Last updated" date.</>,
  },
  {
    heading: "Contact",
    body: (
      <>
        Questions about these Terms can be sent to{" "}
        <a href="mailto:contact@wjrnradio.com" className="text-[#d7b158] hover:underline">
          contact@wjrnradio.com
        </a>
        .
      </>
    ),
  },
];

export default function Terms({ STATIONS }: TermsProps) {
  const { isMiniPlayerVisible, totalListeners } = usePlayer();

  const go = (path: string) => (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
    e.preventDefault();
    navigate(path);
  };

  return (
    <div
      id="terms_layout"
      className="relative min-h-screen w-full text-[#f3ede2] flex flex-col gap-[70px] overflow-hidden font-sans pt-[19px] md:pt-6 lg:pt-8 pb-6 md:pb-10 lg:pb-14 px-6 md:px-10 lg:px-14 select-none"
      style={{ background: "#120e0b" }}
    >
      {/* Tiled damask background — SVG <pattern> with a symmetric 1px overdraw on
          each tile so no seam shows between repeats (see NebulaHomepage.tsx). */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <pattern id="wjrnTilePatternTerms" x="0" y="0" width="618" height="618" patternUnits="userSpaceOnUse" overflow="visible" style={{ overflow: "visible" }}>
            <image href={wjrnTileBg} x="-1" y="-1" width="620" height="620" style={{ imageRendering: "pixelated" }} />
          </pattern>
          <rect width="100%" height="100%" fill="url(#wjrnTilePatternTerms)" />
        </svg>

        <svg className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none z-10" xmlns="http://www.w3.org/2000/svg">
          <filter id="termsNoiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#termsNoiseFilter)" />
        </svg>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] opacity-45" />
      </div>

      {/* Header — Logo / Nav / Live Indicator */}
      <div className="relative z-30">
        <header className="w-full flex items-center justify-between pb-[22px] max-w-7xl mx-auto gap-4">
          <div className="md:hidden flex items-center shrink-0">
            <Antenna className="w-5 h-5 text-red-500 animate-pulse" />
          </div>

          <a href="/" onClick={go("/")} className="flex items-center gap-3 cursor-pointer select-none shrink-0">
            <img src={wjrnLogoLight} alt="WJRN" className="h-5 md:h-6 w-auto object-contain" />
            <span className="hidden sm:flex items-center gap-3">
              <span className="w-px h-3.5 bg-white/20" />
              <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.2em] text-[#d7b158]">
                Online Radio Network
              </span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-5 text-[11px] font-mono uppercase tracking-[0.2em]">
            <a href="/" onClick={go("/")} className="text-[#f3ede2]/80 hover:text-[#d7b158] transition-colors">
              Home
            </a>
            <span className="text-[#d7b158] text-[30px] leading-none">&middot;</span>

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
                      onClick={go(`/${STATION_SLUGS[station.id]}`)}
                      className={`px-6 py-2.5 text-[10px] tracking-[0.15em] text-[#f3ede2]/70 hover:bg-white/5 transition-colors whitespace-nowrap text-center ${NAV_HOVER_COLOR[station.id] ?? "hover:text-[#f3ede2]"}`}
                    >
                      {station.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <span className="text-[#d7b158] text-[30px] leading-none">&middot;</span>
            <a href="/about" onClick={go("/about")} className="text-[#f3ede2]/80 hover:text-[#d7b158] transition-colors">
              About
            </a>
            <span className="text-[#d7b158] text-[30px] leading-none">&middot;</span>
            <span className="text-[#d7b158]">Terms</span>
          </nav>

          <div className="hidden md:flex items-center shrink-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.2em] text-[#f3ede2]/80">
              Broadcasting
              <Antenna className="w-3 h-3 text-red-500 animate-pulse shrink-0 ml-[3px] mr-[3px]" />
              {`${totalListeners.toLocaleString()} Listeners`}
            </span>
          </div>

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

      {/* Hero */}
      <section className="relative z-10 w-full max-w-5xl mx-auto text-center flex flex-col items-center -mt-[31px] md:mt-0">
        <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#d7b158] mb-3">Legal</span>
        <h1 className="max-w-[12.2em] text-[36px] sm:text-5xl md:text-6xl font-extrabold leading-[0.95] tracking-normal text-[#f3ede2] uppercase select-none font-display">
          Terms of Use
        </h1>
        <p className="text-xs md:text-sm lg:text-base text-neutral-400 leading-relaxed font-light font-mono mt-6 max-w-2xl">
          Last updated: September 23, 2026 &mdash; WJRN Online Radio Network ("WJRN," "we," "us") operates the WJRN
          Vintage Radio app and the wjrnradio.com website (together, the "Service"). These Terms of Use govern your
          access to and use of the Service.
        </p>
      </section>

      {/* Terms sections */}
      <section className="relative z-10 w-full max-w-4xl mx-auto -mt-[16.84px]">
        <div className="flex flex-col gap-6 md:gap-[26.4px]">
          {SECTIONS.map((section, idx) => (
            <div
              key={idx}
              className="pt-8 pb-7 px-7 rounded-3xl border border-[#d7b158]/15 bg-gradient-to-b from-[#0a0706] to-[#040303] backdrop-blur-xl flex flex-col gap-3 text-left"
            >
              <h2 className="text-base md:text-lg font-bold tracking-normal text-[#f3ede2] uppercase leading-tight font-display">
                {section.heading}
              </h2>
              <p className="text-xs md:text-sm text-neutral-400 leading-relaxed font-mono">{section.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
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

        <div
          aria-hidden="true"
          className="transition-[height] duration-300 ease-in-out"
          style={{ height: isMiniPlayerVisible ? "83px" : "0px" }}
        />
      </div>
    </div>
  );
}
