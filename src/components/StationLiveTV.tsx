import { useEffect, useRef, useState } from "react";
import tvFrame from "../assets/images/wjrn-twitch-live-stream-tv-1280x825.png";
import { TWITCH_CHANNEL, useLiveStatus } from "../context/LiveStatusContext";
import { SHOW_WEEKDAY, formatCountdown, msUntilNextShow } from "../utils/showSchedule";

// Measured by alpha-channel search against the native 1280x825 PNG. The *fully* transparent
// core is only x 198-1082, y 178-625, but it's ringed by a ~55px soft vignette of partial
// alpha that fades out to the opaque bezel — anchoring to the core left a visible gap (the
// screen looked ~50px short of the bezel on every side). The true opening is where alpha
// first reaches opaque: x 131-1148, y 113-690. The vignette then darkens the video's
// edges on its own, like CRT glass.
const SCREEN_WINDOW = { left: "9.688%", top: "12.485%", width: "81.094%", height: "72.485%" };

// Click zones around the two CTAs baked into the bottom row of the PNG ("JOIN THE CHAT ON ⧉"
// left of the logo, "◻ GIVE US A FOLLOW" right of it). Text measured by gold-pixel search
// (left x114-242, right x1033-1165, both y~752-768), then padded ~12px/10px so they're
// comfortable to hit — percentages of the native 1280x825 canvas, same as SCREEN_WINDOW.
const CHAT_ZONE = { left: "7.969%", top: "89.818%", width: "11.875%", height: "4.727%" };
const FOLLOW_ZONE = { left: "79.766%", top: "89.818%", width: "12.188%", height: "4.727%" };

// The baked-in "jacewon" logo opens the standalone TV page as a pop-out window, like the
// vintage player's logo does (x572-711, y747-768, padded).
const LOGO_ZONE = { left: "43.75%", top: "89.818%", width: "12.734%", height: "4.727%" };

const TWITCH_URL = "https://www.twitch.tv/jacewonmusic";
const INSTAGRAM_URL: Record<string, string> = {
  rock_garden: "https://www.instagram.com/therockgarden.tv/",
  bridge_city: "https://www.instagram.com/bridgecityhangsuite/",
  golden_boombox: "https://www.instagram.com/goldenboomboxsessions/",
};

interface StationLiveTVProps {
  stationId: string;
}

export default function StationLiveTV({ stationId }: StationLiveTVProps) {
  const { liveStationId, reportChannelLive } = useLiveStatus();
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

  // Same path as the homepage Twitch card, which is the proven one: a visible, autoplaying
  // embed created once the TV is in the viewport (Twitch's autoplay requires visibility at
  // creation; see CLAUDE.md's Twitch section), with ONLINE/OFFLINE registered on the embed
  // itself. Always created (not gated on "live") — the countdown screen covers it while the
  // channel is offline — and its result feeds the app-wide state, so on a station page this
  // path is authoritative and the hidden probe is only needed for the badge elsewhere.
  useEffect(() => {
    const container = embedContainerRef.current;
    if (!container || typeof window === "undefined") return;
    let cancelled = false;

    function createEmbed() {
      if (cancelled || !container || !window.Twitch) return;
      container.innerHTML = "";
      const embed = new window.Twitch.Embed(container, {
        width: "100%",
        height: "100%",
        channel: TWITCH_CHANNEL,
        parent: [window.location.hostname],
        layout: "video",
        autoplay: true,
        muted: true,
      });
      embed.addEventListener(window.Twitch.Player.ONLINE, () => reportChannelLive(true));
      embed.addEventListener(window.Twitch.Player.OFFLINE, () => reportChannelLive(false));
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
  }, [reportChannelLive]);

  return (
    <div id="station-live-tv" className="relative w-full" style={{ aspectRatio: "1280 / 825" }}>
      {/* Screen — video when live, countdown when not; sits under the frame PNG */}
      <div
        className="absolute z-0 overflow-hidden bg-[#080605]"
        style={{ left: SCREEN_WINDOW.left, top: SCREEN_WINDOW.top, width: SCREEN_WINDOW.width, height: SCREEN_WINDOW.height }}
      >
        <div ref={embedContainerRef} className="w-full h-full" />
        {!isLive && (
          <div className="absolute inset-0 bg-[#080605] flex flex-col items-center justify-center text-center px-3">
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

      {/* CTA click zones over the baked-in text — open in a new tab */}
      <a
        href={TWITCH_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join the chat on Twitch"
        className="absolute z-[2]"
        style={{ left: CHAT_ZONE.left, top: CHAT_ZONE.top, width: CHAT_ZONE.width, height: CHAT_ZONE.height }}
      />
      <a
        href={`/live-stream/?station=${stationId}`}
        onClick={(e) => {
          e.preventDefault();
          const w = Math.min(1280, window.screen.availWidth);
          const h = Math.min(825, window.screen.availHeight - 60);
          window.open(
            `/live-stream/?popout=true&station=${stationId}`,
            "WJRNLiveTV",
            `width=${w},height=${h},resizable=yes,scrollbars=no`
          );
        }}
        aria-label="Pop out the live TV"
        className="absolute z-[2]"
        style={{ left: LOGO_ZONE.left, top: LOGO_ZONE.top, width: LOGO_ZONE.width, height: LOGO_ZONE.height }}
      />
      <a
        href={INSTAGRAM_URL[stationId]}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow us on Instagram"
        className="absolute z-[2]"
        style={{ left: FOLLOW_ZONE.left, top: FOLLOW_ZONE.top, width: FOLLOW_ZONE.width, height: FOLLOW_ZONE.height }}
      />
    </div>
  );
}
