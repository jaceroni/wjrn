# TASK: Build Standalone "Vintage Receiver" Popout Player v3

This task involves two parts:
1. **URL & Infrastructure Update**: Ensure the player directory is `public/player/` (served at `https://radio.jacewonmusic.com/player/`), Nginx routing is updated, and paths in `CLAUDE.md` are synchronized.
2. **Build Receiver v3**: Build the standalone receiver player inside `public/player/index.html` with advanced 1970s hardware emulation (EQ cut toggles, balance, mono summing, tube warmth saturation, mute toggle, 13 interactive hit zones, 3 player states, ticker modes/takeovers, and organic VU needle physics), integrated with responsive flex centering, aspect-ratio scaling, and first-click audio initialization fixes.

---

## Part 1: Directory Rename, Nginx, and Documentation

### 1. Rename Directory
* Ensure the player directory is renamed from `public/wjrn-player/` to `public/player/`. (Use `git mv public/wjrn-player public/player` if not already done).

### 2. Update Nginx Routing (`nginx-wjrn.conf`)
* Locate the vintage receiver location block (around lines 79-85).
* Replace `/wjrn-player/` references with `/player/` so Nginx serves the renamed folder for `https://radio.jacewonmusic.com/player/`:
  ```nginx
  # Vintage receiver standalone player
  location = /player {
      return 301 /player/;
  }
  location /player/ {
      root /var/www/wjrn-landing;
      try_files $uri $uri/index.html =404;
  }
  ```

### 3. Update Documentation (`CLAUDE.md`)
* In the section "Vintage Receiver Standalone Player — `public/player/`" (around line 170), rename all occurrences of `wjrn-player` to `player`.
* Update serving URL descriptions to `radio.jacewonmusic.com/player/`.

---

## Part 2: WJRN Receiver Player v3 HTML/CSS/JS Specifications

Build the entire player inside `public/player/index.html`. It must look and function like a physical 1970s hardware receiver component. There is no visible browser or media player chrome. Every control is diegetic.

### 1. Canvas, Coordinate Spec, and Responsive Scaling
* Sized exactly to **1280 x 443 pixels**. Position the faceplate PNG absolutely at `0,0` with `z-index: 2` to cover the full canvas.
* Place all live elements absolutely using the coordinates below, measured from the top-left corner of the 1280x443 canvas.
  * **Album art**: X: 111, Y: 101, W: 274, H: 274 (z-index: 1, behind the PNG knockout hole).
  * **Vibe Strength meter**: X: 423, Y: 104, W: 151, H: 79 (z-index: 3).
  * **Metadata ticker**: X: 410, Y: 214, W: 569, H: 48 (z-index: 3).
  * **Tuner band tick mark**: X: 659, Y: 149, W: 416, H: 7 (z-index: 3).
  * **Hit zones (all)**: positioned at z-index: 4.
* **Z-Index Bezel Rule**: Album art sits at `z-index: 1`, BELOW the PNG at `z-index: 2`. The PNG has a transparent knockout at the album art coordinates so that the art shows through and inherits the PNG's gold bezel and drop shadow naturally. Do not add any CSS border, shadow, or frame to the album art.
* **Responsive Scaling & Centering (Integrated Fix)**:
  * Style `html` and `body` to fill the viewport and center its content:
    ```css
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
      user-select: none;
      -webkit-user-select: none;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    ```
  * Style `#player-scaler` to fill the viewport and act as a flex container:
    ```css
    #player-scaler {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      position: relative;
    }
    ```
  * Style `#player` to be centered via relative positioning and prevent shrinking:
    ```css
    #player {
      position: relative;
      width: 1280px;
      height: 443px;
      cursor: default; /* Entire player is default cursor, only hit zones get pointer */
      transform-origin: center center;
      flex-shrink: 0;
    }
    ```
  * Calculate scale factor based on BOTH dimensions to maintain the 1280:443 aspect ratio without clipping:
    ```javascript
    function scalePlayer() {
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var scale = Math.min(vw / 1280, vh / 443);
      document.getElementById('player').style.transform = 'scale(' + scale + ')';
    }
    scalePlayer();
    window.addEventListener('resize', scalePlayer);
    ```

### 2. Interactive Hit Zones
All hit zones are invisible. Cursor changes to `pointer` on hover over hit zones only. Set `cursor: default` on the `#player` itself.

| # | Element | X | Y | W | H | Behavior |
|---|---|---|---|---|---|---|
| 1 | Tuner Screen | 411 | 90 | 766 | 104 | Click to cycle stations low to high. Also initiates playback on first load |
| 2 | Tuning Knob | 993 | 212 | 188 | 67 | Same behavior as Tuner Screen — cycles stations, initiates playback on first load |
| 3 | Album Art | 111 | 101 | 274 | 274 | Click to pause/resume stream |
| 4 | Metadata Ticker | 410 | 214 | 569 | 48 | Click to toggle between live track metadata and station description string |
| 5 | Jacewon Logo | 553 | 46 | 173 | 30 | Click to open radio.jacewonmusic.com in a new window — player unaffected |
| 6 | Volume Knob | 1015 | 285 | 74 | 79 | Single click anywhere = mute/unmute toggle |
| 7 | Bass Knob | 468 | 284 | 69 | 75 | Click to toggle bass cut on/off |
| 8 | Mid Knob | 606 | 285 | 69 | 72 | Click to toggle mid cut on/off |
| 9 | Treble Knob | 740 | 285 | 72 | 72 | Click to toggle treble cut on/off |
| 10 | Balance Knob | 878 | 285 | 75 | 75 | Click to cycle balance: Center → Left → Right → Center |
| 11 | Loudness Button | 416 | 291 | 28 | 28 | Click to toggle tube warmth saturation on/off |
| 12 | Mono Button | 416 | 343 | 28 | 27 | Click to toggle mono/stereo |
| 13 | Power Button | 1130 | 293 | 30 | 28 | Click to stop audio and close window instantly — no confirmation |

* **Phones jack** is decorative only. No interaction. No hit zone.

### 3. Station Configuration
```javascript
const STATIONS = [
  {
    name: "WJRN",
    frequency: 89.1,
    stream: "https://radio.jacewonmusic.com/listen/wjrn/radio.mp3",
    api: "https://radio.jacewonmusic.com/api/nowplaying/wjrn",
    description: "THIS IS WJRN – HOSTED BY JACEWON – BROADCASTING LIVE FROM CALIFORNIA – HOME OF THE ROCK GARDEN, BRIDGE CITY HANG SUITE, & GOLDEN BOOMBOX SESSIONS"
  },
  {
    name: "The Rock Garden",
    frequency: 95.5,
    stream: "https://radio.jacewonmusic.com/listen/the-rock-garden/radio.mp3",
    api: "https://radio.jacewonmusic.com/api/nowplaying/the-rock-garden",
    description: "THIS IS THE ROCK GARDEN – ALL VINYL CLASSIC ROCK, FUNK, BLUES & JAZZ – LIVE EVERY TUESDAY 7PM PACIFIC ON TWITCH.TV"
  },
  {
    name: "Bridge City Hang Suite",
    frequency: 102.7,
    stream: "https://radio.jacewonmusic.com/listen/bridge-city-hang-suite/radio.mp3",
    api: "https://radio.jacewonmusic.com/api/nowplaying/bridge-city-hang-suite",
    description: "THIS IS THE BRIDGE CITY HANG SUITE – GROWNFOLK R&B – LIVE EVERY WEDS 7PM PACIFIC ON TWITCH.TV"
  },
  {
    name: "The Golden Boombox Sessions",
    frequency: 105.9,
    stream: "https://radio.jacewonmusic.com/listen/golden-boombox-sessions/radio.mp3",
    api: "https://radio.jacewonmusic.com/api/nowplaying/golden-boombox-sessions",
    description: "THIS IS THE GOLDEN BOOMBOX SESSIONS – GOLDEN ERA & FUTURE CLASSIC HIP-HOP – LIVE EVERY FRIDAY 7PM PACIFIC ON TWITCH.TV"
  }
];
```

### 4. Player States
The player has three distinct states:

#### State 1 — Pre-playback (page just loaded, nothing playing yet)
* **Ticker**: Displays a static, non-scrolling centered message: `CLICK ARTWORK OR TUNER TO BEGIN PLAYBACK` (fixed, fully visible, no animation, no scroll).
* **Album art zone**: Displays a centered play icon (▶) floating over the album art area (semi-transparent dark circle background, `#f1e3c8` or `#23bf91` icon, ~60px diameter).
* **Vibe Strength needle**: Rests at center/idle position.
* **Tuner tick mark**: Positioned at WJRN frequency (89.1 MHz) immediately on load.
* Clicking album art, tuner screen, or tuning knob starts playback and transitions to State 2.

#### State 2 — Playing
* **Ticker**: Scrolls live metadata continuously left to right: `TRACK TITLE – ARTIST – STATION NAME –` (enters from right edge, ~20s per loop).
* **Album art**: Displays track artwork. Play icon is hidden.
* **Vibe Strength needle**: Active and audio-reactive.

#### State 3 — Paused
* **Ticker**: Displays static centered message: `PAUSED – [STATION NAME] –` (fixed, not scrolling, centered).
* **Album art**: Displays current artwork with a centered play (▶) or pause (⏸) icon overlay.
* **Vibe Strength needle**: Animates smoothly to rest position (far left).

### 5. Metadata Ticker Modes & Takeovers
* **Mode A (Static centered)**: Text is centered, not scrolling (used in pre-playback and paused states).
* **Mode B (Scrolling metadata)**: Continuous left-to-right scroll.
* **Mode C (Station description)**: Scrolls the station's description string. Toggle between B and C on ticker click.
* **Action Takeovers**: Display centered and static (Mode A style) for 2.5 seconds on interaction, then restore the previous mode. Messages:
  * Station change: `TUNING TO [frequency] MHz – [STATION NAME]`
  * Bass cut on/off: `BASS – CUT` / `BASS – RESTORED`
  * Mid cut on/off: `MID – CUT` / `MID – RESTORED`
  * Treble cut on/off: `TREBLE – CUT` / `TREBLE – RESTORED`
  * Balance states: `BALANCE – LEFT CHANNEL` / `BALANCE – CENTER` / `BALANCE – RIGHT CHANNEL`
  * Loudness on/off: `LOUDNESS – ON` / `LOUDNESS – OFF`
  * Mono on/off: `MONO – ON` / `STEREO – RESTORED`
  * Mute toggle: `MUTED` / `VOLUME – RESTORED`
  * Paused: `PAUSED – [STATION NAME]`

### 6. Album Art
* Position X:111, Y:101, W:274, H:274, z-index: 1.
* Crossfade old to new art over 800ms. Fallback to solid `#1a1a1a` on missing art.
* Play/pause overlay: Center semi-transparent dark circle background (~60px diameter) with play icon (▶) visible in State 1 and State 3. Smooth opacity transition (300ms) on show/hide.

### 7. Vibe Strength Meter (Needle)
* Canvas/SVG sized 151x79. Needle pivots from bottom-center.
* Sample mid and low-mid frequency bands specifically (kick/bass/snare range ~60Hz–500Hz) using `getByteFrequencyData()`.
* **Needle Physics**: Fast attack, slow weighted decay, idle range 2–3, peaks 4–5 on strong transients, organic micro-drift at idle (jitter). Drops smoothly to rest (far left) on pause and tuning.
* Needle color: `#ff3333`, width: 2px.

### 8. Tuner Band Tick Mark
* 2px-wide, 7px-tall red vertical tick.
* Linear position: 88 MHz (left edge X: 659) to 108 MHz (right edge X: 1075).
* On station switch: animate tick sliding to new position over 600ms ease-in-out.

### 9. Audio Processing Chain & Web Audio API
Set up the routing graph:
```
Audio Element (stream URL)
  → MediaElementSourceNode
  → AnalyserNode (fftSize: 256)
  → BiquadFilterNode (bass, low shelf, 250Hz)
  → BiquadFilterNode (mid, peaking, 1kHz, Q: 1.0)
  → BiquadFilterNode (treble, high shelf, 4kHz)
  → WaveShaperNode (loudness/tube warmth)
  → StereoPannerNode (balance)
  → ChannelMergerNode (mono summing when active)
  → GainNode (volume/mute)
  → AudioContext.destination
```
* **First Click Gesture (Integrated Fix)**: Initialize the `AudioContext` on first user click on the album art, tuner screen, or tuning knob. Ensure `togglePlayPause()` checks if `audioCtx` is null, and if so, runs `initAudio()` before resuming or playing:
  ```javascript
  function togglePlayPause() {
    if (!audioCtx) {
      initAudio();
      return;
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (audioEl.paused) {
      audioEl.play().catch(function(){});
      setPausedUI(false);
    } else {
      audioEl.pause();
      setPausedUI(true);
    }
  }
  ```
* **EQ — CUT toggles (not boost)**: All start flat (0dB). Toggling ON applies cut, OFF restores flat:
  * Bass: low shelf -8dB below 250Hz when cut active
  * Mid: peaking -6dB at 1kHz when cut active
  * Treble: high shelf -7dB above 4kHz when cut active
* **Loudness — tube warmth**: `WaveShaperNode` soft saturation curve (starts bypassed, toggling on applies curve).
* **Balance**: `StereoPannerNode` cycling Center (0), Left (-1.0), Right (1.0).
* **Mono**: Sum L/R when active using splitter/merger.
* **Volume/Mute**: `GainNode`. Click volume knob to toggle mute/unmute. Launches at gain 0.8. Save volume level and restore on unmute.
* **White noise buffer**: Generated programmatically (2 seconds buffer) to play static during channel switch.

### 10. Channel Switch Sequence
Clicked Tuner Screen (Hit Zone #1) OR Tuning Knob (Hit Zone #2):
1. Lock controls.
2. Ticker takeover: display `TUNING TO [frequency] MHz – [STATION NAME]` centered and static.
3. Static burst: 1.5 seconds generated white noise (fade in 100ms, fade out 300ms).
4. Animate tuner tick sliding over 600ms.
5. Needle dips to rest.
6. At 1.2s mark: swap stream source and play.
7. Poll new metadata, update art (crossfading over 800ms).
8. Unlock controls after 2s.

---

## Part 3: Verification & Deployment Plan
1. Run `git mv public/wjrn-player public/player` to rename the directory if not already done.
2. Run `npm run build` to verify the project builds.
3. Open `http://localhost:3000/player/index.html`.
4. Verify that:
   * **State 1** loads with the static `CLICK ARTWORK...` ticker and floating play icon.
   * Clicking the artwork, tuner screen, or tuning knob in State 1 initializes audio and starts playing.
   * **State 2** scrolls the marquee, hides the play icon, and makes the VU needle reactive.
   * Clicking the artwork pauses the player and enters **State 3** (static paused ticker, play icon overlay, needle rests). Clicking again resumes playback.
   * Only the 13 hit zones change the cursor to `pointer` (rest of the faceplate stays `default` arrow cursor).
   * Turning EQ knobs, loudness warmth, mono, and balance updates the audio nodes and triggers temporary centered ticker takeovers.
   * Clicking the tuner screen or tuning knob plays static, slides the tuner tick, and swaps the station.
5. Deploy to the server:
   `bash deploy.sh "feature: build vintage receiver player v3 with EQ cuts, 13 hit zones, 3 states, and resizing"`
6. Verify the live player is reachable at `https://radio.jacewonmusic.com/player/` and functions perfectly.
