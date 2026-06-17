# TASK: Fix Standalone Player Ticker Typo, First-Load Scroll, Visual Flash, Pause Hyphen, and Seamless looping

We need to fix several bugs and implement seamless scrolling for the metadata ticker in the standalone receiver player (`public/player/index.html`):
1. **`ticker-wrap` Typo & First-Load Scroll Bug**: The JavaScript tries to access `document.getElementById('ticker-wrap')`, but the HTML element ID is `ticker-container`. This throws a script error and crashes the player on first load, which stops the marquee from scrolling.
2. **One-Frame Metadata Flash & Tuning Transition**:
   * **Transition Flow**: When switching stations, the ticker should display static centered `TUNING TO ...` and hold it on screen until the API fetch completes (minimum 2.5s). Once resolved, it should transition directly to the scrolling track metadata (no intermediate blank gaps, no placeholder dashes `– – – –`, and no station name flash).
   * **Flash Fix**: We must immediately set the `translateX` transform of the text element to `569px` (off-screen) when starting a scroll before the browser paints, preventing it from flashing centered for one frame.
3. **Seamless Looping Marquee**: The ticker currently scrolls off-screen completely, then resets back to the right and repeats. We want it to be a **continuous, seamless loop** (like a tape loop) where the text repeats endlessly with no blank gaps.
4. **Static Centering Layout**: Toggle the container layout context between `flex` (for centering static text) and `block` (for absolute positioning of scrolling text).
5. **Pause Ticker Hyphen**: Remove the trailing hyphen from the paused messages (e.g. change `PAUSED – WJRN –` to `PAUSED – WJRN`).

## Files in Scope
- `public/player/index.html` [MODIFY]

---

## Technical Specifications

In `public/player/index.html`'s `<script>`:

### 1. Fix Ticker Typo & Layout Context
* Locate `setTickerStatic(text)` (around line 126):
  ```javascript
  function setTickerStatic(text) {
    var wrap = document.getElementById('ticker-wrap');
    var el = document.getElementById('ticker-text');
    wrap.style.justifyContent = 'center';
    el.style.transform = 'translateX(0)';
    el.textContent = text;
    tickerMode = 'A';
  }
  ```
* Update it to reference `ticker-container`, set display to `flex`, and toggle the child's position to `relative` to allow flex centering:
  ```javascript
  function setTickerStatic(text) {
    var wrap = document.getElementById('ticker-container');
    var el = document.getElementById('ticker-text');
    if (wrap && el) {
      wrap.style.display = 'flex';
      wrap.style.justifyContent = 'center';
      el.style.position = 'relative';
      el.style.left = 'auto';
      el.style.transform = 'translateX(0)';
      el.textContent = text;
    }
    tickerMode = 'A';
  }
  ```

### 2. Implement Seamless Looping & Flash Prevention
* Locate `setTickerScroll(text, mode)` (around line 135).
* Update it to:
  1. Measure the width of a single copy of the text.
  2. Repeat the text as many times as necessary to exceed the container width (`569px`) plus one extra copy, allowing it to loop seamlessly.
  3. Set `tickerWidth` to the single-copy width so we know when to wrap the translation.
  4. Change the parent display to `block` and child position to `absolute`.
  5. Immediately apply the `translateX(569px)` transform to position the start off-screen and prevent a layout flash:
  ```javascript
  function setTickerScroll(text, mode) {
    var wrap = document.getElementById('ticker-container');
    var el = document.getElementById('ticker-text');
    if (wrap && el) {
      wrap.style.display = 'block';
      el.style.position = 'absolute';
      el.style.left = '0';
      
      tickerMode = mode;
      lastTickerTime = null;
      
      // Measure single copy width
      el.textContent = text;
      var singleW = el.scrollWidth || 1;
      
      // Repeat the text to fill the screen and loop seamlessly
      var repeats = Math.ceil(569 / singleW) + 1;
      tickerContent = text.repeat(repeats);
      el.textContent = tickerContent;
      
      tickerX = 569; // Start off-screen to the right
      tickerWidth = singleW; // Store single copy width for wrap boundaries
      el.style.transform = 'translateX(' + tickerX + 'px)'; // Prevent visual flash
    }
  }
  ```

* Locate the animation loop `animateTicker(ts)` (around line 170):
  ```javascript
  function animateTicker(ts) {
    requestAnimationFrame(animateTicker);
    if (tickerMode !== 'B' && tickerMode !== 'C') return;
    if (!lastTickerTime) { lastTickerTime = ts; return; }
    var dt = (ts - lastTickerTime) / 1000;
    lastTickerTime = ts;
    if (dt > 0.1) dt = 0.1; // clamp for tab-switch catchup
    tickerX -= 50 * dt;
    var el = document.getElementById('ticker-text');
    var textW = el.scrollWidth;
    if (tickerX < -textW) tickerX = 569;
    el.style.transform = 'translateX(' + tickerX + 'px)';
  }
  ```
* Update the boundary check. Instead of waiting for the entire repeated text to scroll off-screen, wrap the position by `tickerWidth` (the single copy width) as soon as `tickerX` becomes less than `-tickerWidth`. This creates a seamless, endless loop:
  ```javascript
  function animateTicker(ts) {
    requestAnimationFrame(animateTicker);
    if (tickerMode !== 'B' && tickerMode !== 'C') return;
    if (!lastTickerTime) { lastTickerTime = ts; return; }
    var dt = (ts - lastTickerTime) / 1000;
    lastTickerTime = ts;
    if (dt > 0.1) dt = 0.1;
    tickerX -= 50 * dt;
    
    // Wrap position by the single-copy width for a seamless endless loop
    if (tickerX <= -tickerWidth) {
      tickerX += tickerWidth;
    }
    
    var el = document.getElementById('ticker-text');
    if (el) {
      el.style.transform = 'translateX(' + tickerX + 'px)';
    }
  }
  ```

### 3. Stabilize Tuning Metadata Transition Flow
* Update `fetchMeta()` to handle API errors and empty responses gracefully. If the API returns empty/invalid data or fails, set a clean fallback title and artist:
  ```javascript
  function fetchMeta() {
    fetch(STATIONS[currentStation].api)
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var np = d && d.now_playing && d.now_playing.song;
        if (np && (np.title || np.artist)) {
          currentTitle = np.title || '';
          currentArtist = np.artist || '';
          var artUrl = np.art || '';
          if (artUrl && artUrl !== currentArtUrl) {
            currentArtUrl = artUrl;
            updateArt(artUrl);
          }
        } else {
          // Fallback if API returns empty song metadata
          currentTitle = 'LIVE STREAM';
          currentArtist = STATIONS[currentStation].name.toUpperCase();
        }
        if (tickerMode === 'B' && !tickerTakeoverTimer) {
          setTickerScroll(buildMetaText(), 'B');
        }
      })
      .catch(function() {
        // Fallback if network/API call fails
        currentTitle = 'LIVE STREAM';
        currentArtist = STATIONS[currentStation].name.toUpperCase();
        if (tickerMode === 'B' && !tickerTakeoverTimer) {
          setTickerScroll(buildMetaText(), 'B');
        }
      });
  }
  ```
* Update `restoreTicker()` to check if `currentTitle` is empty (meaning the fetch has not resolved yet). If it is empty, return early to keep the static centered `TUNING TO...` takeover message on screen:
  ```javascript
  function restoreTicker() {
    if (playerState === 1) { setTickerStatic('CLICK ARTWORK OR TUNER TO BEGIN PLAYBACK'); return; }
    if (playerState === 3) { setTickerStatic('PAUSED – ' + STATIONS[currentStation].name.toUpperCase()); return; }
    if (tickerPreTakeover === 'C') {
      setTickerScroll(STATIONS[currentStation].description, 'C');
    } else {
      if (!currentTitle && !currentArtist) {
        // Hold the takeover message static and centered until fetch completes
        return;
      }
      setTickerScroll(buildMetaText(), 'B');
    }
  }
  ```

### 4. Remove Trailing Hyphens from Pause Messages
* Locate `audioEl.onpause` listener inside `initAudio()` (around line 372). Change the pause message concatenation from:
  `setTickerStatic('PAUSED – ' + STATIONS[currentStation].name.toUpperCase() + ' –');`
  to:
  `setTickerStatic('PAUSED – ' + STATIONS[currentStation].name.toUpperCase());`

---

## Verification & Deployment Plan
1. Run `npm run build` locally to compile the player.
2. Open the player in your browser at `http://localhost:3000/player/index.html`.
3. Verify that:
   * On first load, clicking the artwork starts playback, and the metadata immediately begins scrolling smoothly (no crash, no freeze on "WJRN").
   * Toggling pause shows `PAUSED – WJRN` centered without a trailing hyphen.
   * Switching stations shows `TUNING TO [freq] MHz – [STATION NAME]`. It remains static and centered, then transitions smoothly into the track metadata scrolling in from the right.
   * **Continuous Scrolling**: When the metadata finishes scrolling, the text repeats seamlessly behind it without any blank screen resets.
   * There are no placeholder dashes (`– – – –`), no flashes of the station name, and no visual layout glitches.
4. Run the deploy script to push changes live:
   `bash deploy.sh "fix: stabilize receiver ticker layout, fix first-load scroll, remove flash, and remove pause hyphen"`
