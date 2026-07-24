# WJRN Jacewon Radio Network — Claude Code Context

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
| `/about-wjrn` | `AboutWjrn` (team page) |

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
- **No hover lift/grow effect and no hover-triggered border/glow** on the card, in any state — explicitly requested and removed (including a brand-color blur glow behind the platter on `isActive` that survived several unrelated edits before being caught and removed — check for stray `blur-2xl`/`blur-3xl` glow divs here if touching this component). **A plain static `shadow-[0_20px_40px_rgba(0,0,0,0.45)]` is the one exception** — added 2026-07-25 for visual consistency with the hero player and About page headshots, which all share the same shadow value. Still no hover-triggered shadow changes.
- All top-level cards on the homepage (station cards + Twitch module) use `rounded-2xl` uniformly — not `rounded-3xl`.

## Twitch section — cabinet + knockout video window (`TwitchScheduleRetro.tsx`)

Same faceplate-with-knockout technique as `public/player/wjrn-receiver-front-ko.png` (see below), applied to the Twitch live section. Assets in `src/assets/images/`: `twitch-card-bg.png` / `twitch-card-bg-ko.png` (desktop, 923×388) and `twitch-card-bg-mobile.png` / `twitch-card-bg-ko-mobile.png` (mobile, 582×657, screen on top / content below).

- The **non-KO** variant (opaque glass) is the base state; the **KO** variant (real alpha-transparent cutout, found via pixel search — not just visually white) swaps in once `isLiveActive` is true, revealing the Twitch Embed SDK video mounted underneath at the exact same `SCREEN_WINDOW`/`MOBILE_SCREEN_WINDOW` coordinates.
- `isLiveActive` comes from the real Twitch Embed SDK `ONLINE`/`OFFLINE` player events (`embed.getPlayer().addEventListener(...)`), not a schedule-based guess.
- **Responsive breakpoint, not responsive text-shrinking**: below 768px (`DESKTOP_BREAKPOINT_QUERY`, tracked via `window.matchMedia` + a `isDesktopLayout` state, not CSS `hidden`/`block`) the component renders an entirely different mobile JSX tree with the mobile graphic. This matters because the desktop graphic's wide 2.38:1 aspect ratio physically runs out of height for the schedule list at anything narrower — cramming smaller text into it was tried first and hit a hard floor. The `isDesktopLayout` matchMedia approach (rather than CSS-hiding both trees) means only one Twitch Embed ever mounts at a time — mounting two hidden live video embeds simultaneously would double bandwidth for nothing.
- The "JOIN THE LIVE CHAT" button sits **inside** the cabinet frame, in the blank space directly below the screen window (`JOIN_BUTTON_ZONE`), not below the whole card — this was a repeated point of confusion during development (the card's total height includes a lot of blank cabinet below the screen before the frame's bottom edge).
- **No hover effect and no border** on `#twitch_schedule_module`, matching the station cards.

**Debugging pattern that mattered repeatedly in this redesign**: when the user reports a visual bug that a local dev-server screenshot can't reproduce, check the *actual deployed* `radio.jacewonmusic.com` with a real Playwright screenshot before assuming the user is looking at a stale page — but also don't assume your own measurements are correct just because a screenshot "looks right" at one viewport; the real bugs turned out to be (a) an unmeasured/eyeballed asset position that was simply wrong, and (b) content overflowing at viewport widths (768–1279px) that hadn't been tested, not caching or user error. Test multiple realistic widths, not just one.

## About WJRN team busts (`AboutWjrn.tsx`)

Each team member card shows a sculpted terracotta bust (transparent-background PNG, `src/assets/images/bust-{jace,cindy,phil}-{default,alt}.png`) instead of a headshot photo (photos were tried first, then removed 2026-07-24 in favor of the busts alone). Interaction model:

- **Click (mousedown, whether or not it turns into a drag) toggles default ↔ alt pose** — `clickStage` state, `% 2`. This is intentional: grabbing a bust to manually turn it also reveals the alt pose in the same motion, so the user discovers the alt exists just by interacting with the tilt. A second click flips back.
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
Sits between the header and the vintage receiver embed on the homepage. Big chunky `font-display` quote (gold `“`/`”` bookend glyphs via `#d7b158`, cream body via `#faf6f0`, matching the site's established off-white — see `TwitchScheduleRetro.tsx`'s `#faf6f0` headings) with a small white `text-[22px]` attribution glued to the end of the last line, and a sculpted bust image to the right using the **exact same ambient-tilt + click-drag interaction as the About page team busts** (`AboutWjrn.tsx`) — look-at-cursor `atan2` trig, drag overrides ambient until release — just a single bust instead of a per-index map since only one is ever shown at a time.

Deliberately sized down from the station landing pages' `lg:text-[90px]` headline to `lg:text-[72px]` — same responsive ladder otherwise (`text-[32px] sm:text-5xl md:text-6xl`) — per explicit request 2026-07-24, this hero shouldn't compete with a station page's own headline size.

`HERO_QUOTES` is a plain array (`{ quote, attribution, bust }`) — add entries as more busts get made. On mount a random entry is picked (`Math.floor(Math.random() * HERO_QUOTES.length)`); a `setInterval` (`ROTATE_MS`, 16s) then advances through the set with a `FADE_MS` (400ms) opacity crossfade. With only one entry today the rotation effect is a no-op by design (`HERO_QUOTES.length < 2` early-returns) rather than dead code — it's already wired for whenever a second quote/bust is added, no rewiring needed.

Click (or the mousedown that starts a drag) toggles default &lt;-&gt; alt pose, same as the About page team busts — `clickStage` here is keyed per quote index (`Record<number, number>`) rather than per-team-member, so rotating to a different quote doesn't lose whichever pose was last showing for a quote you'd already toggled.

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

### Homepage Activation
Opened from the `NebulaHomepage` right-hand column using the "Activate Vintage Experience" button component (`wjrn-vintage-exp-button.png`). Clicking it spawns the player at `/player/?popout=true` in a dedicated `1280x443` popup window using:
```javascript
window.open(
  'https://radio.jacewonmusic.com/player/?popout=true',
  'WJRN',
  'width=1280,height=443,resizable=no,scrollbars=no'
)
```

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

