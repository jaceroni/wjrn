# TASK: Fix Placeholder Dashes in Standalone Player Ticker

When tuning to a new station, if the metadata fetch takes longer than the 2.5-second tuning takeover message, the ticker falls back to displaying placeholder dashes (`– – – – STATIONNAME – `) until the API returns the actual track title and artist. We want to update this so it cleanly falls back to just the station name (or loading status) without displaying empty placeholders.

## Files in Scope
- `public/player/index.html` [MODIFY]

---

## Technical Specifications

In `public/player/index.html`'s `<script>`:
* Locate the `buildMetaText()` function (around line 165):
  ```javascript
  function buildMetaText() {
    return (currentTitle || '–') + ' – ' + (currentArtist || '–') + ' – ' + STATIONS[currentStation].name.toUpperCase() + ' –  ';
  }
  ```
* Update it to check if both the title and artist are missing. If they are, just return the uppercase station name (or `STATION NAME – LIVE –`) instead of displaying en-dash placeholders:
  ```javascript
  function buildMetaText() {
    if (!currentTitle && !currentArtist) {
      return STATIONS[currentStation].name.toUpperCase() + ' –  ';
    }
    return (currentTitle || '–') + ' – ' + (currentArtist || '–') + ' – ' + STATIONS[currentStation].name.toUpperCase() + ' –  ';
  }
  ```

---

## Verification & Deployment Plan
1. Run `npm run build` locally to compile the player.
2. Open the player in your browser, click to start, and tune to a station.
3. Verify that during the brief window before the metadata is loaded, the ticker displays the station name cleanly (e.g. `THE ROCK GARDEN – `) instead of placeholder dashes (`– – – – THE ROCK GARDEN – `).
4. Run the deploy script to push changes live:
   `bash deploy.sh "fix: remove placeholder dashes in ticker during station transitions"`
