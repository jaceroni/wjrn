import { useState, useEffect, useRef } from "react";
import { Tv, Calendar, ArrowRight } from "lucide-react";
import twitchCardBg from "../assets/images/twitch-card-bg.png";
import twitchCardBgKo from "../assets/images/twitch-card-bg-ko.png";
import twitchCardBgMobile from "../assets/images/twitch-card-bg-mobile.png";
import twitchCardBgKoMobile from "../assets/images/twitch-card-bg-ko-mobile.png";

declare global {
  interface Window {
    Twitch?: any;
  }
}

// Measured against the native twitch-card-bg(-ko).png canvas (923x388).
// The KO variant has a transparent cutout at this exact spot so the live video shows through
// its glass "window" — same faceplate-with-knockout technique as the vintage player.
const SCREEN_WINDOW = { left: "47.887%", top: "19.588%", width: "41.170%", height: "50.258%" };
const LEFT_PANEL = { left: "4%", right: "59%", top: "13%", bottom: "6%" };
// The blank cabinet space below the screen (screen bottom is at 19.588+50.258=69.846%),
// still inside the wood frame — the join button sits here, not below the whole card.
const JOIN_BUTTON_ZONE = { left: SCREEN_WINDOW.left, width: SCREEN_WINDOW.width, top: "75%", bottom: "0%" };

// Measured against the native twitch-card-bg(-ko)-mobile.png canvas (582x657) — screen on top,
// schedule content below, used below the "md" breakpoint where the wide layout has no room.
const MOBILE_SCREEN_WINDOW = { left: "17.354%", top: "11.568%", width: "65.292%", height: "29.680%" };
const MOBILE_CONTENT_ZONE = { left: "7%", right: "7%", top: "44%", bottom: "5%" };
const DESKTOP_BREAKPOINT_QUERY = "(min-width: 768px)";

interface BroadcastEvent {
  day: string;
  time: string;
  title: string;
  description: string;
}

const BROADCAST_EVENTS: BroadcastEvent[] = [
  {
    day: "Tuesday",
    time: "7:00 PM - 9:00 PM PST",
    title: "The Rock Garden",
    description: "All Vinyl Classic Rock, Funk, Blues, & Jazz."
  },
  {
    day: "Wednesday",
    time: "7:00 PM - 9:30 PM PST",
    title: "Bridge City Hang Suite",
    description: "Grownfolk R&B, Soul, & Electronica."
  },
  {
    day: "Friday",
    time: "7:00 PM - 11:00 PM PST",
    title: "The Golden Boombox",
    description: "Golden Era & Future Classic Hip-Hop."
  }
];

interface TwitchScheduleProps {
  twitchChannel: string;
  scheduledDaysText: string;
}

export default function TwitchSchedule({ twitchChannel, scheduledDaysText }: TwitchScheduleProps) {
  const [countdownText, setCountdownText] = useState("");
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [parentDomain, setParentDomain] = useState("radio.jacewonmusic.com");
  const [isDesktopLayout, setIsDesktopLayout] = useState(true);
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const embedRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setParentDomain(window.location.hostname);
    }
  }, []);

  // Below this breakpoint the wide cabinet graphic has no room for the schedule list, so we
  // swap to the mobile graphic (screen on top, content below) instead of shrinking text forever.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(DESKTOP_BREAKPOINT_QUERY);
    setIsDesktopLayout(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktopLayout(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Mount the official Twitch Embed SDK so we get real ONLINE/OFFLINE events
  // instead of guessing live status from the broadcast schedule.
  useEffect(() => {
    if (typeof window === "undefined" || !embedContainerRef.current) return;

    let cancelled = false;

    function createEmbed() {
      if (cancelled || !embedContainerRef.current || !window.Twitch) return;
      embedContainerRef.current.innerHTML = "";
      const embed = new window.Twitch.Embed(embedContainerRef.current, {
        width: "100%",
        height: "100%",
        channel: twitchChannel,
        parent: [parentDomain],
        layout: "video",
        autoplay: true,
        muted: true,
      });
      embedRef.current = embed;
      embed.addEventListener(window.Twitch.Embed.VIDEO_READY, () => {
        const player = embed.getPlayer();
        player.addEventListener(window.Twitch.Player.ONLINE, () => setIsLiveActive(true));
        player.addEventListener(window.Twitch.Player.OFFLINE, () => setIsLiveActive(false));
      });
    }

    if (window.Twitch) {
      createEmbed();
    } else {
      const existingScript = document.getElementById("twitch-embed-sdk");
      if (existingScript) {
        existingScript.addEventListener("load", createEmbed);
      } else {
        const script = document.createElement("script");
        script.id = "twitch-embed-sdk";
        script.src = "https://embed.twitch.tv/embed/v1.js";
        script.async = true;
        script.onload = createEmbed;
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
    };
    // isDesktopLayout is included so the embed remounts into whichever container
    // (desktop or mobile) is actually in the DOM after a breakpoint switch.
  }, [twitchChannel, parentDomain, isDesktopLayout]);

  useEffect(() => {
    function calculateCountdown() {
      const now = new Date();
      
      // Target days: 2 (Tuesday), 3 (Wednesday), 5 (Friday)
      const targetDays = [2, 3, 5];
      const targetHour = 19; // 7:00 PM Pacific (19:00)
      const targetMinute = 0;

      // Convert target time from PST/PDT (approx. UTC-7 or UTC-8)
      // Let's assume absolute Pacific Time.
      // To calculate accurately: Pacific is UTC-7 (PDT, June is Summer Time!)
      // If PDT is UTC-7, then 7 PM PDT is 19:00 + 7 = 02:00 UTC (the next day, e.g., Wednesday morning instead of Tuesday evening UTC)
      // Instead of complex timezones, let's write a robust, reliable offset-based countdown:
      // Pacific timezone offset is roughly -7 hours during daylight savings (March to Nov).
      const pacificOffset = -7 * 60; // in minutes
      const localOffset = now.getTimezoneOffset(); // in minutes
      const diffMinutes = localOffset - pacificOffset; // offset difference to add to local time to get Pacific
      
      // Find the next occurrence
      let minDiffMs = Infinity;

      // Check all target days
      targetDays.forEach((targetDay) => {
        for (let weekOffset = 0; weekOffset <= 1; weekOffset++) {
          const targetDate = new Date(now);
          // Set target hour/minute in Pacific Time
          // To do this, calculate UTC equivalent of target Pacific time:
          // 7 PM Pacific -> 19:00 Pacific -> +7 hours = 02:00 UTC next calendar day (Tues 7PM Pac -> Wed 2AM UTC)
          let targetUTCHour = targetHour + 7; // Assuming 7 hours offset
          let targetUTCDay = targetDay;
          if (targetUTCHour >= 24) {
            targetUTCHour -= 24;
            targetUTCDay = (targetDay + 1) % 7;
          }

          // Adjust date to the target weekday
          const currentDay = targetDate.getUTCDay();
          let dayDiff = targetUTCDay - currentDay;
          if (dayDiff < 0 || (dayDiff === 0 && (now.getUTCHours() > targetUTCHour || (now.getUTCHours() === targetUTCHour && now.getUTCMinutes() > targetMinute)))) {
            dayDiff += 7;
          }
          dayDiff += weekOffset * 7;

          targetDate.setUTCDate(targetDate.getUTCDate() + dayDiff);
          targetDate.setUTCHours(targetUTCHour, targetMinute, 0, 0);

          const diffMs = targetDate.getTime() - now.getTime();

          if (diffMs > 0 && diffMs < minDiffMs) {
            minDiffMs = diffMs;
          }
        }
      });

      if (minDiffMs === Infinity) {
        setCountdownText("Searching next show...");
        return;
      }

      // Convert ms to Days, Hours, Minutes, Seconds
      const days = Math.floor(minDiffMs / (24 * 60 * 60 * 1000));
      const hours = Math.floor((minDiffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((minDiffMs % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((minDiffMs % (60 * 1000)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setCountdownText(parts.join(" "));
    }

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isDesktopLayout) {
    return (
      <div className="flex flex-col gap-4">
        <div id="twitch_schedule_module" className="rounded-2xl relative overflow-hidden shadow-xl animate-fade-in group">

          {/* Live stream video — sits under the cabinet graphic; only visible through the KO cutout */}
          <div
            className="absolute z-0 overflow-hidden rounded-2xl bg-[#080605]"
            style={{ left: MOBILE_SCREEN_WINDOW.left, top: MOBILE_SCREEN_WINDOW.top, width: MOBILE_SCREEN_WINDOW.width, height: MOBILE_SCREEN_WINDOW.height }}
          >
            <div id="twitch-live-embed" ref={embedContainerRef} className="w-full h-full" />
          </div>

          {/* Vintage TV cabinet graphic (mobile proportions) — normal glass when idle, knockout window once live */}
          <img
            src={isLiveActive ? twitchCardBgKoMobile : twitchCardBgMobile}
            alt=""
            draggable={false}
            className="relative z-[1] w-full h-auto block select-none pointer-events-none"
          />

          {/* Screen contents overlay — countdown when idle, LIVE badge once live */}
          <div
            className="absolute z-[2] pointer-events-none"
            style={{ left: MOBILE_SCREEN_WINDOW.left, top: MOBILE_SCREEN_WINDOW.top, width: MOBILE_SCREEN_WINDOW.width, height: MOBILE_SCREEN_WINDOW.height }}
          >
            {!isLiveActive && (
              <div className="w-full h-full flex flex-col items-center justify-center text-center px-2">
                <p className="text-[8px] font-mono text-neutral-400 mb-1 uppercase tracking-wider">
                  NEXT LIVE STREAM COUNTDOWN:
                </p>
                <div className="font-mono text-base font-bold tracking-tight select-all">
                  <span className="font-mono tabular-nums" style={{ color: "#b5945b" }}>{countdownText}</span>
                </div>
              </div>
            )}
            {isLiveActive && (
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-2 py-0.5 bg-red-600/90 backdrop-blur-sm text-white font-mono text-[8px] font-bold tracking-wider uppercase rounded-full shadow-lg select-none pointer-events-auto">
                <span className="h-1 w-1 rounded-full bg-white animate-ping"></span>
                <span className="h-1 w-1 rounded-full bg-white absolute"></span>
                <span>LIVE NOW</span>
              </div>
            )}
          </div>

          {/* Content — title, description & weekly schedule timeline, below the screen */}
          <div
            className="absolute z-[2]"
            style={{ left: MOBILE_CONTENT_ZONE.left, right: MOBILE_CONTENT_ZONE.right, top: MOBILE_CONTENT_ZONE.top, bottom: MOBILE_CONTENT_ZONE.bottom }}
          >
            <div className="flex items-end gap-2 mb-1.5">
              <Tv className="w-5 h-5 text-purple-500 animate-pulse shrink-0 mb-0.5" />
              <h3 className="font-display font-bold text-sm text-[#faf6f0] uppercase tracking-normal leading-tight">
                WATCH, LISTEN, & CHAT LIVE!
              </h3>
            </div>
            <p className="text-[10px] text-neutral-400 leading-snug mb-2 font-light line-clamp-2">
              Tune in LIVE for our on-camera shows three times a week on Twitch.tv! Experience interactive chats, unique visuals, redemptions, and live camera views of the WJRN broadcast studio.
            </p>

            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3 h-3 text-purple-500" />
              <span className="text-[9px] font-mono uppercase text-white tracking-widest font-semibold">WEEKLY LIVE BROADCAST SCHEDULE</span>
            </div>

            <div className="space-y-1">
              {BROADCAST_EVENTS.map((evt, idx) => {
                let showColor = "#b5945b"; // Default theme gold
                if (evt.title.includes("Rock Garden")) showColor = "#74b338"; // rock green
                if (evt.title.includes("Bridge City")) showColor = "#ff0066"; // bridge pink
                if (evt.title.includes("Golden Boombox")) showColor = "#e2ac00"; // golden yellow

                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-1 rounded-lg bg-[#090605]/80 border border-white/5"
                  >
                    <div className="w-14 shrink-0">
                      <div className="text-[9px] font-mono font-bold uppercase" style={{ color: showColor }}>{evt.day}</div>
                      <div className="text-[8px] font-mono text-neutral-500 tracking-tighter truncate">{evt.time.split(" ")[0]} {evt.time.split(" ")[1]}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[10px] font-semibold text-[#faf6f0] truncate">
                        {evt.title}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* JOIN THE LIVE CHAT — full width, matching the content zone below */}
        <div className="flex" style={{ paddingLeft: MOBILE_CONTENT_ZONE.left, paddingRight: MOBILE_CONTENT_ZONE.right }}>
          <a
            href="https://www.twitch.tv/jacewonmusic"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-4 rounded-xl border border-purple-500/50 bg-purple-500/20 text-purple-100 text-[11px] font-mono font-extrabold uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 hover:bg-purple-500 hover:border-purple-500 hover:text-black cursor-pointer"
          >
            JOIN THE LIVE CHAT <span className="hidden sm:inline">ON TWITCH.TV</span> <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div id="twitch_schedule_module" className="rounded-2xl relative overflow-hidden shadow-xl animate-fade-in group">

        {/* Live stream video — sits under the cabinet graphic; only visible through the KO cutout */}
        <div
          className="absolute z-0 overflow-hidden rounded-2xl bg-[#080605]"
          style={{ left: SCREEN_WINDOW.left, top: SCREEN_WINDOW.top, width: SCREEN_WINDOW.width, height: SCREEN_WINDOW.height }}
        >
          <div id="twitch-live-embed" ref={embedContainerRef} className="w-full h-full" />
        </div>

        {/* Vintage TV cabinet graphic — normal glass when idle, knockout window once live */}
        <img
          src={isLiveActive ? twitchCardBgKo : twitchCardBg}
          alt=""
          draggable={false}
          className="relative z-[1] w-full h-auto block select-none pointer-events-none"
        />

        {/* Screen contents overlay — countdown when idle, LIVE badge once live */}
        <div
          className="absolute z-[2] pointer-events-none"
          style={{ left: SCREEN_WINDOW.left, top: SCREEN_WINDOW.top, width: SCREEN_WINDOW.width, height: SCREEN_WINDOW.height }}
        >
          {!isLiveActive && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center px-3">
              <p className="text-[10px] sm:text-xs font-mono text-neutral-400 mb-2 uppercase tracking-wider">
                NEXT LIVE STREAM COUNTDOWN:
              </p>
              <div className="font-mono text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight select-all">
                <span className="font-mono tabular-nums" style={{ color: "#b5945b" }}>{countdownText}</span>
              </div>
            </div>
          )}
          {isLiveActive && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 bg-red-600/90 hover:bg-red-600 backdrop-blur-sm text-white font-mono text-[10px] font-bold tracking-wider uppercase rounded-full shadow-lg transition-colors cursor-pointer select-none pointer-events-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping"></span>
              <span className="h-1.5 w-1.5 rounded-full bg-white absolute"></span>
              <span>LIVE NOW</span>
            </div>
          )}
        </div>

        {/* Left panel content — description & weekly schedule timeline */}
        <div
          className="absolute z-[2]"
          style={{ left: LEFT_PANEL.left, right: LEFT_PANEL.right, top: LEFT_PANEL.top, bottom: LEFT_PANEL.bottom }}
        >
          <div>
            <div className="flex items-end gap-2 xl:gap-3 mb-1.5 xl:mb-3">
              <Tv className="w-5 h-5 xl:w-8 xl:h-8 text-purple-500 animate-pulse shrink-0 mb-0.5" />
              <h3 className="font-display font-bold text-sm xl:text-2xl text-[#faf6f0] uppercase tracking-normal leading-tight xl:leading-none">
                WATCH, LISTEN, & CHAT LIVE!
              </h3>
            </div>
            <p className="text-[11px] xl:text-sm text-neutral-400 leading-snug xl:leading-relaxed mb-2 xl:mb-6 font-light line-clamp-3 xl:line-clamp-none">
              Tune in LIVE for our on-camera shows three times a week on Twitch.tv! Experience interactive chats, unique visuals, redemptions, and live camera views of the WJRN broadcast studio. For continuous music and replays of past tributes, tune into our 24/7 audio-only stations above!
            </p>

            <div className="flex items-center gap-2 mb-1 xl:mb-3.5">
              <Calendar className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-purple-500" />
              <span className="text-[10px] xl:text-xs font-mono uppercase text-white tracking-widest font-semibold">WEEKLY LIVE BROADCAST SCHEDULE</span>
            </div>

            <div className="space-y-1 xl:space-y-3">
              {BROADCAST_EVENTS.map((evt, idx) => {
                let showColor = "#b5945b"; // Default theme gold
                if (evt.title.includes("Rock Garden")) showColor = "#74b338"; // rock green
                if (evt.title.includes("Bridge City")) showColor = "#ff0066"; // bridge pink
                if (evt.title.includes("Golden Boombox")) showColor = "#e2ac00"; // golden yellow

                return (
                  <div
                    key={idx}
                    className="group/item flex items-start gap-2 xl:gap-3.5 p-1 xl:p-3 rounded-xl bg-[#090605]/80 border border-white/5 hover:bg-[#0b0807]/90 hover:border-white/10 transition-all duration-200"
                  >
                    <div className="w-16 xl:w-20 shrink-0">
                      <div className="text-[10px] xl:text-xs font-mono font-bold uppercase" style={{ color: showColor }}>{evt.day}</div>
                      <div className="text-[9px] xl:text-[10px] font-mono text-neutral-500 tracking-tighter truncate">{evt.time.split(" ")[0]} {evt.time.split(" ")[1]}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] xl:text-xs font-semibold text-[#faf6f0] group-hover/item:brightness-125 transition-all">
                        {evt.title}
                      </h4>
                      <p className="hidden xl:block text-[11px] text-neutral-400 leading-normal line-clamp-1 mt-0.5">
                        {evt.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* JOIN THE LIVE CHAT — in the blank cabinet space just below the screen, still inside the frame */}
        <div
          className="absolute z-[2] flex items-center"
          style={{ left: JOIN_BUTTON_ZONE.left, width: JOIN_BUTTON_ZONE.width, top: JOIN_BUTTON_ZONE.top, bottom: JOIN_BUTTON_ZONE.bottom }}
        >
          <a
            href="https://www.twitch.tv/jacewonmusic"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-4 rounded-xl border border-purple-500/50 bg-purple-500/20 text-purple-100 text-[11px] font-mono font-extrabold uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 hover:bg-purple-500 hover:border-purple-500 hover:text-black cursor-pointer"
          >
            JOIN THE LIVE CHAT <span className="hidden sm:inline">ON TWITCH.TV</span> <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
