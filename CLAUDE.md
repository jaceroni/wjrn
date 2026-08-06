# WJRN Online Radio Network — Claude Code Context

## What this project is
A self-hosted independent internet radio SPA for **radio.jacewonmusic.com**. Three 24/7 streaming stations plus on-demand tribute podcast episodes. Built by Jace (Jacewon) — Creative Director background, deep DJ/radio roots.

---

## Stack
- **React + TypeScript + Vite + Tailwind CSS v4**
- Hosted on **DreamCompute VPS** (Ubuntu), `208.113.165.231`
- **AzuraCast** (Docker) runs the streams and podcast feeds on port 8443
- **Nginx** serves the static SPA and proxies everything else to AzuraCast

---

## Deployment — ALWAYS do this after every code change, no exceptions

```bash
bash deploy.sh
```

This builds locally, rsyncs `dist/` to the VPS, syncs nginx config, and reloads nginx. **Once edits are agreed upon in a session (the user has confirmed the change or asked for it directly), make the edits and then run `deploy.sh` as part of finishing the task — no need to ask for confirmation each time.** Claude Code handles the coding and deployment as one continuous process.

SSH key: `/Users/jacebrown/Dropbox/Jacewon/Radio/newradiokey.pem`  
Web root on server: `/var/www/wjrn-landing`

---

## Routing

The app is a **client-side SPA** — no React Router. Navigation uses `history.pushState` + a custom `spa-navigate` event so the React tree (and audio stream) never unmounts.

**CRITICAL**: Always use `navigate(path)` from `src/navigate.ts` for internal links. **Never use bare `<a href>` for internal navigation** — it causes a full page reload, destroying the PlayerProvider and stopping any audio playback.

```ts
import { navigate } from "../navigate";
// Usage: onClick={(e) => { e.preventDefault(); navigate("/the-rock-garden"); }}
```

`App.tsx` listens for `popstate` and `spa-navigate` events and swaps the view component without unmounting the tree.

**Navigating must never interrupt whatever's currently playing, on any page.** E.g. if Rock Garden is playing and the user goes to the About page then clicks Home/the logo, playback must keep going — don't add a `stopPlayback()` call to nav-link handlers to "fix" some other homepage-specific issue (tried and reverted 2026-07-24; the actual ask turned out to need a vintage-player preset button instead, not a playback reset tied to navigation).

### URL → Component map
| URL | Component |
|-----|-----------|
| `/` | `AppRetro` → `NebulaHomepage` (main homepage) |
| `/the-rock-garden` | `StationLanding` (stationId: `rock_garden`) |
| `/bridge-city-hang-suite` | `StationLanding` (stationId: `bridge_city`) |
| `/the-golden-boombox` | `StationLanding` (stationId: `golden_boombox`) |
| `/about` | `AboutWjrn` (team page; renamed from `/about-wjrn` 2026-08-06 — nginx 301-redirects the old URL) |

Nginx has explicit `location` blocks for each of these that serve `index.html`.

---

## Key files

```
src/
├── App.tsx                          # SPA router + PlayerProvider wrapper
├── navigate.ts                      # navigate(path) SPA helper
├── AppRetro.tsx                     # Homepage state management → renders NebulaHomepage
├── types.ts                         # Station, NowPlaying, RadioConfig interfaces
├── index.css                        # Shared keyframes (lava lamp, logo hover, marquee)
├── context/
│   └── PlayerContext.tsx            # ALL audio state — live + on-demand
└── components/
    ├── NebulaHomepage.tsx           # Full homepage UI (hero player embed, station cards, Twitch)
    ├── StationLanding.tsx           # Per-station landing page + on-demand episode feed
    ├── AboutWjrn.tsx                # About WJRN page (team grid)
    ├── MiniPlayer.tsx               # Persistent bottom bar player
    ├── TwitchScheduleRetro.tsx      # Twitch embed + weekly schedule
    └── AudioVisualizer.tsx          # Waveform visualizer component
```

---

## Audio architecture — PlayerContext

`src/context/PlayerContext.tsx` is the **single source of truth for all audio**. Both `AppRetro` and `StationLanding` consume it via `usePlayer()`. It handles:

- Live stream playback (`toggleStation`)
- On-demand episode playback (`playEpisode`)
- Seek controls (`seekBackward`, `seekForward`, `seekToStart`)  
- Azuracast now-playing metadata polling (all stations, every 15s)
- Time tracking for on-demand (`onDemandCurrentTime`, `onDemandDuration`)

### Critical rule — play/pause during on-demand
**Always use `togglePlayback()` for play/pause when on-demand is active.** Using `toggleStation()` clears `onDemandItem` and starts the live stream instead.

```
isOnDemand === true  →  use togglePlayback()
isOnDemand === false →  use toggleStation(stationId)
```

This applies in: `MiniPlayer`, `StationLanding` player card, `NebulaHomepage` phone player.

`MiniPlayer`'s center station logo and its "Go to this station" link both `navigate()` to that station's landing page (logo click was previously dead — fixed 2026-07-24).

### `wantsPlaybackRef` — the guard that makes pause actually stick
Every `<audio>` element created in `toggleStation`/`playEpisode` has an `oncanplay` handler that retries `audio.play()` (needed because the very first `.play()` call right after `.load()` often fails while the stream is still buffering). A live stream keeps buffering — and re-firing `canplay` — even while genuinely paused, so without a guard that retry silently un-pauses playback moments after the user pauses: `audioState` flips back to `"playing"` while whatever set `activeStationId` to `null` (the live-station pause path) never gets told to undo that, leaving the two out of sync (fixed 2026-07-24 — this is what caused MiniPlayer's pause button to "flicker" back to playing, and the vintage player embed to stay stuck showing "paused" with a dead ticker while the VU meter kept moving for real, since `analyserRef` reflects actual audio state, not React state). `wantsPlaybackRef` (a plain ref, not state — it must be readable synchronously inside the `oncanplay` closure) tracks *intent*: set `true` on every play/resume path, `false` on every pause/stop/ended path, and `oncanplay` no-ops unless it's `true`. If you add a new way to start or stop playback, set this ref there too or the same desync can reappear.

That fix alone introduced a second bug (fixed same day): `wantsPlaybackRef` is one ref shared across every `<audio>` element ever created, not per-element. Pause immediately followed by play tears down the old element and creates a new one, but a late `canplay` event can still land on the **old, already-torn-down** element after the ref has flipped back to `true` for the new one — it calls `.play()` on itself (empty `src` after teardown), fails, and its `.catch()` sets global `audioState` to `"error"` a beat after the new element set it to `"connecting"`/`"playing"`, making the just-clicked play button silently do nothing. Every handler in `toggleStation`/`playEpisode` (`onplay`, `onplaying`, `onwaiting`, `oncanplay`, `onerror`, the initial `.play().then()`, and on-demand's `onended`/`ontimeupdate`) now closes over an `isCurrent = () => audioRef.current === audio` check and no-ops if it's no longer the live element. Any new handler added to these audio elements needs the same `isCurrent()` guard, not just the `wantsPlaybackRef` one — they protect against two different races.

### On-demand exports from PlayerContext
```ts
formatTime(seconds)        // exported utility — "1:23:45"
OnDemandItem               // exported type
```

---

## Stations

| stationId | Name | AzuraCast station # | Color | Tailwind class |
|-----------|------|---------------------|-------|----------------|
| `rock_garden` | THE ROCK GARDEN | 2 | `#74b338` | `text-emerald-400` |
| `bridge_city` | BRIDGE CITY HANG SUITE | 4 | `#ff0066` | `text-pink-400` |
| `golden_boombox` | THE GOLDEN BOOMBOX | 3 | `#e2ac00` | `text-yellow-400` |

Stream URLs: `https://radio.jacewonmusic.com/listen/{shortcode}/radio.mp3`

### Podcast RSS feeds (on-demand tributes)
Fetched in `StationLanding.tsx` on mount. Public — no auth required.
- Rock Garden: `https://radio.jacewonmusic.com/public/2/podcast/1f163acc-8bf3-6530-930d-97733b708762/feed`
- Bridge City: `https://radio.jacewonmusic.com/public/4/podcast/1f163af9-33ea-6eb0-a61f-152390e696af/feed`
- Golden Boombox: `https://radio.jacewonmusic.com/public/3/podcast/1f163b5a-9eb7-6bc4-b5cd-43d7c7b481e2/feed`

### Listener counts are fake (intentionally)
Real Azuracast listener totals are low this early on, so `PlayerContext.tsx` overrides them with `fakeListenerCount(stationId)` — a deterministic function of wall-clock time (not `Math.random()` per render), bounded to roughly 50–150, with a different phase per station so they don't move in lockstep. It's a continuous function of time specifically so a page refresh a few seconds or minutes later shows a number close to what was there before, while still drifting naturally over longer stretches. Applied in three places: `INITIAL_METADATA` (module-load fallback), the pre-live mock-tick effect, and the real Azuracast fetch handler (replaces `azStation.listeners.total` outright — real online/offline status and now-playing metadata are untouched, only the listener number is faked). `totalListeners` (sum of the 3 advertised stations, excluding the unlisted `wjrn` default stream) is exposed via context and drives the "Broadcasting (icon) X Listeners" line in the header on all three pages (replaced "Live From California" 2026-07-24).

---

## Design system

**Brand accent**: `#d7b158` (gold) — used for WJRN elements site-wide (updated 2026-07-24 from `#b5945b`; more accessible on dark backgrounds). If you find a stray `#b5945b` it's stale — replace it.
**Body/heading text color**: `#f3ede2`, not stark white and not any other near-white — sitewide, every page, every viewport (changed 2026-07-24 to complement the logo's "Ink" brand-guide color). This took **two passes**: the first pass only replaced literal Tailwind `text-white`/`text-white/NN` classes across every component (`NebulaHomepage`, `StationLanding`, `AboutWjrn`, `HeroQuote`, `MiniPlayer`, `PopoutWidget`, `MobileNavOverlay`, `TwitchScheduleRetro`) with `text-[#f3ede2]`/`text-[#f3ede2]/NN`. A second pass was needed the same day after the user pointed out it wasn't actually complete — `#faf6f0` (a separate off-white already in use for headings in `TwitchScheduleRetro.tsx` and the quote body in `HeroQuote.tsx`, predating this rule and previously documented as "the site's established off-white") and a hardcoded `"#ffffff"` JS fallback string in `MiniPlayer.tsx` (`accentColor`, used when no station has ever been active) were both missed because neither is the literal string `text-white` — **any near-white text color needs to collapse to this one value, not just the Tailwind white utility.** Tailwind supports the slash-opacity modifier on arbitrary hex values already (same pattern as `bg-[#0c0908]/95` elsewhere in this codebase) — an `#f3ede2` at some opacity (e.g. `/60`) is expected to show up in devtools as an 8-digit hex like `#f3ede299` (0x99 ≈ 60%); that's the same color at reduced alpha, not a different stray value. **Scoped to text color only** — `bg-white/NN`, `border-white/NN`, `via-white`/`from-white`/`to-white` (gradient dividers), and the logo's own always-white filter (`.logo-base`, `filter: brightness(0) invert(1)`) were deliberately left untouched. If you add new text color, use `#f3ede2` (or `text-[#f3ede2]/NN` for a muted variant) — don't reach for `text-white`, a hex white, or any other off-white/cream value.
**Fonts**: `font-display` = Montserrat (headlines), `font-mono` = JetBrains Mono (UI labels)  
**Background**: flat `#120e0b` ("WJRN surface" color) on the homepage, About page, and station landing pages (station pages layer their own per-station radial mesh gradient on top). All three also render a tiled damask pattern on top of that base color — see below.

### Tiled background pattern (Homepage, About, Station pages)
`wjrn-tile-bg-1a.png` (neutral gold) on Home/About, `wjrn-tile-bg-{trg,bchs,gbs}.png` (station-tinted) per station page — all 618×618, in `src/assets/images/`. **Rendered as an SVG `<pattern>`, not a CSS `background-image: repeat`** — the CSS approach showed a persistent faint seam between tiles from browser texture-sampling at tile boundaries even though the source PNGs are pixel-perfectly seamless (verified via pixel sampling). The fix that actually worked:
```jsx
<pattern id="..." x="0" y="0" width="618" height="618" patternUnits="userSpaceOnUse" overflow="visible" style={{ overflow: "visible" }}>
  <image href={tileBg} x="-1" y="-1" width="620" height="620" style={{ imageRendering: "pixelated" }} />
</pattern>
```
Each tile overdraws 1px on all four sides (620×620 image inside a 618×618 cell). **`overflow="visible"` is required** — SVG `<pattern>` clips content to its own tile box by default, which silently defeats the overdraw if omitted (this was the actual bug the first two fix attempts missed).

### Shared CSS classes (`index.css`)
- `.animate-glow-one/two/three` — shared lava lamp blob animations
- `.animate-marquee` + `.mask-marquee` — scrolling text for long track titles (6%/94% edge fade via `mask-image`)
- `.logo-base` / `.logo-white-reveal` — logo always-white treatment (no hover distortion effect — removed 2026-07-21)
- `@keyframes verticalPulse` — used by phone visualizer bars
- `@keyframes platterBackspin` — one-shot counterclockwise turn, see station cards section below
- `button:not(:disabled) { cursor: pointer; }` — **Tailwind v4 preflight dropped the old default** that gave `<button>` a pointer cursor (present in v3, gone in v4). This restores it site-wide; don't assume a bare `<button>` shows a pointer cursor without this rule. `<a href>` is unaffected either way (browser default, not CSS-dependent).

### Lava lamp blobs / any rotating-via-CSS-transform element (anti-flicker rules)
Always include on animated blob divs, and on anything rotated via CSS `transform` (platter, tonearm, etc.):
- `will-change: transform`
- `backface-visibility: hidden`
- `transform: translateZ(0)` **only if it's not itself the thing being animated** — a CSS animation's keyframes replace the `transform` property outright while running, so a static inline `transform: translateZ(0)` gets clobbered the instant the animation starts (exactly when you need it). Bake `translateZ(0)` into the keyframes themselves instead if the element has a custom animation; for Tailwind's built-in `animate-spin` (can't edit its keyframes), `will-change`/`backface-visibility` alone still help.
- Use `px` blur values, **not** `vw` (vw recalculates every scroll frame)

This class of bug shows up as a visible size "pop" right when a rotation starts/stops — the browser promotes/demotes the element to its own GPU compositing layer at that moment, and the promotion itself is what reads as sudden growth. Note this is a *mitigation*, not a complete fix for blur: any non-zero rotation of a raster image via CSS forces pixel resampling, which softens edges — there is no CSS-only way to keep a continuously-rotating bitmap perfectly crisp (tried and reverted 2026-07-24 on the About page busts: reducing angle/increasing perspective distance helped only marginally, not worth the added complexity).

---

## Station cards — vintage turntable design (`NebulaHomepage.tsx`)

Each of the 3 station cards on the homepage is a vintage turntable cabinet graphic with functional overlays, not a plain gradient card. Assets live in `src/assets/images/`:

- `station-card-cabinet.png` (388×588, full cabinet incl. blank lower "drawer" where card content sits)
- `station-card-tonearm.png` (80×277)
- `station-card-platter-{trg,bchs,gbs}.png` (266×267, one per station, includes the vinyl label logo)

All overlay positions are **percentages measured against the native cabinet PNG**, defined as constants near the top of `NebulaHomepage.tsx` (`PLATTER_POSITION`, `TONEARM_POSITION`, `TONEARM_TRANSFORM_ORIGIN`, `TITLE_ZONE`, `PLAYER_ZONE`) — this lets the whole graphic scale responsively with card width. The cabinet PNG is drawn with a subtle seam splitting its lower drawer into two sub-panels; `TITLE_ZONE` floats centered in the smaller upper one, `PLAYER_ZONE` (now playing box, metrics, learn more) centers in the larger lower one.

**Tonearm mechanics**: `TONEARM_TRANSFORM_ORIGIN` (`66.25% 22.2%`) is a pivot dot baked into both the cabinet PNG (white dot) and the tonearm PNG (black dot) — found via alpha-channel pixel search, not eyeballed. `TONEARM_PLAYING_DEG` (currently `27`) is the rotation that lands the headshell on the vinyl grooves (not the label) — this was tuned empirically after the first two guesses (45°, then -45°) over/undershot.

**Hover vs. click behavior** (updated 2026-07-24):
- Hovering a card when **not** playing triggers a one-shot "backspin" — the platter does a single quick counterclockwise turn (`@keyframes platterBackspin`, -360deg, ease-out) like a record being spun back by hand, then rests (a full -360 turn lands at the same visual orientation, so there's no snap when it ends). This is JS-driven (`backspinningStations` state, set on `onMouseEnter`, cleared on the animation's own `onAnimationEnd`), **not** a pure CSS `:hover` animation — that was tried first and got cut off if the cursor left before the animation finished. State is keyed per-station so backspinning one card can't cancel another's still-running animation.
- Clicking is what swings the tonearm and starts real playback (`isSpinning = isActive && audioState === "playing"` drives both the tonearm rotation and the continuous forward `animate-spin`, which persists after mouse-leave while genuinely playing). The backspin class only applies when `!isSpinning`; hovering a card that's actually playing does nothing extra.
- **No hover lift/grow effect and no hover-triggered border/glow** on the card, in any state — explicitly requested and removed (including a brand-color blur glow behind the platter on `isActive` that survived several unrelated edits before being caught and removed — check for stray `blur-2xl`/`blur-3xl` glow divs here if touching this component). **A plain static `shadow-[0_20px_40px_rgba(0,0,0,0.45)]` is the one exception** — added 2026-07-25 for visual consistency with the hero player and About page headshots, which all share the same shadow value. Still no hover-triggered shadow changes. The About page team busts and the homepage `HeroQuote` bust use the same `0 20px 40px rgba(0,0,0,0.45)` value too, just as `drop-shadow` (a CSS filter, not `box-shadow`) since they're irregular transparent PNGs rather than rectangular cards — kept in sync with this value 2026-07-24.
- All top-level cards on the homepage (station cards + Twitch module) use `rounded-2xl` uniformly — not `rounded-3xl`.
- No "SELECT THE STATION TO PLAY NOW:" label above the cards on mobile anymore (removed 2026-07-24) — it was a `md:hidden` mobile-only line sitting right above the card grid.
- **Track title marquee-scrolls when long, matching the vintage hero player's ticker** (added 2026-07-25) — `shouldMarqueeTitle = isSpinning && meta.trackTitle.length > 22` (same 22-char threshold as `PopoutWidget.tsx`'s `isLongTitle`). Reuses the existing shared `.animate-marquee`/`.mask-marquee` CSS (see `index.css`) rather than anything from the vintage player itself (that's a separate vanilla-JS ticker in `public/player/index.html`, not reusable here) — same seamless-loop technique already used in `PopoutWidget.tsx` and `StationLanding.tsx`'s on-demand title: duplicate the text with trailing spaces (`` `${title}     ${title}` ``) and animate `translateX` 0% → -50% on an infinite loop. Only marquees while `isSpinning` (this specific card's station is the one genuinely playing) — an offline/inactive card with a long title just truncates normally.

## Twitch section — cabinet + knockout video window (`TwitchScheduleRetro.tsx`)

Same faceplate-with-knockout technique as `public/player/wjrn-receiver-front-ko.png` (see below), applied to the Twitch live section. Assets in `src/assets/images/`: `twitch-card-bg.png` / `twitch-card-bg-ko.png` (desktop, 923×388) and `twitch-card-bg-mobile.png` / `twitch-card-bg-ko-mobile.png` (mobile, 582×657, screen on top / content below).

- The **non-KO** variant (opaque glass) is the base state; the **KO** variant (real alpha-transparent cutout, found via pixel search — not just visually white) swaps in once `isLiveActive` is true, revealing the Twitch Embed SDK video mounted underneath at the exact same `SCREEN_WINDOW`/`MOBILE_SCREEN_WINDOW` coordinates.
- `isLiveActive` comes from the real Twitch Embed SDK `ONLINE`/`OFFLINE` events, registered via `embed.addEventListener(Twitch.Player.ONLINE/OFFLINE, ...)` **on the `embed` instance itself, not on `embed.getPlayer()`** — this was the actual, confirmed root cause of a 2026-07-25/26 bug where `isLiveActive` never updated and the card stayed stuck on the countdown even while the channel was genuinely live (the card looks identical to "not live" either way since the opaque glass graphic covers the video regardless, so this read as "the stream just isn't showing"). The object `embed.getPlayer()` returns is a **playback-control proxy only** — confirmed by logging its actual prototype method list, which is exactly `play/pause/seek/setChannel/setMuted/setVolume/getMuted/getVolume/getChannel/getCurrentTime/getDuration/getQuality/isPaused/getPlayerState/...` and nothing event-related, no `addEventListener`, no `.on()`. An earlier fix attempt wrongly assumed this was a *timing* issue (`getPlayer()` "not ready yet" right at `VIDEO_READY`) and added a bounded retry loop calling `getPlayer().addEventListener(...)` up to 25 times — that retried the wrong object 25 times and always failed identically, which is what proved it wasn't a timing bug at all. If you ever need player-level events again, register them on `embed`, not on whatever `embed.getPlayer()` returns.
- Both `#twitch_schedule_module` wrappers (desktop and mobile) carry an explicit `aspectRatio` inline style (`923/388` desktop, `582/657` mobile) matching the cabinet PNGs' native dimensions — added because the console logged a Twitch autoplay warning ("requirements for autoplay were not met: style visibility"), and the container previously had near-zero rendered height for a moment before the `<img>` (sized via `w-full h-auto`, no width/height attributes) finished loading and established real height through normal layout. This alone did **not** fully fix the visibility requirement, though — see the viewport-visibility point below.
- **Twitch's autoplay explicitly requires the player to be visible in the viewport at creation time, not just correctly sized** (per Twitch's own embed docs: "minimum size requirements and visibility are necessary for autoplay to begin") — this card sits near the bottom of the homepage, well below the fold, so the embed was being created (and immediately attempting autoplay) long before a visitor ever scrolled it into view, reliably failing that check even while the channel was genuinely live (fixed 2026-07-25, same day as the aspect-ratio fix — that one alone wasn't sufficient). The embed-creation `useEffect` now wraps `loadSdkAndCreate()` (SDK script load + `new window.Twitch.Embed(...)`) in an `IntersectionObserver` (`threshold: 0.1`) on `embedContainerRef.current`, and only fires it once the container actually intersects the viewport — a no-op delay if it's already on-screen at mount, since `IntersectionObserver` reports current state immediately on `observe()`.
- **Responsive breakpoint, not responsive text-shrinking**: below 768px (`DESKTOP_BREAKPOINT_QUERY`, tracked via `window.matchMedia` + a `isDesktopLayout` state, not CSS `hidden`/`block`) the component renders an entirely different mobile JSX tree with the mobile graphic. This matters because the desktop graphic's wide 2.38:1 aspect ratio physically runs out of height for the schedule list at anything narrower — cramming smaller text into it was tried first and hit a hard floor. The `isDesktopLayout` matchMedia approach (rather than CSS-hiding both trees) means only one Twitch Embed ever mounts at a time — mounting two hidden live video embeds simultaneously would double bandwidth for nothing.
- The "JOIN THE LIVE CHAT" button sits **inside** the cabinet frame, in the blank space directly below the screen window (`JOIN_BUTTON_ZONE`), not below the whole card — this was a repeated point of confusion during development (the card's total height includes a lot of blank cabinet below the screen before the frame's bottom edge).
- **No hover effect and no border** on `#twitch_schedule_module`, matching the station cards.
- **The mobile tree has no "WEEKLY LIVE BROADCAST SCHEDULE" *label*** (removed 2026-07-24) — just the `Calendar` icon + that one heading line. The actual event list (`BROADCAST_EVENTS.map(...)`) is still there right below the description; an earlier pass wrongly dropped the whole list too and had to be corrected the same day. **`MOBILE_CONTENT_ZONE.top` was also bumped `44% → 48%`** to actually move the content block's start point down away from the screen window — removing content above it does nothing for that on its own, since the zone's `top` is a fixed anchor, not derived from its content's height; only changing `top` itself moves where the block begins.

**Debugging pattern that mattered repeatedly in this redesign**: when the user reports a visual bug that a local dev-server screenshot can't reproduce, check the *actual deployed* `radio.jacewonmusic.com` with a real Playwright screenshot before assuming the user is looking at a stale page — but also don't assume your own measurements are correct just because a screenshot "looks right" at one viewport; the real bugs turned out to be (a) an unmeasured/eyeballed asset position that was simply wrong, and (b) content overflowing at viewport widths (768–1279px) that hadn't been tested, not caching or user error. Test multiple realistic widths, not just one.

## Button graphics — Learn More / Join Chat / Listen Now (added 2026-08-06)

Three button surfaces across the site now render a real designed PNG (not a CSS gradient) as `backgroundImage` (`backgroundSize: "100% 100%"`, `backgroundRepeat: "no-repeat"`), with text/icon overlaid on top instead of inside it:
- **Homepage station cards** — "Learn More About This Station" (`NebulaHomepage.tsx`): `wjrn-home-player-button-{trg,bchs,gbs}.png`, text in that station's brand color (`textColorClass`, same green/pink/gold as elsewhere on the card).
- **Twitch card** — "Join the Live Chat" (`TwitchScheduleRetro.tsx`, both the desktop and mobile trees): `wjrn-home-player-button-twitch.png`, text in `#f3ede2` (sitewide off-white, not stark white).
- **Station landing pages** — "Listen to This Station Now" (`StationLanding.tsx`): `wjrn-station-page-player-button-{trg,bchs,gbs}.png` per `config.listenButtonBg`, text in plain black (kept black here — not switched to brand-color text like the homepage button, since that revision was homepage-specific).

**No hover-lift/border**, consistent with the rest of these cards, but there IS a deliberate hover cue on the text itself — landed after a few rejected rounds (elastic-bounce, blur-morph, and an over-intense same-color glow were all tried and cut; see `feedback_patterns` memory for the full story if touching this again):
- Homepage + Twitch buttons: on hover the text gets a **contrasting dark** `text-shadow` (`0_0_8px_rgba(0,0,0,0.9),0_0_2px_rgba(0,0,0,0.9)` — tight + wide layer combined) **and** scales up slightly (`scale-[1.0375]`, i.e. +3.75%). Critically, these two effects are split across **two different elements** — the outer `<a>` owns the `text-shadow` transition, an inner `<span>` wrapping the text+icon owns the `scale` transition — because animating both on one element via one `transition-[scale,text-shadow]` caused a visible jerk right at hover-start (GPU-composited `scale` vs. CPU-repainted `text-shadow` fighting each other). Never make a glow the same hue as the text itself (even at reduced opacity) — it just reads as blur, not a glow; the shadow color must contrast in lightness against the text.
- Station-page button: text stays plain black with **no** glow (a light off-white glow behind black text there didn't read well) — instead the Play/Pause icon **and** its label text scale up together as one unit (`scale-[1.0375]`) on hover, wrapped in a single `<span>` per playback state so they move as a group rather than independently.
- If you add `group`/`group-hover:` to a button that's nested inside another element that already has an unnamed `group` class (e.g. the station card or Twitch card wrapper both already use `group` for other hover effects), you MUST use a **named group** (`group/lm`, `group/chat`, etc. + matching `group-hover/lm:`) — a bare `group-hover:` is a plain CSS descendant selector with no "nearest ancestor" scoping, so hovering *anywhere* on the card would otherwise trigger the button's effect too.
- Tailwind v4 gotcha if tuning any of this further: `scale`/`translate`/`rotate` are their own independent CSS properties now, not sub-parts of `transform` — an arbitrary `transition-[transform,...]` will NOT animate a `scale-*` utility; list `scale` explicitly (`transition-[scale,...]`) or use the `transition-transform` utility, which already expands to `transform,translate,scale,rotate`.

## About WJRN team busts (`AboutWjrn.tsx`)

Each team member card shows a sculpted terracotta bust (transparent-background PNG, `src/assets/images/bust-{jace,cindy,phil}-{default,alt}.png`) instead of a headshot photo (photos were tried first, then removed 2026-07-24 in favor of the busts alone). Interaction model:

- **Hover reveals the alt pose; click no longer toggles anything** (changed 2026-07-24, superseding the click-toggle model described below in old commit history) — `hoveredBusts: Record<number, boolean>` set via `onMouseEnter`/`onMouseLeave` per bust index (plus `onFocus`/`onBlur` for keyboard-focus parity, since hover has no keyboard equivalent otherwise). Default pose always renders unless that specific bust is currently hovered. A click-and-drag tilt *while* hovering keeps showing the alt pose throughout — hover, not the click, is what's driving it, so nothing changes there — and it only reverts to default once the cursor genuinely leaves that bust's box, drag or no drag. If the cursor exits the box mid-drag (native `mouseenter`/`mouseleave` are bounding-box-based, independent of mouse-button state), the pose reverts to default immediately even though the tilt itself keeps tracking via the `window`-level drag listeners below — that's the specified behavior, not a bug to "fix" by trying to keep them in sync.
- **Ambient tilt**: every bust continuously turns toward the cursor's horizontal position, computed independently **per bust from its own screen position** (`Math.atan2(cursorX - bustCenterX, TILT_DEPTH)`), not one shared page-wide ratio — a bust far from the cursor changes only slightly per pixel of cursor movement since `atan2`'s slope flattens out at wide angles, while a nearby bust sweeps a wide range for the same movement. This was a deliberate redesign from an earlier single-shared-value version, specifically to get "closer reacts faster" as an emergent property of real angle-to-cursor math rather than a bolted-on damping system.
- **Click-and-drag overrides** the ambient tilt for that one bust only (tracked via `draggedIdx`/`draggedTiltDeg`, picks up from wherever the bust currently is — no jump on grab) while every other bust keeps following the ambient cursor position. Drag tracking is on `window`, not the element, so it keeps working if the cursor leaves the bust's box mid-drag.
- Bust images are sized via intrinsic `w-auto h-auto` + `max-w/max-h` (never `object-fit: contain`, which stretches raster images past their native resolution on wide screens and blurs them — this was a real bug, fixed 2026-07-24).
- Max tilt angle is 14° with `perspective(1000px)` — tuned down once already (24°→14°) for a "growing" GPU-layer-promotion artifact (see anti-flicker rules above) and blur was raised as a separate concern afterward, but further angle/perspective tuning didn't meaningfully help and was reverted — see the anti-flicker section note above before attempting this again.

---

## Social share image
`public/assets/images/wjrn-thumbnail.jpg` — referenced in `index.html` OG/Twitter meta tags. To update: replace the file, run `deploy.sh`. No code changes needed.

---

## AzuraCast operational notes

### Podcast episode metadata gets stripped on auto-generation
When "automatically generate podcast episodes from playlist uploads" is enabled, AzuraCast creates a podcast episode from the upload but **strips all metadata** (artwork, title, description). The workflow to add a new episode:
1. Upload track to station playlist normally.
2. AzuraCast auto-generates a blank podcast episode.
3. **Go to the Podcast screen in AzuraCast admin** and manually fill in the episode metadata (artwork, title, description, broadcast date).

If episode artwork shows as missing/placeholder in the on-demand section — this is always the cause.

### Azuracast API auth
- `/api/nowplaying` — **public**, no auth needed
- `/api/station/{id}/podcasts` — **protected**, requires API key (403 from external)
- Podcast RSS feeds at `/public/{id}/podcast/{uuid}/feed` — **public**, no auth needed

---

## Hero quote — rotating artist spotlight (`HeroQuote.tsx`)
Sits between the header and the vintage receiver embed on the homepage. Big chunky `font-display` quote (gold `“`/`”` bookend glyphs via `#d7b158`, cream body via `#f3ede2`, the sitewide body-text color — see Design System above) with a small `#f3ede2` attribution below it, and a sculpted bust image to the right using the **exact same ambient-tilt + click-drag interaction as the About page team busts** (`AboutWjrn.tsx`) — look-at-cursor `atan2` trig, drag overrides ambient until release — just a single bust instead of a per-index map since only one is ever shown at a time.

**Mobile sizing has been tuned several rounds, all deliberate, not oversights** — as of 2026-07-24: quote text is `text-[48px] sm:text-5xl md:text-6xl lg:text-[72px]`, attribution is `text-[17px] sm:text-[22px]` (`sm:` and up untouched throughout). History, in order: attribution 22→17 (25% off); quote 32→16 and attribution 17→9 (an over-correction — a request to shrink *only* the attribution by 50% accidentally also cut the quote, which hadn't been asked for); quote 16→24, attribution 9→11 (a correction, +50%/+25%); quote 24→48, attribution 11→17 (still too small on mobile, +100%/+50%). If asked to resize again, resize only the specific element named — don't assume "the hero text" means both the quote and the attribution together. The attribution is also `text-center sm:text-right` — centered on mobile to match the quote block's own `text-center lg:text-left`, right-aligned again from `sm` up to match the original mockup.

**Bust pose-swap has no opacity transition at all — it's instant, not a crossfade.** History: originally a 500ms dissolve, which read as an objectionable "flash" (two different, non-aligned poses cross-fading slowly makes a visible double-exposure ghost); cut to 120ms as a first fix; still visibly faded, so removed entirely per direct follow-up (2026-07-24) — the `style` transition on both pose `<img>`s is just `"transform 150ms ease-out"` now, no `opacity` term, so the `opacity-100`/`opacity-0` swap on hover snaps instantly while the tilt keeps its own separate smooth transition. Kept in sync between this component and `AboutWjrn.tsx`'s team busts, same as before.

**Superseded 2026-07-24, same day**: this used to be deliberately sized *down* from the station landing pages' `lg:text-[90px]` headline (to `lg:text-[72px]`, so the hero wouldn't compete with a station page's own headline). That decision was explicitly reversed later the same day — `StationLanding.tsx`'s `<h2>` now matches this component's sizing exactly (`text-[48px] sm:text-5xl md:text-6xl lg:text-[72px] font-extrabold leading-[1] font-display`), on the theory that headlines should read as one consistent system across the site rather than the hero deliberately standing down. If you're asked to touch either headline's sizing again, keep both in sync unless told otherwise — don't silently let them drift back apart.

`HERO_QUOTES` is a plain array (`{ quote, attribution, bust, bustAlt }`) — add entries as more busts get made (Pete Rock, Bob Dylan, Linda Ronstadt as of 2026-07-24). On mount a random entry is picked (`Math.floor(Math.random() * HERO_QUOTES.length)`); a `setInterval` (`ROTATE_MS`, 16s) then live-cycles through the set with a `FADE_MS` (400ms) opacity crossfade while the page stays open — a deliberate choice over reload-only rotation, to match the site's "always-on broadcast" feel; the `HERO_QUOTES.length < 2` early-return only matters if the array is ever back down to a single entry. Clicking the headline text (not the bust — that's the tilt/drag target) manually advances to the next quote.

**Auto-rotate pauses entirely while the cursor is anywhere in the section** (`isHovering`, set via `onMouseEnter`/`onMouseLeave` on the outer `<section>` — covers both the quote text and the bust, since they're both children of it) — added 2026-07-24 so a slow reader, or someone busy fiddling with the bust tilt, doesn't glance back to find the quote already changed with no way to get back to it. Resumes with a fresh `ROTATE_MS` countdown the moment the cursor leaves (not a resumed partial one — simpler, and the interval is only ever created while `!isHovering` in the first place, via the effect's dependency on `isHovering`). Clicking the headline no longer needs to separately manage the timer either: the cursor is necessarily still hovering right after a click, so it's already paused by this same mechanism until the cursor actually leaves.

**`quote` is one plain, un-broken string — do not hand-split it into a `quoteLines` array again.** That was tried (2026-07-24) specifically to force the attribution onto the same baseline as the quote's last line, but every hand-picked line-break budget eventually produced its own bad wrap somewhere (an orphaned single word stranded alone on a line) — tuning the character budget just moved the problem, it didn't remove it. Explicitly reverted per direct request the same day ("stop breaking the quote"). The attribution now lives on its own guaranteed-separate line instead: a single `<br/>` *after* the whole quote (never inside it) followed by a `block text-right` span, so it's simply below the quote, right-aligned, independent of wherever the quote itself happens to naturally wrap.

The `<section>` root carries `-mt-[31px] md:-mt-[14px]` — a deliberate reduction of the page's global `gap-[70px]` flex-column spacing (see `NebulaHomepage.tsx`'s root div) specifically between the header and this section, not a stray leftover. `NebulaHomepage`'s gap is one uniform value shared by every top-level section, so pulling in just this one gap requires a negative margin on this component rather than touching the shared value (which would shrink spacing everywhere). The `md:` split exists because mobile and desktop were tuned to different targets on different days: desktop stayed at the original 20%-off value (`-14px` → 56px) from 2026-07-24, while mobile was tightened further (through two rounds, landing at 39px) as a target shared across all three pages' headers (see "Mobile header-to-hero spacing" below) — don't collapse these back into one unprefixed value.

Hover reveals the alt pose (`isBustHovering`, plain boolean — no per-index map needed since only one bust is ever on screen here), same interaction as the About page team busts — click no longer toggles anything, and a click-and-drag tilt while hovering keeps the alt pose showing throughout, only reverting once the cursor actually leaves the bust. See `AboutWjrn.tsx`'s note on this for the mid-drag-cursor-exit edge case, which applies here identically.

---

## Mobile header behavior (all pages) + full-screen nav (`MobileNavOverlay.tsx`)
Below `md` (768px), every page's header (`NebulaHomepage`, `StationLanding`, `AboutWjrn`) hides the center nav row and the desktop "Broadcasting / Listeners" block via `hidden md:flex` (pre-existing). The header wrapper is `justify-between` (not `justify-center`) at every breakpoint — on mobile this now spreads **three** visible items: a mobile-only Antenna icon (far left), the logo (center), and a mobile-only hamburger button (far right); on desktop it's the original logo/nav/listener-block three-up. All three mobile-only elements are `w-5 h-5`/`h-5` sized to match the mobile logo's own height and share the header's `items-center` row, so they land on the same vertical line by construction — no separate alignment logic needed.

- **Antenna** (`<Antenna className="w-5 h-5 text-red-500 animate-pulse" />`, `md:hidden`): a pared-down live-on-air signal for mobile — icon only, no "Broadcasting"/listener-count text (that stays desktop-only in its own block).
- **Hamburger** (`<Menu className="w-5 h-5" />` in a `<button>`, `md:hidden`): dispatches the same `wjrn:open-mobile-nav` custom event described below. This is now the **only** mobile menu trigger.
- **The logo always just navigates home now, at every breakpoint** (superseded 2026-07-25) — it used to double as the mobile menu trigger (tap logo → open overlay, since there was no visible affordance otherwise), but that wasn't discoverable, so a dedicated hamburger replaced it. If you're touching the logo's `onClick` again, it should be the plain `navigate("/")` handler each page's other nav links already use — don't reintroduce the matchMedia branch.
- **The logo inside the open mobile menu itself also navigates home** (added 2026-07-25) — `MobileNavOverlay.tsx`'s logo (top of the overlay) is wrapped in a `<button>` calling the same `go("/")` helper the "Home" link below it uses, closing the menu and navigating in one motion. It previously had no `onClick` at all (purely decorative), which meant tapping it just closed the menu via the backdrop's own click handler without going anywhere.

**Shared, not duplicated per-page**: `MobileNavOverlay` is mounted exactly once, in `App.tsx` alongside `MiniPlayer`, and manages its own open/closed state internally via a `wjrn:open-mobile-nav` listener — the same custom-event-to-a-globally-mounted-listener pattern already used for `MiniPlayer`'s pop-out button (`wjrn:open-pip` → `App.tsx`'s `openPip`). Each page's hamburger button just fires that event; no `matchMedia` check is needed anymore since the button itself is already `md:hidden` in CSS, so it can only ever be clicked in the mobile layout to begin with. (An earlier version had the logo do a runtime `matchMedia(...).matches` check to decide navigate-vs-open-menu; that's gone now that a dedicated always-mobile-only hamburger exists.)

If you add a new top-level page with the same header pattern, copy the Antenna/logo/hamburger three-up and wire the hamburger to `window.dispatchEvent(new CustomEvent("wjrn:open-mobile-nav"))` — don't give the overlay its own local copy again.

The homepage's vintage player iframe embed (`NebulaHomepage.tsx`, the `hidden md:block` section right after `HeroQuote`) is hidden below `md` entirely — its tuning knob/tonearm/EQ hit zones are too small to hit reliably on a phone screen. Fine from `md`/tablet up. Don't re-show it below that breakpoint without rethinking the controls' hit-zone sizes first.

In `MobileNavOverlay.tsx`, the "Our Stations" eyebrow label is `text-[#d7b158]` (brand gold), not a muted white — changed 2026-07-24 for consistency with the gold eyebrow/accent text used elsewhere (station cards, nav dividers, etc).

### Mobile header-to-hero spacing — kept equal across all three pages
Below `md`, the gap between the header divider and each page's first content section is tuned to the same **39px** on `NebulaHomepage`, `StationLanding`, and `AboutWjrn` (2026-07-24: first unified at 52px, then cut a further 25% to 39px per a follow-up request — both rounds kept all three pages equal). Each page gets there differently because each had a different starting mechanism, so don't assume one shared class will work everywhere:
- `NebulaHomepage`: `HeroQuote`'s root `-mt-[31px] md:-mt-[14px]` against the page's `gap-[70px]` (70 − 31 = 39 on mobile; 70 − 14 = 56 unchanged on desktop).
- `StationLanding`: the hero grid section's `mt-[39px] md:mt-15` — this page never used the `gap-[70px]` pattern, it's a direct `margin-top` (`mt-15` = 60px was the pre-existing desktop value).
- `AboutWjrn`: the Hero section's `-mt-[31px] md:mt-0` against its own `gap-[70px]` (70 − 31 = 39 on mobile; `md:mt-0` cancels the offset back to the untouched 70px desktop gap).

If this ever needs to change again, update the mobile-side value on all three — they're independent classes, not a shared constant, since each page composes its gap differently.

**Separately**, the page-top clear space *above* the header itself (each page's root `pt-4 md:pt-6 lg:pt-8`) is `pt-[19px] md:pt-6 lg:pt-8` on mobile as of 2026-07-25 — a 20% increase from the original `pt-4` (16px → 19.2px, rounded to 19px), again mobile-only, again the same value on all three pages. `MobileNavOverlay.tsx`'s own logo row must be kept in sync with this value (`pt-[19px]`, not the original `pt-4`) — when the overlay's internal logo sits at a different vertical offset than the real header logo underneath, opening the menu reads as the logo visibly jumping a few pixels (caught and fixed 2026-07-25). If this page-top padding changes again, update both places.

The header's own `pb-6` (space between its content row and the divider line below it) is `pb-[22px]` on all three pages as of 2026-07-25 — a 10% cut from the original 24px, applied at every breakpoint (not mobile-only, unlike the spacing rules above).

---

## Parallax
`NebulaHomepage` has scroll-based parallax on the WJRN watermark, left/right side panels, and phone. **Disabled on mobile** via `if (window.innerWidth < 1024) return;` guard in the scroll handler. Preserve this guard when editing.

---

## WJRN Vintage Player — `public/player/`

A self-contained single-file HTML player at `radio.jacewonmusic.com/player/`. It is **not** part of the React SPA — it is a standalone HTML file with all CSS and JS inline. Deploy by running `bash deploy.sh` as normal (the `public/` directory is copied into `dist/` by Vite).

### Files
- `public/player/index.html` — the entire player (HTML + CSS + JS inline)
- `public/player/wjrn-receiver-front-ko.png` — faceplate PNG overlay (1280×443px). Automatically copied from `src/assets/images/wjrn-receiver-front-ko.png` by `deploy.sh` during the build process.
- `public/player/wjrn-player-thumbnail.jpg` — visual receiver thumbnail for social share/meta previews.

### Homepage embed
There is **no** "Activate Vintage Experience" button anymore — `wjrn-vintage-exp-button.png` in `src/assets/images/` is a leftover unused asset, not referenced anywhere in the code (verified 2026-07-25; if you find this asset, don't assume the button still exists). The player is embedded directly and always-visible: `NebulaHomepage.tsx`'s "Hero — Vintage Receiver Player Embed" section renders it as a plain `<iframe src="https://radio.jacewonmusic.com/player/?popout=true&sync=1">` inside a `w-full aspect-[1280/443]` box, `hidden md:block` (hidden on mobile — see "Mobile header behavior" section for why). The `?popout=true&sync=1` query params put it in the same popout-layout + cross-frame-sync mode described below, just permanently embedded rather than opened on demand.

- **Popout vs. Backdrop Modes**:
  - **Popout Mode** (`?popout=true` in URL): Disables the credenza backdrop, resets player coordinates to `left: 0; top: 0;`, and scales based on standard `1280x443` dimensions to fill the dedicated popup window.
  - **Backdrop Mode** (no query param): Renders a `1920x1080` room backdrop scene (`wjrn-player-backdrop.jpg`) and positions the receiver absolutely at `X: 320px, Y: 340px`, scaling the entire scene proportionally to fit any screen size.
  - **Drop Shadow**: In backdrop mode, a realistic double drop shadow (`box-shadow: 0 25px 45px rgba(0, 0, 0, 0.9), 0 10px 15px rgba(0, 0, 0, 0.7)`) is applied to `#player` to visually anchor the receiver to the credenza. The shadow is cleared (`box-shadow: none`) in popout mode.

### Design
- Fixed canvas: **1280×443 pixels**. All interactive elements are positioned absolutely at precise pixel coordinates matching knockout holes in the faceplate PNG.
- The faceplate PNG sits at `z-index: 2` over the content layer.
- All UI elements (art, VU meter, ticker, tuner tick, knob hit zones) are at `z-index: 1–4` behind or above the faceplate.

### Key coordinates (all `position: absolute` within `#player`)
| Element | left | top | width | height |
|---------|------|-----|-------|--------|
| Album art | 111 | 101 | 274 | 274 |
| VU meter canvas | 423 | 104 | 151 | 79 |
| Metadata ticker | 410 | 213 | 460 | 48 |
| WJRN preset hit | 884 | 213 | 98 | 48 |
| Tuner tick | computed | 133 | 6 | 38 |
| Tuning knob hit | 993 | 212 | 188 | 67 |
| Volume knob hit | 1015 | 285 | 74 | 79 |

### WJRN preset button
Added 2026-07-24 alongside a faceplate redesign that narrowed the metadata ticker to make room for it. Jumps straight to the unlisted 24/7 instrumental-only "WJRN" stream (`STATIONS[0]`, 89.1 MHz) regardless of what's currently tuned in — `goToStation(0)` if already playing/paused, `initAudio(0)` if the player hasn't started yet. Unlike the tuning knob/tuner screen (which cycle sequentially via `switchStation()`), this always targets index 0 directly.

### Stations
```javascript
const STATIONS = [
  { name: "WJRN", frequency: 89.1, stream: "https://radio.jacewonmusic.com/listen/wjrn/radio.mp3", api: "https://radio.jacewonmusic.com/api/nowplaying/wjrn" },
  { name: "The Rock Garden", frequency: 95.5, stream: "https://radio.jacewonmusic.com/listen/the_rock_garden/radio.mp3", api: "https://radio.jacewonmusic.com/api/nowplaying/the_rock_garden" },
  { name: "Bridge City Hang Suite", frequency: 102.7, stream: "https://radio.jacewonmusic.com/listen/bridge_city_hang_suite/radio.mp3", api: "https://radio.jacewonmusic.com/api/nowplaying/bridge_city_hang_suite" },
  { name: "The Golden Boombox Sessions", frequency: 105.9, stream: "https://radio.jacewonmusic.com/listen/golden_boombox_sessions/radio.mp3", api: "https://radio.jacewonmusic.com/api/nowplaying/golden_boombox_sessions" }
];
```

### Tuner tick position formula
- 88 MHz → X: 659px, 108 MHz → X: 1075px (416px / 20MHz = 20.8 px/MHz)
- `tickLeft = 659 + (freq - 88) * 20.8`

### Audio architecture
- Standard `<audio>` element with `crossOrigin="anonymous"`
- `AudioContext` → `AnalyserNode` (fftSize: 256) → `GainNode` → destination
- Separate `noiseGain` node for white noise static (procedural AudioBuffer, no external files). **Connects directly to `audioCtx.destination`, bypassing `outputSilencer`** (unlike `gainNode`, which routes through the silencer and is muted when `isSynced`) — the tuner static is a one-shot decorative effect on station change, not the actual stream, so there's no double-audio risk in letting it play even when this instance is embedded/synced on the homepage. If you ever hear "no static on the homepage embed" reported again, check this connection first.
- All audio initialized on first user click (browser autoplay policy)

### Cross-frame sync gotcha (`NebulaHomepage.tsx`'s `sendCurrentState`)
The effect that keeps this embed in sync with the real (audible) player used to send the iframe a `pause` message whenever the real audio was merely `"connecting"` (buffering) — not just when genuinely idle. Since every fresh play passes through a connecting phase, this raced against the iframe's own just-started local (muted) playback and paused it right after it started, leaving the embed stuck showing "paused" with a dead ticker until a second interaction (fixed 2026-07-24). The current logic only mirrors a pause when the real player is genuinely idle-while-loaded or fully stopped — never during `"connecting"`. If touching this effect, preserve that distinction; it's easy to reintroduce by adding a blanket `audioState !== "playing"` check back in.

### Interactions
- **Click anywhere** → init audio + start WJRN stream
- **Click artwork** → toggle play/pause
- **Volume knob click** → toggle mute/unmute
- **Tuning knob click** / **Tuner Screen click** → cycle to next station with static noise sequence
- **Loudness, Bass, Mid, Treble knobs** → interactive EQ cut / tube saturation filters
- **Power button click** → toggle mute/unmute (displays POWER – OFF / POWER – ON)

### Paused state UI
- Artwork: play icon (▶) or pause icon (⏸) overlay container `#art-overlay`
- Ticker: displays static centered "PAUSED – [STATION NAME]"

### Ticker Logic & Scrolling
- **Modes**: `A` = static centered text (pre-play, paused, tuning/volume alerts), `B` = metadata marquee, `C` = station description marquee.
- **Marquee Mechanism**: Seamless marquee loop measuring `el.scrollWidth` and duplicating text to fill the 460px width (was 569px before the 2026-07-24 faceplate redesign added the preset button — check for any other stray `569` literals if resizing again, there were three: initial `tickerX`, the repeat-count math, and the reset value in `setTickerScroll`).
- **Vertical Alignment**: Centered vertically via `display: flex; align-items: center;` combined with horizontal offsets.
- **Reset Prevention**: To prevent text from jumping back to the right side on the 15-second metadata polling interval, `setTickerScroll` checks `currentTickerText` and returns early if the mode and text have not changed.
- **Edge fade**: `#ticker-wrap` has a `mask-image`/`-webkit-mask-image` linear-gradient fade (`transparent 0%, #000 6%, #000 94%, transparent 100%`, matching `.mask-marquee` in the React app's `index.css`) so scrolling text softens into the background at the edges instead of clipping hard.

### Responsive Scaling
- Centered automatically in viewport using Flexbox.
- Scales proportionally on window resize based on viewport width & height using `Math.min(window.innerWidth / 1280, window.innerHeight / 443)` to prevent clipping on all screens.

