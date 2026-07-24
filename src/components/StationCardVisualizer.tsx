import React, { useEffect, useRef } from "react";

interface StationCardVisualizerProps {
  active: boolean;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  barColorClass: string;
  barCount?: number;
}

const IDLE_HEIGHT = 8;

// Real audio-reactive bar visualizer for the homepage station cards — reads frequency
// data off the same analyserRef PlayerContext already feeds the vintage player's VU
// meter with (see NebulaHomepage's vuLevel effect), rather than faking a pulse via CSS.
// Bar heights are written directly to DOM refs instead of React state to avoid a
// re-render on every animation frame.
export default function StationCardVisualizer({
  active,
  analyserRef,
  barColorClass,
  barCount = 22,
}: StationCardVisualizerProps) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!active) {
      barsRef.current.forEach((bar) => {
        if (bar) bar.style.height = `${IDLE_HEIGHT}%`;
      });
      return;
    }

    let rafId: number;

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const analyser = analyserRef.current;
      if (!analyser) return;
      if (!dataArrayRef.current || dataArrayRef.current.length !== analyser.frequencyBinCount) {
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
      const dataArray = dataArrayRef.current;
      analyser.getByteFrequencyData(dataArray);

      // Most of a radio stream's audible energy sits in the lower ~55% of bins —
      // using the full range would leave the upper bars almost always flat.
      const usableBins = Math.max(barCount, Math.floor(analyser.frequencyBinCount * 0.55));
      const binsPerBar = Math.max(1, Math.floor(usableBins / barCount));

      for (let i = 0; i < barCount; i++) {
        const start = i * binsPerBar;
        let sum = 0;
        for (let j = 0; j < binsPerBar; j++) sum += dataArray[start + j] ?? 0;
        const avg = sum / binsPerBar;
        const pct = Math.max(IDLE_HEIGHT, Math.min(100, (avg / 255) * 100));
        const bar = barsRef.current[i];
        if (bar) bar.style.height = `${pct}%`;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, analyserRef, barCount]);

  return (
    <div className="flex-1 flex items-end gap-[1.5px] h-2.5 min-w-0">
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { barsRef.current[i] = el; }}
          className={`flex-1 rounded-[1px] transition-[height] duration-100 ${active ? barColorClass : "bg-white/10"}`}
          style={{ height: `${IDLE_HEIGHT}%`, opacity: active ? 0.85 : 1 }}
        />
      ))}
    </div>
  );
}
