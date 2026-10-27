import { useEffect, useRef, useState } from "react";
import tvFrame from "../assets/images/wjrn-twitch-live-stream-tv-1280x825.png";
import { TWITCH_CHANNEL, useLiveStatus } from "../context/LiveStatusContext";
import { SHOW_WEEKDAY, formatCountdown, msUntilNextShow } from "../utils/showSchedule";

// Measured by alpha-channel search against the native 1280x825 PNG: the fully
// transparent core spans x 198-1082, y 178-625. (Its soft inner vignette is baked
// into the PNG's partial-alpha edge and overlays the video on its own.)
const SCREEN_WINDOW = { left: "15.469%", top: "21.576%", width: "69.141%", height: "54.303%" };

interface StationLiveTVProps {
  stationId: string;
}

export default function StationLiveTV({ stationId }: StationLiveTVProps) {
  const { liveStationId } = useLiveStatus();
  const isLive = liveStationId === stationId;
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const [countdownText, setCountdownText] = useState("");

  // Countdown to THIS station's next show (not the next show across all stations).
  useEffect(() => {
    const weekday = SHOW_WEEKDAY[stationId];
    const tick = () => setCountdownText(formatCountdown(msUntilNextShow(weekday)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [stationId]);

  // Visible, autoplaying embed — only created while this station is live, and only once
  // the TV is actually in the viewport (Twitch's autoplay requires visibility at creation;
  // see CLAUDE.md's Twitch section). Torn down again when the show ends.
  useEffect(() => {
    const container = embedContainerRef.current;
    if (!isLive || !container || typeof window === "undefined") return;
    let cancelled = false;

    function createEmbed() {
      if (cancelled || !container || !window.Twitch) return;
      container.innerHTML = "";
      new window.Twitch.Embed(container, {
        width: "100%",
        height: "100%",
        channel: TWITCH_CHANNEL,
        parent: [window.location.hostname],
        layout: "video",
        autoplay: true,
        muted: true,
      });
    }

    function loadSdkAndCreate() {
      if (window.Twitch) return createEmbed();
      const existing = document.getElementById("twitch-embed-sdk");
      if (existing) {
        existing.addEventListener("load", createEmbed);
      } else {
        const script = document.createElement("script");
        script.id = "twitch-embed-sdk";
        script.src = "https://embed.twitch.tv/embed/v1.js";
        script.async = true;
        script.onload = createEmbed;
        document.body.appendChild(script);
      }
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        observer.disconnect();
        loadSdkAndCreate();
      }
    }, { threshold: 0.1 });
    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      container.innerHTML = "";
    };
  }, [isLive]);

  return (
    <div id="station-live-tv" className="relative w-full max-w-5xl mx-auto" style={{ aspectRatio: "1280 / 825" }}>
      {/* Screen — video when live, countdown when not; sits under the frame PNG */}
      <div
        className="absolute z-0 overflow-hidden bg-[#080605]"
        style={{ left: SCREEN_WINDOW.left, top: SCREEN_WINDOW.top, width: SCREEN_WINDOW.width, height: SCREEN_WINDOW.height }}
      >
        <div ref={embedContainerRef} className="w-full h-full" />
        {!isLive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
            <p className="text-[10px] sm:text-xs md:text-sm font-mono text-neutral-400 mb-2 uppercase tracking-wider">
              NEXT LIVE STREAM COUNTDOWN:
            </p>
            <div className="font-mono text-2xl sm:text-4xl md:text-6xl font-bold tracking-tight">
              <span className="font-mono tabular-nums" style={{ color: "#d7b158" }}>{countdownText}</span>
            </div>
          </div>
        )}
      </div>

      <img
        src={tvFrame}
        alt=""
        draggable={false}
        className="relative z-[1] w-full h-auto block select-none pointer-events-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
      />
    </div>
  );
}
