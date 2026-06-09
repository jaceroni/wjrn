import { useState, useEffect } from "react";
import AppRetro from "./AppRetro";
import StationLanding from "./components/StationLanding";
import { PlayerProvider } from "./context/PlayerContext";
import MiniPlayer from "./components/MiniPlayer";

const SLUG_TO_STATION: { [key: string]: string } = {
  "/the-rock-garden":        "rock_garden",
  "/bridge-city-hang-suite": "bridge_city",
  "/the-golden-boombox":     "golden_boombox",
};

type ViewState =
  | { type: "retro" }
  | { type: "station"; stationId: string };

function resolveView(): ViewState {
  if (typeof window === "undefined") return { type: "retro" };
  const path = window.location.pathname;
  for (const [slug, id] of Object.entries(SLUG_TO_STATION)) {
    if (path.startsWith(slug)) return { type: "station", stationId: id };
  }
  return { type: "retro" };
}

export default function App() {
  const [view, setView] = useState<ViewState>(resolveView);

  useEffect(() => {
    const sync = () => setView(resolveView());
    window.addEventListener("popstate", sync);
    window.addEventListener("spa-navigate", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("spa-navigate", sync);
    };
  }, []);

  return (
    <PlayerProvider>
      {view.type === "station" && <StationLanding stationId={(view as { type: "station"; stationId: string }).stationId} />}
      {view.type === "retro" && <AppRetro />}
      <MiniPlayer />
    </PlayerProvider>
  );
}
