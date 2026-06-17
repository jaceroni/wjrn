# TASK: Build Standalone "Vintage Receiver" Popout Player

Create a standalone, vintage 1970s stereophonic receiver player inside a single `index.html` file. It must look and behave like a physical hardware component with diegetic controls, sitting on top of a static faceplate PNG.

## Files in Scope
- `public/wjrn-player/index.html` [NEW]
- `public/wjrn-player/wjrn-receiver-front-ko.png` [READ-ONLY]

---

## Technical Specifications

### 1. Canvas and Coordinate Layout
* Sized exactly to **1280 x 443 pixels**. Set `body { margin: 0; overflow: hidden; width: 1280px; height: 443px; background: #000; user-select: none; }`.
* Disable right-click context menu: `oncontextmenu="return false;"`.
* Position the faceplate PNG absolutely at `0,0` with `z-index: 2` to cover the full canvas.
* Place all interactive hit zones and elements absolutely using the coordinates below:
  * **Album art**: X: 111, Y: 101, W: 274, H: 274 (z-index: 1, behind the PNG knockout hole).
  * **Signal strength meter**: X: 423, Y: 104, W: 151, H: 79 (z-index: 3).
  * **Metadata ticker**: X: 410, Y: 214, W: 569, H: 48 (z-index: 3).
  * **Tuner band tick mark**: X: 659, Y: 149, W: 416, H: 7 (z-index: 3).
  * **Tuning knob hit zone**: X: 993, Y: 212, W: 188, H: 67 (z-index: 4, cursor: pointer).
  * **Volume knob hit zone**: X: 1015, Y: 285, W: 74, H: 79 (z-index: 4, cursor: pointer).

### 2. Audio & Web Audio API Architecture
* Play the stream using a standard `Audio` element with `crossOrigin="anonymous"`.
* Connect it to an `AudioContext` and `AnalyserNode` (fftSize: 256).
* Initialize or resume the `AudioContext` on the first user click anywhere on the player body to satisfy browser autoplay constraints.
* Add a `GainNode` to manage volume levels (ranging 0% to 100%, defaults to 80% on launch).
* **White Noise Static Generator**: Create a procedural audio buffer source inside the Web Audio API to play white noise static during station transitions (no external static MP3 files allowed).

### 3. Live UI Components
* **Album Art**: Pull from AzuraCast now-playing API (`now_playing.song.art`). Crossfade old to new art over 800ms on track change. Fallback to solid `#1a1a1a` on errors. Use `object-fit: cover`.
* **Metadata Ticker**: Scrolling marquee text in `#23bf91` (monospace, uppercase, tracking-wide, with a subtle text shadow glow `0 0 8px rgba(35,191,145,0.6)`). Loops every 20 seconds. Never wrap text.
* **Signal Strength VU Meter**: Render a single 2px-wide red needle (`#ff3333`) on a `<canvas>` that pivots from the bottom-center of the meter zone. Drives its angle (from 45° to 135°) reactively based on the averaged frequency data of the stream. Apply inertia/lag to the swing so it behaves like a real mechanical needle. Default is 90° (center/silence).
* **Tuner Band Tick Mark**: A vertical 2px-wide red line (`#ff3333`) mapped linearly from 88 MHz (left edge: X: 659) to 108 MHz (right edge: X: 1075). Automatically calculates position based on active frequency.

### 4. Interactive Knobs & Channel Switch Sequence
* **Volume Knob**: Left half click decreases volume by 10%. Right half click increases volume by 10%. Support **mouse wheel scrolling** (`onwheel`) over the volume knob to turn it up/down as well.
* **Tuning Knob**: Clicking advances to the next station and triggers this sequence:
  1. Lock tuning knob.
  2. Inject 1.5 seconds of white noise static (quick fade-in, slow fade-out).
  3. Simultaneously slide the tuner band tick mark to the new frequency over 600ms ease-in-out.
  4. Swing the VU needle to rest position during static, recover when stream connects.
  5. Swap the stream source at the 1.2-second mark and play the new station.
  6. Fetch new metadata immediately, swap album art, and unlock tuning knob after 2 seconds.

---

## Station Playlist Configurations
```javascript
const STATIONS = [
  { name: "WJRN", frequency: 98.7, stream: "https://radio.jacewonmusic.com/listen/wjrn/radio.mp3", api: "https://radio.jacewonmusic.com/api/nowplaying/wjrn" },
  { name: "The Rock Garden", frequency: 91.5, stream: "https://radio.jacewonmusic.com/listen/the_rock_garden/radio.mp3", api: "https://radio.jacewonmusic.com/api/nowplaying/the_rock_garden" },
  { name: "Bridge City Hang Suite", frequency: 94.3, stream: "https://radio.jacewonmusic.com/listen/bridge_city_hang_suite/radio.mp3", api: "https://radio.jacewonmusic.com/api/nowplaying/bridge_city_hang_suite" },
  { name: "The Golden Boombox", frequency: 105.1, stream: "https://radio.jacewonmusic.com/listen/golden_boombox_sessions/radio.mp3", api: "https://radio.jacewonmusic.com/api/nowplaying/golden_boombox_sessions" }
];
```
*(Note: Stream and API endpoints are mapped exactly to the active WJRN shortcodes.)*
