import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  type: "bars" | "wave" | "retro";
  accentColor: string; // e.g. '#22c55e', '#ec4899', '#eab308'
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  isFlipped?: boolean;
}

// Global cache to map HTMLAudioElement to its connected AnalyserNode and AudioContext
// This prevents browser duplicate source connection errors during React re-renders/remounts.
const audioConnectionCache = new WeakMap<
  HTMLAudioElement,
  { ctx: AudioContext; analyser: AnalyserNode }
>();

// Track the active AudioContext so we can close previous ones when switching streams
let lastActiveContext: AudioContext | null = null;

export default function AudioVisualizer({ isPlaying, type, accentColor, audioRef, isFlipped }: AudioVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize and run visualization loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Perfect resizing matching physical layout container
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w > 0 && h > 0) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    
    resizeObserver.observe(container);
    resizeCanvas(); // Initial call

    // Setup visualizer variables
    let phase = 0;
    const barsCount = type === "retro" ? 18 : 28;
    const barHeights = Array(barsCount).fill(4);
    const targetHeights = Array(barsCount).fill(4);

    // Set up Web Audio Analyser if audioRef is available
    let analyser: AnalyserNode | null = null;
    let audioCtx: AudioContext | null = null;

    if (audioRef?.current) {
      const audio = audioRef.current;
      
      // Ensure crossOrigin is configured
      if (!audio.crossOrigin) {
        audio.crossOrigin = "anonymous";
      }

      const cached = audioConnectionCache.get(audio);
      if (cached) {
        analyser = cached.analyser;
        audioCtx = cached.ctx;
      } else {
        try {
          // Close previously active AudioContext to keep browser resources optimized
          if (lastActiveContext && lastActiveContext.state !== "closed") {
            lastActiveContext.close().catch(() => {});
          }

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const localCtx = new AudioContextClass();
          const localAnalyser = localCtx.createAnalyser();
          localAnalyser.fftSize = 256; // yields 128 frequency bins

          const source = localCtx.createMediaElementSource(audio);
          source.connect(localAnalyser);
          localAnalyser.connect(localCtx.destination);

          audioConnectionCache.set(audio, { ctx: localCtx, analyser: localAnalyser });
          analyser = localAnalyser;
          audioCtx = localCtx;
          lastActiveContext = localCtx;
        } catch (e) {
          console.warn("Failed to connect Web Audio API source node:", e);
        }
      }
    }

    // Resume suspended context (autoplay browser behavior)
    if (audioCtx && audioCtx.state === "suspended" && isPlaying) {
      audioCtx.resume().catch(() => {});
    }

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      if (w <= 0 || h <= 0) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      // Get real audio frequency or time-domain metrics if available
      let dataArray: Uint8Array | null = null;
      let hasRealAudio = false;
      let overallVolume = 0;

      if (isPlaying && analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const localDataArray = new Uint8Array(bufferLength);
        
        if (type === "bars") {
          analyser.getByteFrequencyData(localDataArray);
        } else {
          analyser.getByteTimeDomainData(localDataArray);
        }
        
        dataArray = localDataArray;

        // Check if analyser contains active values (i.e. not silent / blocked by CORS)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          if (type === "bars") {
            sum += localDataArray[i];
          } else {
            // In time-domain, 128 is neutral (silent) level, so sum absolute deviation from 128
            sum += Math.abs(localDataArray[i] - 128);
          }
        }
        
        if (sum > 0) {
          hasRealAudio = true;
          // Scale time-domain volume range with a 5.0x multiplier to strongly boost volume sensitivity
          overallVolume = type === "bars" ? (sum / bufferLength) : ((sum / bufferLength) * 5.0);
        }
      }

      // 1. BAR MODE: Classic EQ Level Animation (Flipped downwards if isFlipped)
      if (type === "bars") {
        const gap = 3;
        const barWidth = (w - gap * (barsCount - 1)) / barsCount;

        for (let i = 0; i < barsCount; i++) {
          let percent = 0;
          if (hasRealAudio && dataArray) {
            // Group and map spectrum bins focusing on lower-mid music frequencies (0 to 75)
            const binIndex = Math.min(
              dataArray.length - 1,
              Math.floor((i / barsCount) * 75)
            );
            percent = dataArray[binIndex] / 255;
          } else {
            // Fallback simulated EQ waves when offline or CORS-blocked
            if (isPlaying) {
              const time = phase + i * 0.35;
              const base = Math.sin(time) * 0.35 + 0.45;
              const noise = Math.sin(time * 2.3) * 0.15;
              percent = Math.min(1.0, Math.max(0.1, base + noise));
            } else {
              percent = (3 + Math.sin(phase + i * 0.4) * 2) / h;
            }
          }

          targetHeights[i] = Math.max(3, percent * (h - 10));
          barHeights[i] += (targetHeights[i] - barHeights[i]) * 0.18;

          const barH = barHeights[i];
          const x = i * (barWidth + gap);
          
          // Flipped to grow downwards from y=0 if isFlipped is active
          const y = isFlipped ? 0 : h - barH;

          // Gradient fill (increased opacity by 20% absolute: 35% max opacity down to 5% at bottom)
          const gradient = isFlipped
            ? ctx.createLinearGradient(x, 0, x, barH)
            : ctx.createLinearGradient(x, y, x, h);

          gradient.addColorStop(0, `${accentColor}59`); // 35% opacity
          gradient.addColorStop(1, `${accentColor}0d`); // 5% opacity

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, 2);
          ctx.fill();

          // Peak dot (increased to 45% opacity)
          if (isPlaying) {
            ctx.fillStyle = `${accentColor}73`; // 45% opacity
            const peakY = isFlipped ? Math.min(h - 1.2, barH + 1.8) : Math.max(0, y - 3);
            ctx.fillRect(x, peakY, barWidth, 1.2);
          }
        }

        phase += isPlaying ? 0.12 : 0.03;
      }

      // 2. OSCILLOSCOPE WAVE: Sine Signal Line Effect (using raw time-domain signal)
      else if (type === "wave") {
        // Boosted sensitivity base multipliers
        const amplitude = isPlaying
          ? (hasRealAudio ? Math.max(6, (overallVolume / 140) * h * 0.95) : h / 2.8)
          : 3;
        const waveSpeed = isPlaying
          ? (hasRealAudio ? Math.max(0.015, (overallVolume / 255) * 0.22) : 0.08)
          : 0.025;

        // Primary running sine wave (increased by 20% absolute to ~38% opacity: '61')
        ctx.strokeStyle = `${accentColor}61`;
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 0;

        ctx.beginPath();
        if (hasRealAudio && dataArray) {
          const dataLength = dataArray.length;
          for (let x = 0; x < w; x++) {
            const relativeX = x / w;
            const dataIndex = Math.floor(relativeX * dataLength);
            const v = dataArray[dataIndex] / 128.0; // 0.0 to 2.0
            const edgeFade = Math.sin(relativeX * Math.PI); // Fades wave edges at borders
            const offset = (v - 1.0) * amplitude * 2.8; // Boosted signal offset multiplier from 1.5 to 2.8
            const sineDrift = Math.sin(relativeX * Math.PI * 2 + phase) * (amplitude * 0.15);
            const y = h / 2 + (offset + sineDrift) * edgeFade;

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        } else {
          for (let x = 0; x < w; x++) {
            const relativeX = x / w;
            const edgeFade = Math.sin(relativeX * Math.PI);
            const y = h / 2 + Math.sin(relativeX * Math.PI * 3.5 + phase) * amplitude * edgeFade;

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Secondary out-of-phase line (increased by 20% absolute to ~26% opacity: '42')
        ctx.strokeStyle = `${accentColor}42`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        if (hasRealAudio && dataArray) {
          const dataLength = dataArray.length;
          for (let x = 0; x < w; x++) {
            const relativeX = x / w;
            // Out of phase index mapping
            const dataIndex = Math.floor(((relativeX + 0.2) % 1.0) * dataLength);
            const v = dataArray[dataIndex] / 128.0;
            const edgeFade = Math.sin(relativeX * Math.PI);
            const offset = (v - 1.0) * amplitude * 1.25; // Boosted offset multiplier from 0.75 to 1.25
            const sineDrift = Math.sin(relativeX * Math.PI * 3 - phase * 1.3) * (amplitude * 0.1);
            const y = h / 2 + (offset + sineDrift) * edgeFade;

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        } else {
          for (let x = 0; x < w; x++) {
            const relativeX = x / w;
            const edgeFade = Math.sin(relativeX * Math.PI);
            const y = h / 2 + Math.sin(relativeX * Math.PI * 4.5 - phase * 1.3) * (amplitude * 0.5) * edgeFade;

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        phase += waveSpeed;
      }

      // 3. RETRO LED: Symmetrical Waveform Effect (using time-domain sound peaks)
      else if (type === "retro") {
        const gap = 3;
        const barWidth = (w - gap * (barsCount - 1)) / barsCount;

        for (let i = 0; i < barsCount; i++) {
          let percent = 0;
          if (hasRealAudio && dataArray) {
            // Using time-domain data, we compute the peak value in the corresponding slice
            const startIndex = Math.floor((i / barsCount) * dataArray.length);
            const endIndex = Math.floor(((i + 1) / barsCount) * dataArray.length);
            let maxVal = 0;
            for (let k = startIndex; k < endIndex; k++) {
              const val = Math.abs(dataArray[k] - 128);
              if (val > maxVal) maxVal = val;
            }
            // Scale up the time-domain peak percent by 1.6x to drastically increase retro soundwave sensitivity
            percent = Math.min(1.0, (maxVal / 128) * 1.6);
            // Apply edge-tapering envelope to give it a clean waveform look
            const envelope = Math.sin((i / (barsCount - 1)) * Math.PI);
            percent = percent * (0.35 + 0.65 * envelope);
          } else {
            // Fallback symmetrical simulated wave when offline/CORS-blocked (boosted pulse range)
            if (isPlaying) {
              const time = phase * 1.5 + i * 0.4;
              const envelope = Math.sin((i / (barsCount - 1)) * Math.PI);
              const pulse = Math.sin(time) * 0.35 + 0.65;
              percent = envelope * pulse * (1.1 + Math.sin(time * 2.3) * 0.3);
            } else {
              percent = (3 + Math.sin(phase + i * 0.4) * 2) / h;
            }
          }

          targetHeights[i] = Math.max(3, percent * (h * 0.85));
          barHeights[i] += (targetHeights[i] - barHeights[i]) * 0.22;

          const barH = barHeights[i];
          const x = i * (barWidth + gap);
          const y = h / 2 - barH / 2; // Symmetrical center alignment

          // Symmetrical gradient (increased by 20% absolute to ~40% center opacity: '66')
          const gradient = ctx.createLinearGradient(x, y, x, y + barH);
          gradient.addColorStop(0, `${accentColor}0d`); // 5% opacity
          gradient.addColorStop(0.5, `${accentColor}66`); // 40% opacity
          gradient.addColorStop(1, `${accentColor}0d`); // 5% opacity

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, 1.5);
          ctx.fill();
        }

        phase += isPlaying ? 0.12 : 0.04;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, type, accentColor, audioRef, isFlipped]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}

