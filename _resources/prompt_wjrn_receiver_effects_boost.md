# TASK: Increase Audio Effects Intensity on WJRN Receiver Player

To make the receiver's EQ dials and Loudness tube warmth button noticeably affect the sound, we need to increase the strength of the filters and use a more aggressive saturation curve.

## Files in Scope
- `public/player/index.html` [MODIFY]

---

## Technical Specifications

### 1. Increase EQ Cut Intensity
In `public/player/index.html`'s `<script>`:
* **Bass Cut**:
  * In `initAudio()` (around line 317), change the filter frequency to `350` Hz (up from 250Hz) to capture more low-end:
    `bassFilter.frequency.value = 350;`
  * In the click handler for `#hz-bass` (around line 454), change the cut gain to `-16` dB (down from -8dB):
    `if (bassFilter) bassFilter.gain.value = bassActive ? -16 : 0;`
* **Mid Cut**:
  * In `initAudio()` (around line 322), keep frequency at `1000` Hz, but change the Q factor to `0.7` for a wider bandwidth scoop:
    `midFilter.Q.value = 0.7;`
  * In the click handler for `#hz-mid` (around line 460), change the cut gain to `-12` dB (down from -6dB):
    `if (midFilter) midFilter.gain.value = midActive ? -12 : 0;`
* **Treble Cut**:
  * In `initAudio()` (around line 328), change the filter frequency to `2500` Hz (down from 4000Hz) to cut more high-end brightness:
    `trebleFilter.frequency.value = 2500;`
  * In the click handler for `#hz-treble` (around line 466), change the cut gain to `-16` dB (down from -7dB):
    `if (trebleFilter) trebleFilter.gain.value = trebleActive ? -16 : 0;`

### 2. Strengthen Loudness (Tube Warmth Saturation)
To make the tube saturation audible at standard stream volumes, replace the polynomial curve in `makeTubeCurve()` with a hyperbolic tangent (`tanh`) saturation function with a drive amount of `4.0`. This applies rich analog compression and harmonics:
* Locate `makeTubeCurve()` (around line 278):
  ```javascript
  function makeTubeCurve() {
    var c = new Float32Array(256);
    for (var i = 0; i < 256; i++) {
      var x = (i * 2 / 255) - 1;
      c[i] = (3 / 2) * x * (1 - (x * x) / 3);
    }
    return c;
  }
  ```
* Change it to:
  ```javascript
  function makeTubeCurve() {
    var c = new Float32Array(256);
    var drive = 4.0; // Drives the input signal into saturation
    var denom = Math.tanh(drive);
    for (var i = 0; i < 256; i++) {
      var x = (i * 2 / 255) - 1;
      c[i] = Math.tanh(drive * x) / denom;
    }
    return c;
  }
  ```

---

## Verification & Deployment Plan
1. Run `npm run build` locally to compile the player.
2. Open the player in your browser and play a stream.
3. Verify that:
   * Toggling **Bass Cut** significantly reduces the bass (sounding thin/tinny).
   * Toggling **Mid Cut** scoops out vocals and mid-range frequencies noticeably.
   * Toggling **Treble Cut** makes the audio sound muffled (like it's behind a wall).
   * Toggling **Loudness** adds a warm, compressed tape-saturation thickness.
4. Run the deploy script to push changes live:
   `bash deploy.sh "feat: increase EQ cut intensities and drive tube warmth saturation"`
