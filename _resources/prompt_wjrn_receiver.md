# TASK: Build Standalone "Vintage Receiver" Popout Player v2

This task involves two parts:
1. **URL & Infrastructure Update**: Rename the player directory in `public/` to `player/` (served at `https://radio.jacewonmusic.com/player/`), update the Nginx routing configurations, and synchronize paths in `CLAUDE.md`.
2. **Build Receiver v2**: Build the standalone receiver player inside `public/player/index.html` with advanced 1970s hardware emulation (EQ dials, balance, mono summing, tube warmth saturation, 12 interactive hit zones, ticker modes/takeovers, and organic VU needle physics), integrated with responsive flex centering, aspect-ratio scaling, and first-click audio initialization fixes.

---

## Part 1: Directory Rename, Nginx, and Documentation

### 1. Rename Directory
* Rename the directory `public/wjrn-player/` to `public/player/`. (Use `git mv public/wjrn-player public/player` to preserve git history).

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
* In the section "Vintage Receiver Standalone Player — `public/wjrn-player/`" (around line 170), rename all occurrences of `wjrn-player` to `player`.
* Update serving URL descriptions to `radio.jacewonmusic.com/player/`.

---

## Part 2: WJRN Receiver Player v2 HTML/CSS/JS Specifications

Build the entire player inside `public/player/index.html`. It must look and function like a physical 1970s hardware receiver component. There is no visible browser or media player chrome. Every control is diegetic.

### 1. Canvas, Coordinate Spec, and Responsive Scaling
* Sized exactly to **1280 x 443 pixels**. Position the faceplate PNG absolutely at `0,0` with `z-index: 2` to cover the full canvas.
* Place all interactive hit zones and elements absolutely using the coordinates below:
  * **Album art**: X: 111, Y: 101, W: 274, H: 274 (z-index: 1, behind the PNG knockout hole).
  * **Vibe Strength meter**: X: 423, Y: 104, W: 151, H: 79 (z-index: 3).
  * **Metadata ticker**: X: 410, Y: 214, W: 569, H: 48 (z-index: 3).
  * **Tuner band tick mark**: X: 659, Y: 149, W: 416, H: 7 (z-index: 3).
* **Z-Index Bezel Rule**: Album art sits at `z-index: 1`, BELOW the PNG at `z-index: 2`. The PNG has a transparent knockout at the album art coordinates so that the art shows through and inherits the PNG's gold bezel and drop shadow naturally. Do not add any CSS border, shadow, or frame to the album art.
* **Responsive Scaling & Centering**:
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
| 1 | Tuner Screen | 411 | 90 | 766 | 104 | Click to cycle stations low to high (89.1 → 95.5 → 102.7 → 105.9 → back to 89.1) |
| 2 | Album Art | 111 | 101 | 274 | 274 | Click to pause/resume stream |
| 3 | Metadata Ticker | 410 | 214 | 569 | 48 | Click to toggle between live track metadata and station description string |
| 4 | Jacewon Logo | 553 | 46 | 173 | 30 | Click to open radio.jacewonmusic.com in a new window |
| 5 | Volume Knob | 1015 | 285 | 74 | 79 | Left half click = volume down 10%, right half click = volume up 10% |
| 6 | Bass Knob | 468 | 284 | 69 | 75 | Click to toggle bass boost +6dB on/off |
| 7 | Mid Knob | 606 | 285 | 69 | 72 | Click to toggle mid boost +4dB on/off |
| 8 | Treble Knob | 740 | 285 | 72 | 72 | Click to toggle treble boost +5dB on/off |
| 9 | Balance Knob | 878 | 285 | 75 | 75 | Click to cycle balance: Center → Left → Right → Center |
| 10 | Loudness Button | 416 | 291 | 28 | 28 | Click to toggle tube warmth saturation on/off |
| 11 | Mono Button | 416 | 343 | 28 | 27 | Click to toggle mono/stereo |
| 12 | Power Button | 1130 | 293 | 30 | 28 | Click to stop audio and close window instantly |

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
    stream: "https://radio.jacewonmusic.com/listen/the_rock_garden/radio.mp3",
    api: "https://radio.jacewonmusic.com/api/nowplaying/the_rock_garden",
    description: "THIS IS THE ROCK GARDEN – ALL VINYL CLASSIC ROCK, FUNK, BLUES & JAZZ – LIVE EVERY TUESDAY 7PM PACIFIC ON TWITCH.TV"
  },
  {
    name: "Bridge City Hang Suite",
    frequency: 102.7,
    stream: "https://radio.jacewonmusic.com/listen/bridge_city_hang_suite/radio.mp3",
    api: "https://radio.jacewonmusic.com/api/nowplaying/bridge_city_hang_suite",
    description: "THIS IS THE BRIDGE CITY HANG SUITE – GROWNFOLK R&B – LIVE EVERY WEDS 7PM PACIFIC ON TWITCH.TV"
  },
  {
    name: "The Golden Boombox Sessions",
    frequency: 105.9,
    stream: "https://radio.jacewonmusic.com/listen/golden_boombox_sessions/radio.mp3",
    api: "https://radio.jacewonmusic.com/api/nowplaying/golden_boombox_sessions",
    description: "THIS IS THE GOLDEN BOOMBOX SESSIONS – GOLDEN ERA & FUTURE CLASSIC HIP-HOP – LIVE EVERY FRIDAY 7PM PACIFIC ON TWITCH.TV"
  }
];
```

### 4. Audio Processing Chain & Web Audio API
Set up the following Web Audio API routing graph:
```
Audio Element (stream URL)
  → MediaElementSourceNode
  → AnalyserNode (fftSize: 256) → drives Vibe Strength needle
  → BiquadFilterNode (bass, low shelf, 250Hz)
  → BiquadFilterNode (mid, peaking, 1kHz)
  → BiquadFilterNode (treble, high shelf, 4kHz)
  → WaveShaperNode (loudness/tube warmth saturation)
  → StereoPannerNode (balance: -1.0 left / 0 center / 1.0 right)
  → ChannelSplitterNode & ChannelMergerNode (mono summing when mono active)
  → GainNode (volume: 0.0–1.0, launches at 0.8)
  → AudioContext.destination
```
* **First Click Gesture**: Initialize the `AudioContext` on the first user click anywhere on the player body, album art, or metadata ticker. Ensure `togglePlayPause()` checks if `audioCtx` is null, and if so, runs `initAudio()` before doing anything else:
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
* **EQ nodes** — all start bypassed (gain = 0dB). Click boosts them:
  * Bass: low shelf +6dB below 250Hz
  * Mid: peaking +4dB at 1kHz, Q: 1.0
  * Treble: high shelf +5dB above 4kHz
* **Loudness/tube warmth** — `WaveShaperNode` with a soft saturation curve (starts bypassed, toggling on applies the curve to add analog harmonic warmth).
* **Balance** — `StereoPannerNode` cycling states: Center (0), Left (-1.0), Right (1.0).
* **Mono** — Sum Left and Right to mono when active (splitter -> merger), pass stereo when inactive.
* **Volume** — Left half volume knob click decreases gain by 0.1, right half increases gain by 0.1 (clamp 0.0 to 1.0).
* **White Noise Static Buffer**: Programmatically fill an `AudioBuffer` with `Math.random()` values to play static noise during tuning transitions.

### 5. Metadata Ticker Modes & Takeovers
* **Mode 1 (Default)**: Scrolls `TRACK TITLE – ARTIST – STATION NAME –` continuously.
* **Mode 2**: Scrolls the active station's config `description` continuously.
* **Ticker click**: Toggle between Mode 1 and Mode 2.
* **Ticker Takeovers**: Display a status message (e.g. `BASS BOOST – ON –`, `VOLUME – 80% –`, `TUNING TO 95.5 MHz – THE ROCK GARDEN –`) for 2.5 seconds, then return to the mode it was in before.

### 6. Vibe Strength Meter (VU Needle)
* Sized 151x79, rendering a 2px-wide red needle (`#ff3333`) pivoting from bottom-center.
* Sample mid and low-mid frequency bands (kick/bass/snare range).
* Needle must have a **fast attack** and **slow decay** (inertia/lag simulation).
* Include a **subtle random drift** at idle so the needle organic floats (not completely still).
* Paused state and tuning state: needle drops smoothly to rest position (far left).

### 7. Tuner Band Tick Mark
* 2px-wide, 7px-tall red vertical tick.
* Linear position: 88 MHz (left edge X: 659) to 108 MHz (right edge X: 1075).
* On station switch: animate tick sliding to new position over 600ms ease-in-out.

### 8. Channel Switch Sequence
When the tuner screen is clicked:
1. Lock tuner clicks.
2. Inject 1.5 seconds of programmatic white noise static (100ms fade-in, 300ms fade-out).
3. Simultaneously slide the tuner tick to the new frequency over 600ms.
4. Swing the VU needle to rest position.
5. At the 1.2 second mark, swap the stream source and call play.
6. Display tuning takeover message on the ticker for 2.5 seconds.
7. Poll new metadata, update art (crossfading over 800ms).
8. Re-enable tuner clicks after 2 seconds.

---

## Part 3: Verification & Deployment Plan
1. Run `git mv public/wjrn-player public/player` to rename the directory.
2. Run `npm run build` to verify the project builds.
3. Open `http://localhost:5173/player/index.html`.
4. Verify that:
   * Clicking the album artwork on first load starts playback.
   * Clicking the metadata screen on first load starts playback.
   * Resizing the browser window scales the entire player proportionally in both dimensions.
   * Only the 12 hit zones change the cursor to `pointer` (rest of the faceplate stays `default` arrow cursor).
   * Turning EQ knobs, loudness warmth, mono, and balance updates the audio nodes and triggers temporary ticker takeovers.
   * Clicking the tuner screen plays tuning static, slides the tuner tick, and swaps the station.
5. Deploy using the deploy script:
   `bash deploy.sh "feature: build vintage receiver player v2 with EQ, balance, mono, warmth, resizing, and URL rename"`
6. Verify the live player is reachable at `https://radio.jacewonmusic.com/player/` and functions perfectly.
