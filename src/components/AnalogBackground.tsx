import { useEffect } from "react";

/**
 * AnalogBackground
 * ─────────────────
 * Two-layer fixed background texture shared across all pages:
 *
 *  Layer 1 — Animated film grain
 *    SVG feTurbulence with its `seed` attribute randomised every ~80ms.
 *    Produces an authentic film-noise shimmer without any gradient banding.
 *
 *  Layer 2 — CRT scan lines
 *    CSS repeating-linear-gradient of 1px dark stripes on a 4px repeat,
 *    slowly drifting downward via a 12-second keyframe loop.
 *    Pure CSS — no JS, no canvas, zero banding risk.
 */
export default function AnalogBackground() {
  useEffect(() => {
    const turbulence = document.getElementById(
      "analog-grain-turbulence"
    ) as SVGFETurbulenceElement | null;
    if (!turbulence) return;

    // Shuffle the noise seed ~12 times per second — enough to feel alive,
    // slow enough to stay subtle and not burn CPU.
    const interval = setInterval(() => {
      turbulence.setAttribute(
        "seed",
        String(Math.floor(Math.random() * 999))
      );
    }, 80);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[1] overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* ── Film grain ─────────────────────────────────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.038 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="analog-grain-filter" colorInterpolationFilters="sRGB">
          <feTurbulence
            id="analog-grain-turbulence"
            type="fractalNoise"
            baseFrequency="0.72"
            numOctaves="4"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#analog-grain-filter)" />
      </svg>

      {/* ── CRT scan lines ─────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.045) 2px, rgba(0,0,0,0.045) 4px)",
          animation: "crtScanlines 12s linear infinite",
          willChange: "background-position",
        }}
      />
    </div>
  );
}
