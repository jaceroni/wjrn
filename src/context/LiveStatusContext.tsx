import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getStationForToday } from "../utils/showSchedule";

declare global {
  interface Window {
    Twitch?: any;
  }
}

// Same channel the homepage Twitch card embeds.
export const TWITCH_CHANNEL = "jacewonmusic";

interface LiveStatus {
  /** The Twitch channel is broadcasting right now (any show). */
  isChannelLive: boolean;
  /** The station whose show day it is, but only while the channel is live — else null. */
  liveStationId: string | null;
  /** Lets a visible embed (StationLiveTV) feed its ONLINE/OFFLINE result into the shared state. */
  reportChannelLive: (live: boolean) => void;
}

const LiveStatusContext = createContext<LiveStatus>({ isChannelLive: false, liveStationId: null, reportChannelLive: () => {} });

export const useLiveStatus = () => useContext(LiveStatusContext);

// Dev/test override: ?fakelive=1 forces "live" (today's station per the weekday rule),
// ?fakelive=<stationId> forces that specific station. Remembered for the session since
// SPA navigation drops the query string.
function readFakeLive(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const q = new URLSearchParams(window.location.search).get("fakelive");
    if (q === "0") { sessionStorage.removeItem("wjrn-fakelive"); return null; }
    if (q) { sessionStorage.setItem("wjrn-fakelive", q); return q; }
    return sessionStorage.getItem("wjrn-fakelive");
  } catch {
    return null;
  }
}

/**
 * Watches the Twitch channel's ONLINE/OFFLINE state for the whole app via one tiny,
 * non-autoplaying embed parked off-screen (the SDK only reports those events through a
 * real embed instance). The visible, autoplaying embed lives in StationLiveTV and is
 * only created once this says the channel is live.
 */
export function LiveStatusProvider({ children }: { children: ReactNode }) {
  const [isChannelLive, setIsChannelLive] = useState(false);
  const [todayStation, setTodayStation] = useState<string | null>(() => getStationForToday());
  const [fake] = useState<string | null>(readFakeLive);
  const probeRef = useRef<HTMLDivElement>(null);

  // Weekday can roll over while the tab stays open.
  useEffect(() => {
    const id = setInterval(() => setTodayStation(getStationForToday()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (fake || typeof window === "undefined" || !probeRef.current) return;
    let cancelled = false;

    function createProbe() {
      if (cancelled || !probeRef.current || !window.Twitch) return;
      probeRef.current.innerHTML = "";
      const embed = new window.Twitch.Embed(probeRef.current, {
        width: 400,
        height: 300,
        channel: TWITCH_CHANNEL,
        parent: [window.location.hostname],
        layout: "video",
        autoplay: false,
        muted: true,
      });
      // Registered on the embed itself, not embed.getPlayer() — see CLAUDE.md's Twitch section.
      embed.addEventListener(window.Twitch.Player.ONLINE, () => setIsChannelLive(true));
      embed.addEventListener(window.Twitch.Player.OFFLINE, () => setIsChannelLive(false));
    }

    if (window.Twitch) {
      createProbe();
    } else {
      const existing = document.getElementById("twitch-embed-sdk");
      if (existing) {
        existing.addEventListener("load", createProbe);
      } else {
        const script = document.createElement("script");
        script.id = "twitch-embed-sdk";
        script.src = "https://embed.twitch.tv/embed/v1.js";
        script.async = true;
        script.onload = createProbe;
        document.body.appendChild(script);
      }
    }

    return () => { cancelled = true; };
  }, [fake]);

  const value: LiveStatus = fake
    ? { isChannelLive: true, liveStationId: fake === "1" ? todayStation : fake, reportChannelLive: () => {} }
    : { isChannelLive, liveStationId: isChannelLive ? todayStation : null, reportChannelLive: setIsChannelLive };

  return (
    <LiveStatusContext.Provider value={value}>
      {children}
      {/* Off-screen probe — never visible, never plays. */}
      <div
        ref={probeRef}
        aria-hidden="true"
        style={{ position: "fixed", left: "-9999px", top: 0, width: 400, height: 300, pointerEvents: "none" }}
      />
    </LiveStatusContext.Provider>
  );
}
