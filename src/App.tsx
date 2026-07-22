import { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import AppRetro, { STATIONS } from "./AppRetro";
import StationLanding from "./components/StationLanding";
import AboutWjrn from "./components/AboutWjrn";
import { PlayerProvider } from "./context/PlayerContext";
import MiniPlayer from "./components/MiniPlayer";
import PopoutWidget from "./components/PopoutWidget";

const SLUG_TO_STATION: { [key: string]: string } = {
  "/the-rock-garden":        "rock_garden",
  "/bridge-city-hang-suite": "bridge_city",
  "/the-golden-boombox":     "golden_boombox",
};

type ViewState =
  | { type: "retro" }
  | { type: "station"; stationId: string }
  | { type: "about" };

function resolveView(): ViewState {
  if (typeof window === "undefined") return { type: "retro" };
  const path = window.location.pathname;
  if (path.startsWith("/about-wjrn")) return { type: "about" };
  for (const [slug, id] of Object.entries(SLUG_TO_STATION)) {
    if (path.startsWith(slug)) return { type: "station", stationId: id };
  }
  return { type: "retro" };
}

// Fallback popout: full window opened with ?popout=true
const isFallbackPopout =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("popout") === "true";

export default function App() {
  const [view, setView]         = useState<ViewState>(resolveView);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  // SPA navigation
  useEffect(() => {
    const sync = () => setView(resolveView());
    window.addEventListener("popstate", sync);
    window.addEventListener("spa-navigate", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("spa-navigate", sync);
    };
  }, []);

  // Open Document Picture-in-Picture (or fallback popout)
  const openPip = useCallback(async () => {
    if ("documentPictureInPicture" in window) {
      try {
        const pip = await (window as any).documentPictureInPicture.requestWindow({
          width: 320,
          height: 420,
        });

        // Copy parent document styles into the PiP window
        [...document.styleSheets].forEach((sheet) => {
          try {
            const css = [...sheet.cssRules].map((r) => r.cssText).join("");
            const style = document.createElement("style");
            style.textContent = css;
            pip.document.head.appendChild(style);
          } catch {
            if (sheet.href) {
              const link = document.createElement("link");
              link.rel = "stylesheet";
              link.href = sheet.href;
              pip.document.head.appendChild(link);
            }
          }
        });

        // Dark background for the PiP window
        pip.document.body.style.cssText = "margin:0;padding:0;background:#0a0a0a;display:flex;align-items:center;justify-content:center;min-height:100vh;";

        setPipWindow(pip);
        pip.addEventListener("pagehide", () => setPipWindow(null));
      } catch (err) {
        console.error("Document PiP failed:", err);
      }
    } else {
      // Fallback: standard popup window
      window.open(
        "/?popout=true",
        "WJRNPopout",
        "width=320,height=420,menubar=no,status=no,toolbar=no,resizable=no"
      );
    }
  }, []);

  // Listen for the open-pip trigger from MiniPlayer
  useEffect(() => {
    const handler = () => openPip();
    window.addEventListener("wjrn:open-pip", handler);
    return () => window.removeEventListener("wjrn:open-pip", handler);
  }, [openPip]);

  // Fallback popout mode — render only the widget
  if (isFallbackPopout) {
    return (
      <PlayerProvider>
        <div className="bg-neutral-950 min-h-screen flex items-center justify-center">
          <PopoutWidget onClose={() => window.close()} />
        </div>
      </PlayerProvider>
    );
  }

  return (
    <PlayerProvider>
      {view.type === "station" && (
        <StationLanding stationId={(view as { type: "station"; stationId: string }).stationId} />
      )}
      {view.type === "about" && <AboutWjrn STATIONS={STATIONS} />}
      {view.type === "retro" && <AppRetro />}

      {/* Mini player — hidden while PiP widget is active */}
      {!pipWindow && <MiniPlayer />}

      {/* Document PiP portal */}
      {pipWindow &&
        ReactDOM.createPortal(
          <PopoutWidget isPip onClose={() => { pipWindow.close(); setPipWindow(null); }} />,
          pipWindow.document.body
        )}
    </PlayerProvider>
  );
}
