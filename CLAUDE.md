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

This builds locally, rsyncs `dist/` to the VPS, syncs nginx config, and reloads nginx. **Do not ask the user if they want to deploy — just do it.**

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

### URL → Component map
| URL | Component |
|-----|-----------|
| `/` | `AppRetro` → `NebulaHomepage` (main homepage) |
| `/the-rock-garden` | `StationLanding` (stationId: `rock_garden`) |
| `/bridge-city-hang-suite` | `StationLanding` (stationId: `bridge_city`) |
| `/the-golden-boombox` | `StationLanding` (stationId: `golden_boombox`) |

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
    ├── NebulaHomepage.tsx           # Full homepage UI (hero, phone player, station cards, Twitch)
    ├── StationLanding.tsx           # Per-station landing page + on-demand episode feed
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

---

## Design system

**Brand accent**: `#b5945b` (gold/tan) — used for WJRN homepage elements  
**Fonts**: `font-display` = Montserrat (headlines), `font-mono` = JetBrains Mono (UI labels)  
**Background**: `#050201` homepage, station pages have per-station dark bg  
**Logo hover effect**: SVG `feTurbulence` + `feDisplacementMap` filter defined in `index.html` as `#logo-interference`. Applied via `.group-logo:hover { filter: url(#logo-interference) }` in `index.css`.

### Shared CSS classes (`index.css`)
- `.animate-glow-one/two/three` — shared lava lamp blob animations
- `.animate-marquee` + `.mask-marquee` — scrolling text for long track titles
- `.logo-base` / `.logo-white-reveal` / `.group-logo` — logo hover system
- `@keyframes verticalPulse` — used by phone visualizer bars

### Lava lamp blobs (anti-flicker rules)
Always include on animated blob divs:
- `will-change: transform`
- `backface-visibility: hidden`
- `transform: translateZ(0)`
- Use `px` blur values, **not** `vw` (vw recalculates every scroll frame)

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

## Parallax
`NebulaHomepage` has scroll-based parallax on the WJRN watermark, left/right side panels, and phone. **Disabled on mobile** via `if (window.innerWidth < 1024) return;` guard in the scroll handler. Preserve this guard when editing.
