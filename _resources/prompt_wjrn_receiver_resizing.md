# TASK: Fix Vintage Receiver Popout Player Resizing and JavaScript Crash

We need to fix two issues in the standalone WJRN Vintage Receiver popout player (`public/wjrn-player/index.html`):
1. **JavaScript Crash**: There is a typo where `document.getElementById('ticker-wrap')` is used instead of the correct container variable or ID. This throws a `TypeError` and stops the script from executing, which completely prevents the resizing function from running.
2. **Responsive Resizing**: The player does not scale with window resizing, and gets cut off on smaller browser windows or mobile viewports. We need to update the layout to use a flex container that fills the viewport and scales the player proportionally in both dimensions (width and height) while maintaining its 1280:443 aspect ratio.

## Files in Scope
- `public/wjrn-player/index.html` [MODIFY]

---

## Technical Specifications

### 1. Fix the JavaScript Null Pointer Crash
In the event handlers section of `<script>`:
* Locate the event listener for the ticker click (around line 654):
  `document.getElementById('ticker-wrap').addEventListener('click', ...)`
* The element with ID `ticker-wrap` does not exist (the wrapper element actually has ID `ticker-container`).
* Change `document.getElementById('ticker-wrap')` to `tickerWrap` (which is already defined as `const tickerWrap = document.getElementById('ticker-container')` at line 284).
* It should look like this:
  `tickerWrap.addEventListener('click', function(e) { e.stopPropagation(); togglePlayPause(); });`

### 2. Update Layout Styles for Centering and Aspect Ratio Scaling
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

### 3. Update the Scaling Logic
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
* Remove any manual height assignment to `player-scaler` (e.g. `document.getElementById('player-scaler').style.height = ...`) as the flex layout handles sizing automatically.

---

## Verification & Deployment Plan
1. Run `npm run build` locally to compile the application and copy the updated file to the `dist` folder.
2. Open `/wjrn-player/index.html` in your browser.
3. Verify that resizing the browser window scales the entire player smoothly in all dimensions without any clipping or scrollbars.
4. Verify the player stays perfectly centered in the window.
5. Verify clicking the artwork/ticker plays and pauses correctly and the console has no JavaScript errors.
6. Run the deploy script to push changes live:
   `bash deploy.sh "fix: popout receiver player resizing and ticker click crash"`
