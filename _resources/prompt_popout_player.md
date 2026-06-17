# TASK: Implement Always-on-Top "Pocket Radio" Popout Player Widget

We want to add a "Popout Player" button to the Mini Player. Clicking it opens a small, always-on-top widget player ("WJRN Pocket Radio") using the Document Picture-in-Picture API, with a query-parameter fallback (`?popout=true`) for unsupported browsers.

## Files in Scope
- `src/components/MiniPlayer.tsx` [MODIFY]
- `src/App.tsx` [MODIFY]
- `src/components/PopoutWidget.tsx` [NEW]

---

## Technical Specifications

### 1. Create the PopoutWidget Component
Create a new file `src/components/PopoutWidget.tsx`. This component should render a compact, retro-styled pocket radio widget (size: `320px` width by `420px` height) containing:
* **Imports**: Use the `usePlayer` hook from `../context/PlayerContext` to bind controls.
* **Layout & Style**:
  * Glassmorphism background (`bg-neutral-900/90 backdrop-blur-md`).
  * A central simulated "LCD screen" displaying the active station logo (`wjrn`, `rock_garden`, `bridge_city`, or `golden_boombox`) and the now-playing track title/artist (with a scrolling marquee for long text).
  * A small animating audio visualizer (LED-style bar columns) utilizing the active station's theme color.
  * Tactile hardware-style buttons for Play/Pause, Mute, and a "Channel Cycle" button to rotate between stations.
  * A close/restore button to close the widget.

### 2. Implement the Document PiP Handler in `App.tsx`
* Add state `pipWindow` (the window reference).
* Implement `openPip` to spawn the Document Picture-in-Picture window:
  ```typescript
  async function openPip() {
    if ('documentPictureInPicture' in window) {
      try {
        const pip = await (window as any).documentPictureInPicture.requestWindow({
          width: 320,
          height: 420,
        });

        // Copy parent document styles to the PiP window head
        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
            const style = document.createElement('style');
            style.textContent = cssRules;
            pip.document.head.appendChild(style);
          } catch (e) {
            if (styleSheet.href) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = styleSheet.href;
              pip.document.head.appendChild(link);
            }
          }
        });

        setPipWindow(pip);
        pip.addEventListener("pagehide", () => setPipWindow(null));
      } catch (e) {
        console.error("Failed to open Document PiP:", e);
      }
    } else {
      // Fallback: Open standard popout window
      window.open('/?popout=true', 'WJRNPopout', 'width=320,height=420,menubar=no,status=no,toolbar=no');
    }
  }
  ```
* Handle mounting:
  * Check the query parameter: `const isFallbackPopout = new URLSearchParams(window.location.search).get("popout") === "true";`
  * If `isFallbackPopout` is true, render *only* `<PopoutWidget />` (omit header, footer, page background, and standard player).
  * If `pipWindow` is active, use `ReactDOM.createPortal(<PopoutWidget isPip onClose={() => pipWindow.close()} />, pipWindow.document.body)` to render the widget in the PiP window.
  * Pass the `openPip` function down via context or custom window event listener so the Mini Player can trigger it.

### 3. Add Popout Trigger to `MiniPlayer.tsx`
* Import the `ExternalLink` icon from `lucide-react`.
* Place a popout button (icon + text "Pop Out") next to the existing close button in the controls section on the right side of the bar.
* Configure it to trigger the `openPip` handler on click.
* If a popout window is active, hide the Mini Player on the main page to keep the controls clean.

---

## Verification & Deployment Plan
1. Run `npm run build` to verify the project builds.
2. Click the "Pop Out" button in the Mini Player:
   * **Chrome/Edge**: Verify a borderless floating window opens and stays on top of all desktop windows. Verify Play/Pause controls the audio smoothly.
   * **Safari/Firefox**: Verify it falls back to a clean popout window.
3. Deploy using `bash deploy.sh "feature: implement always-on-top PiP pocket radio widget"`.
