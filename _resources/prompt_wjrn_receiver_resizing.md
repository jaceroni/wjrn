# TASK: Fix Vintage Receiver Resizing, First-Click Play, and Rename URL to /player/

We need to perform three updates for the standalone Vintage Receiver popout player:
1. **URL Rename to `/player/`**: Rename the player directory in `public/` to `player/` so it is served at `https://radio.jacewonmusic.com/player/`. Update the Nginx routing configurations and documentation.
2. **JavaScript Crash**: Fix a typo in the standalone player's HTML script where `document.getElementById('ticker-wrap')` is used instead of the correct variable `tickerWrap`, which crashes the script and blocks resizing.
3. **First Click Play Bug**: Ensure that clicking the album artwork or metadata ticker on first load initializes the audio context and starts playback.
4. **Responsive Resizing**: Make the player scale dynamically inside a centered flex container to fit the viewport in both dimensions while maintaining its 1280:443 aspect ratio.

## Files in Scope
- `public/wjrn-player/` -> `public/player/` [RENAME]
- `public/player/index.html` [MODIFY]
- `nginx-wjrn.conf` [MODIFY]
- `CLAUDE.md` [MODIFY]

---

## Technical Specifications

### 1. Rename Directory
* Rename the directory `public/wjrn-player/` to `public/player/`.

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

### 4. Fix HTML Player Script (`public/player/index.html`)

#### Fix Null Pointer Crash & Click Initialization
In the event handlers section of `<script>`:
* Locate the event listener for the ticker click (around line 654):
  `document.getElementById('ticker-wrap').addEventListener('click', ...)`
* Change `document.getElementById('ticker-wrap')` to `tickerWrap` (which is already defined as `const tickerWrap = document.getElementById('ticker-container')` at line 284).
* Update `togglePlayPause()` function (around line 642) so that if `audioCtx` is null, it calls `initAudio()` and exits:
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

#### Update Layout Styles for Viewport Centering
In the `<style>` block:
* Update the `html` and `body` rules to lock the viewport size and enable flex centering:
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
* Repurpose `#player-scaler` to fill the entire viewport and act as a flex container:
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
* Update `#player` to be centered via relative positioning and have a fixed aspect ratio context without shrinking:
  ```css
  #player {
    position: relative;
    width: 1280px;
    height: 443px;
    cursor: pointer;
    transform-origin: center center;
    flex-shrink: 0;
  }
  ```

#### Update the Scaling Logic
In the script's `scalePlayer` function (at the bottom):
* Calculate the scale factor by comparing the viewport dimensions with the target size (`1280x443`) in both width and height (retaining aspect ratio without overflow/clipping):
  ```javascript
  function scalePlayer() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var scale = Math.min(vw / 1280, vh / 443);
    document.getElementById('player').style.transform = 'scale(' + scale + ')';
  }
  ```
* Remove the line that manually sets height on `player-scaler` (`document.getElementById('player-scaler').style.height = ...`), as CSS flexbox handles container dimensions.

---

## Verification & Deployment Plan
1. Run `git mv public/wjrn-player public/player` (or let Claude Code perform the folder rename).
2. Run `npm run build` locally to compile the application and copy the updated file to the `dist` folder.
3. Open `http://localhost:5173/player/index.html` in your browser.
4. Verify that:
   * Clicking the album artwork on first load starts playback.
   * Clicking the metadata screen on first load starts playback.
   * Resizing the browser window scales the entire player proportionally in both dimensions without clipping.
   * The developer console contains no JavaScript errors.
5. Deploy to the server:
   `bash deploy.sh "refactor: rename receiver player url to /player/, fix resizing, and click play"`
6. Verify the live receiver is reachable at `https://radio.jacewonmusic.com/player/` and works perfectly.
