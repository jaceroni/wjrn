import React, { useEffect, useRef, useState } from "react";
import bustPeteRock from "../assets/images/bust-pete-rock-default.png";
import bustPeteRockAlt from "../assets/images/bust-pete-rock-alt.png";
import bustBobDylan from "../assets/images/bust-bob-dylan-default.png";
import bustBobDylanAlt from "../assets/images/bust-bob-dylan-alt.png";
import bustLindaRonstadt from "../assets/images/bust-linda-ronstadt-default.png";
import bustLindaRonstadtAlt from "../assets/images/bust-linda-ronstadt-alt.png";

interface HeroQuoteEntry {
  // Plain, un-broken text — no manual line breaks. Left entirely to natural
  // CSS wrap (fixed 2026-07-24: hand-set line breaks kept producing awkward
  // wraps of their own — an orphaned word alone on a line — no matter how the
  // budget was tuned, so the manual-break approach was dropped altogether).
  quote: string;
  attribution: string;
  bust: string;
  bustAlt: string;
}

// Add more entries here as new busts get made — one rotates in at random on
// load, then the set auto-advances (see ROTATE_MS below).
const HERO_QUOTES: HeroQuoteEntry[] = [
  {
    quote: "So this is what they meant by soul – yeah this is what they meant by funky...",
    attribution: "Pete Rock",
    bust: bustPeteRock,
    bustAlt: bustPeteRockAlt,
  },
  {
    quote: "I've learned as much from Cézanne as I have from Woody Guthrie...",
    attribution: "Bob Dylan",
    bust: bustBobDylan,
    bustAlt: bustBobDylanAlt,
  },
  {
    quote: "If you don't have a story to tell, you should probably start listening...",
    attribution: "Linda Ronstadt",
    bust: bustLindaRonstadt,
    bustAlt: bustLindaRonstadtAlt,
  },
];

const ROTATE_MS = 16000;
const FADE_MS = 400;
const MAX_TILT_DEG = 14;
const TILT_DEPTH = 4000; // larger = gentler falloff, reaches max angle further out

export default function HeroQuote() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * HERO_QUOTES.length));
  const [visible, setVisible] = useState(true);

  // Paused for as long as the cursor is anywhere in the section — quote text
  // or bust — so someone reading slowly (or busy fiddling with the bust)
  // never has it change out from under them. Resumes with a fresh ROTATE_MS
  // countdown the moment the cursor leaves, rather than trying to resume a
  // partially-elapsed one.
  const [isHovering, setIsHovering] = useState(false);

  const goToNextQuote = () => {
    setVisible(false);
    setTimeout(() => {
      setIndex((i) => (i + 1) % HERO_QUOTES.length);
      setVisible(true);
    }, FADE_MS);
  };

  // Auto-rotate through the set — no-ops gracefully while there's only one
  // entry, and pauses entirely while hovered (see isHovering above).
  useEffect(() => {
    if (HERO_QUOTES.length < 2 || isHovering) return;
    const id = setInterval(goToNextQuote, ROTATE_MS);
    return () => clearInterval(id);
  }, [isHovering]);

  // Clicking the headline (not the bust — that's for the tilt) manually
  // advances to the next quote. No need to also manage the auto-rotate timer
  // here — the cursor is necessarily still hovering right after a click, so
  // the effect above already keeps it paused until the cursor actually leaves.
  const handleHeadlineClick = () => {
    if (HERO_QUOTES.length < 2) return;
    goToNextQuote();
  };

  const entry = HERO_QUOTES[index];

  // Easter egg: click (no drag) the bust to toggle default <-> alt pose — keyed
  // per quote index so rotating to a different quote doesn't lose whichever
  // pose was showing for a quote you've already toggled (see AboutWjrn.tsx).
  const [clickStage, setClickStage] = useState<Record<number, number>>({});
  const stage = clickStage[index] ?? 0;
  const cycleBust = () =>
    setClickStage((prev) => ({ ...prev, [index]: ((prev[index] ?? 0) + 1) % 2 }));

  // Ambient tilt toward cursor + click-drag override — same interaction as the
  // About page team busts (see AboutWjrn.tsx), just a single bust instead of a
  // per-index map since there's only one on screen at a time here.
  const bustRef = useRef<HTMLDivElement | null>(null);
  const [ambientTilt, setAmbientTilt] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTiltDeg, setDraggedTiltDeg] = useState(0);
  const dragStartClientXRef = useRef(0);
  const dragStartTiltDegRef = useRef(0);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const el = bustRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const deg = (Math.atan2(dx, TILT_DEPTH) * 180) / Math.PI;
      setAmbientTilt(Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, deg)));
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartClientXRef.current;
      const deg = dragStartTiltDegRef.current + (dx / 150) * MAX_TILT_DEG;
      setDraggedTiltDeg(Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, deg)));
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging]);

  const handleBustMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStartClientXRef.current = e.clientX;
    dragStartTiltDegRef.current = ambientTilt;
    setDraggedTiltDeg(ambientTilt);
    setIsDragging(true);
    // Clicking (whether or not it turns into a drag) always toggles the pose,
    // so grabbing the bust to manually turn it doubles as revealing the alt one.
    cycleBust();
  };

  const tiltDeg = isDragging ? draggedTiltDeg : ambientTilt;
  const bustTransform = `perspective(1000px) rotateY(${tiltDeg}deg)`;

  return (
    <section
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="relative z-10 w-full max-w-7xl mx-auto -mt-[31px] md:-mt-[14px] flex flex-col lg:flex-row items-center gap-5"
    >
      <div
        onClick={handleHeadlineClick}
        role={HERO_QUOTES.length > 1 ? "button" : undefined}
        tabIndex={HERO_QUOTES.length > 1 ? 0 : undefined}
        aria-label={HERO_QUOTES.length > 1 ? "Show another quote" : undefined}
        onKeyDown={(e) => {
          if (HERO_QUOTES.length < 2) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleHeadlineClick();
          }
        }}
        className={`flex-1 min-w-0 text-center lg:text-left transition-opacity ease-out select-none ${
          HERO_QUOTES.length > 1 ? "cursor-pointer" : ""
        }`}
        style={{ opacity: visible ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
      >
        <p className="text-[48px] sm:text-5xl md:text-6xl lg:text-[72px] font-extrabold leading-[1] tracking-normal uppercase select-none font-display">
          <span className="text-[#d7b158]">&#8220;</span>
          <span className="text-[#faf6f0]">{entry.quote}</span>
          <span className="text-[#d7b158]">&#8221;</span>
          <br />
          <span className="block mt-3 text-center sm:text-right text-[#f3ede2] text-[17px] sm:text-[22px] tracking-wide">
            &ndash; {entry.attribution.toUpperCase()}
          </span>
        </p>
      </div>

      <div
        ref={bustRef}
        onMouseDown={handleBustMouseDown}
        role="button"
        tabIndex={0}
        aria-label={`${entry.attribution} sculpted bust — click and drag to turn`}
        className={`relative w-[220px] sm:w-[260px] lg:w-[300px] aspect-[308/376] shrink-0 select-none transition-opacity ease-out ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ opacity: visible ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
      >
        <img
          src={entry.bust}
          alt={`${entry.attribution} sculpted bust`}
          draggable={false}
          style={{ transition: "opacity 120ms ease-out, transform 150ms ease-out", transform: bustTransform }}
          className={`absolute inset-0 m-auto w-auto h-auto max-w-full max-h-full select-none pointer-events-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] ${
            stage === 0 ? "opacity-100" : "opacity-0"
          }`}
        />
        <img
          src={entry.bustAlt}
          alt={`${entry.attribution} alternate sculpted bust`}
          draggable={false}
          style={{ transition: "opacity 120ms ease-out, transform 150ms ease-out", transform: bustTransform }}
          className={`absolute inset-0 m-auto w-auto h-auto max-w-full max-h-full select-none pointer-events-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] ${
            stage === 1 ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </section>
  );
}
