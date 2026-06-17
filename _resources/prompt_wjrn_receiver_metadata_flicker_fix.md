# TASK: Fix Metadata Transition Flicker on Station Switch

When switching stations, if the metadata fetch takes longer than the 2.5-second tuning takeover message, the ticker starts scrolling a placeholder layout (`– – – – STATIONNAME – `). A split second later when the API returns, the ticker clears and resets to scroll the actual song details, creating an off-putting visual flicker.

We want to update this so the ticker stays in a clean, static centered state showing the station name until the metadata is resolved.

## Files in Scope
- `public/player/index.html` [MODIFY]

---

## Technical Specifications

In `public/player/index.html`'s `<script>`:
* Locate the `restoreTicker()` function (around line 155):
  ```javascript
  function restoreTicker() {
    if (playerState === 1) { setTickerStatic('CLICK ARTWORK OR TUNER TO BEGIN PLAYBACK'); return; }
    if (playerState === 3) { setTickerStatic('PAUSED – ' + STATIONS[currentStation].name.toUpperCase() + ' –'); return; }
    if (tickerPreTakeover === 'C') {
      setTickerScroll(STATIONS[currentStation].description, 'C');
    } else {
      setTickerScroll(buildMetaText(), 'B');
    }
  }
  ```
* Modify it to check if both `currentTitle` and `currentArtist` are empty. If they are, keep the ticker static and centered showing the station name:
  ```javascript
  function restoreTicker() {
    if (playerState === 1) { setTickerStatic('CLICK ARTWORK OR TUNER TO BEGIN PLAYBACK'); return; }
    if (playerState === 3) { setTickerStatic('PAUSED – ' + STATIONS[currentStation].name.toUpperCase() + ' –'); return; }
    if (tickerPreTakeover === 'C') {
      setTickerScroll(STATIONS[currentStation].description, 'C');
    } else {
      if (!currentTitle && !currentArtist) {
        setTickerStatic(STATIONS[currentStation].name.toUpperCase());
      } else {
        setTickerScroll(buildMetaText(), 'B');
      }
    }
  }
  ```

---

## Verification & Deployment Plan
1. Run `npm run build` locally to compile the player.
2. Open the player, play a station, and switch channels.
3. Verify that:
   * During tuning, it shows `TUNING TO ...`.
   * After 2.5s, it shows the station name static and centered (no scroll).
   * Once the API resolves, it starts scrolling the metadata smoothly from the right side.
   * There is no double-scroll animation or visual reset flicker.
4. Run the deploy script to push changes live:
   `bash deploy.sh "fix: stabilize metadata transition to avoid ticker flicker during station switch"`
