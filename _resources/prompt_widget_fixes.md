# TASK: Fix Popout Widget Visualizer & Centering Issues

We need to fix two issues in the WJRN Popout Widget player:
1. The LED visualizer is frozen (sitting still in 5% state).
2. Short track titles (like the WJRN default) are left-aligned instead of centered.

## Files in Scope
- `src/index.css`
- `src/components/PopoutWidget.tsx`

---

## Technical Specifications

### 1. Define Visualizer Keyframes in `src/index.css`
The visualizer in `PopoutWidget.tsx` looks for a CSS keyframe animation named `verticalPulse` to animate the LED bars, but it is currently missing from the global styles. 

Add the keyframes at the bottom of `src/index.css`:

```css
/* Animates the height of the visualizer columns */
@keyframes verticalPulse {
  0%, 100% {
    transform: scaleY(0.15);
  }
  50% {
    transform: scaleY(0.95);
  }
}
```

### 2. Add Transform Origin to Visualizer Bars in `PopoutWidget.tsx`
For the `scaleY` animation to scale the bars *upward* from the bottom (rather than stretching from the center), we need to set the transform origin.

Locate the LED visualizer code block (around lines 98-118). Add `transformOrigin: "bottom"` to the inline `style` object:

```tsx
        {/* LED visualizer */}
        <div className="flex items-end gap-[2px] h-10 w-full">
          {VIZ_H.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-[1px]"
              style={{
                height: isPlaying ? `${h}%` : "5%",
                backgroundColor: accent,
                opacity: isPlaying ? 0.75 : 0.2,
                transformOrigin: "bottom", // Ensures scaling happens from the bottom up
                ...(isPlaying ? {
                  animationName: "verticalPulse",
                  animationDuration: `${0.35 + (i % 5) * 0.08}s`,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                  animationDirection: "alternate",
                  animationDelay: `${(i * 0.04).toFixed(2)}s`,
                } : {}),
              }}
            />
          ))}
        </div>
```

### 3. Center Short Track Titles in `PopoutWidget.tsx`
Short track titles are left-aligning because the wrapper `div` is a flex container without horizontal centering.

Locate the track info block (around lines 81-95). Dynamically add `justify-center` to the flex container if the title is short (not scrolling):

```tsx
        {/* Track info */}
        <div className="w-full text-center space-y-1">
          <span className="text-[8px] uppercase tracking-[0.25em] block" style={{ color: accent }}>
            NOW PLAYING
          </span>
          <div className={`overflow-hidden mask-marquee h-[18px] flex items-center ${isLongTitle ? "" : "justify-center"}`}>
            <p className={`text-[13px] font-black text-white uppercase tracking-wide whitespace-nowrap ${isLongTitle ? "animate-marquee" : ""}`}
              style={isLongTitle ? { animationDuration: "14s" } : undefined}>
              {isLongTitle ? `${trackTitle}     ${trackTitle}` : trackTitle}
            </p>
          </div>
          <p className="text-[9px] text-white/35 uppercase tracking-widest truncate">
            {trackArtist}
          </p>
        </div>
```

---

## Verification & Deployment Plan
1. Run `npm run build` to verify compilation.
2. Open the Popout Player and verify:
   * **LED Visualizer**: Animates up and down smoothly when playing, and sits flat/dim when paused.
   * **Text Centering**: Short track titles are perfectly centered, while long titles continue to scroll.
3. Run the deploy script once verified:
   ```bash
   bash deploy.sh "fix: popout widget visualizer animation and track text centering"
   ```
