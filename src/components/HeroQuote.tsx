import React, { useEffect, useRef, useState } from "react";
import bustPeteRock from "../assets/images/bust-pete-rock-default.png";
import bustPeteRockAlt from "../assets/images/bust-pete-rock-alt.png";

interface HeroQuoteEntry {
  // Each string is one hand-set visual line (mirrors how the mockup itself was
  // composed with fixed line breaks) — the attribution is appended straight
  // after the last line so it shares its text baseline rather than relying on
  // natural wrap to land it there, which isn't reliable at every width.
  quoteLines: string[];
  attribution: string;
  bust: string;
  bustAlt: string;
}

// Add more entries here as new busts get made — one rotates in at random on
// load, then the set auto-advances (see ROTATE_MS below).
const HERO_QUOTES: HeroQuoteEntry[] = [
  {
    quoteLines: [
      "So this is what they",
      "meant by soul – yeah",
      "this is what they",
      "meant by funky...",
    ],
    attribution: "Pete Rock",
    bust: bustPeteRock,
    bustAlt: bustPeteRockAlt,
  },
];

const ROTATE_MS = 16000;
const FADE_MS = 400;
const MAX_TILT_DEG = 14;
const TILT_DEPTH = 4000; // larger = gentler falloff, reaches max angle further out

export default function HeroQuote() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * HERO_QUOTES.length));
  const [visible, setVisible] = useState(true);

  // Auto-rotate through the set — no-ops gracefully while there's only one entry.
  useEffect(() => {
    if (HERO_QUOTES.length < 2) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % HERO_QUOTES.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

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
    <section className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
      <div
        className="flex-1 min-w-0 text-center lg:text-left transition-opacity ease-out"
        style={{ opacity: visible ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
      >
        <p className="text-[32px] sm:text-5xl md:text-6xl lg:text-[72px] font-extrabold leading-[1] tracking-normal uppercase select-none font-display">
          <span className="text-[#d7b158]">&#8220;</span>
          {entry.quoteLines.map((line, i) => {
            const isLast = i === entry.quoteLines.length - 1;
            return (
              <React.Fragment key={i}>
                <span className="text-[#faf6f0]">{line}</span>
                {isLast ? (
                  <>
                    <span className="text-[#d7b158]">&#8221;</span>
                    <span className="ml-3 text-white text-[22px] tracking-wide whitespace-nowrap">
                      &ndash; {entry.attribution.toUpperCase()}
                    </span>
                  </>
                ) : (
                  <br />
                )}
              </React.Fragment>
            );
          })}
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
          style={{ transition: "opacity 500ms ease, transform 150ms ease-out", transform: bustTransform }}
          className={`absolute inset-0 m-auto w-auto h-auto max-w-full max-h-full select-none pointer-events-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] ${
            stage === 0 ? "opacity-100" : "opacity-0"
          }`}
        />
        <img
          src={entry.bustAlt}
          alt={`${entry.attribution} alternate sculpted bust`}
          draggable={false}
          style={{ transition: "opacity 500ms ease, transform 150ms ease-out", transform: bustTransform }}
          className={`absolute inset-0 m-auto w-auto h-auto max-w-full max-h-full select-none pointer-events-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] ${
            stage === 1 ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </section>
  );
}
