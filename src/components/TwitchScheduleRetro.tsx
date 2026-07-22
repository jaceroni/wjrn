import { useState, useEffect, useRef } from "react";
import { Tv, Calendar, Bell, ArrowRight } from "lucide-react";

declare global {
  interface Window {
    Twitch?: any;
  }
}

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
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const embedRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setParentDomain(window.location.hostname);
    }
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
  }, [twitchChannel, parentDomain]);

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

  return (
    <div id="twitch_schedule_module" className="bg-gradient-to-b from-[#0a0706] to-[#040303] backdrop-blur-xl border border-purple-500/15 hover:border-purple-500/55 rounded-3xl p-6 relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-0.5 shadow-xl animate-fade-in group">
      {/* Top accent strip */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
      {/* Dotted pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.012)_1.5px,transparent_1.5px)] bg-[size:24px_24px] pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Description & Weekly Schedule Timeline */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-end gap-3 mb-3">
              <Tv className="w-8 h-8 text-purple-500 animate-pulse shrink-0 mb-0.5" />
              <h3 className="font-display font-bold text-xl sm:text-2xl text-[#faf6f0] uppercase tracking-normal leading-none">
                WATCH, LISTEN, & CHAT LIVE!
              </h3>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6 font-light">
              Tune in LIVE for our on-camera shows three times a week on Twitch.tv! Experience interactive chats, unique visuals, redemptions, and live camera views of the WJRN broadcast studio. For continuous music and replays of past tributes, tune into our 24/7 audio-only stations above!
            </p>

            <div className="flex items-center gap-2 mb-3.5">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-mono uppercase text-white tracking-widest font-semibold">WEEKLY LIVE BROADCAST SCHEDULE</span>
            </div>

            <div className="space-y-3">
              {BROADCAST_EVENTS.map((evt, idx) => {
                let showColor = "#b5945b"; // Default theme gold
                if (evt.title.includes("Rock Garden")) showColor = "#74b338"; // rock green
                if (evt.title.includes("Bridge City")) showColor = "#ff0066"; // bridge pink
                if (evt.title.includes("Golden Boombox")) showColor = "#e2ac00"; // golden yellow
                
                return (
                  <div 
                    key={idx} 
                    className="group/item flex items-start gap-3.5 p-3 rounded-xl bg-[#090605]/80 border border-white/5 hover:bg-[#0b0807]/90 hover:border-white/10 transition-all duration-200"
                  >
                    <div className="w-20 shrink-0">
                      <div className="text-xs font-mono font-bold uppercase" style={{ color: showColor }}>{evt.day}</div>
                      <div className="text-[10px] font-mono text-neutral-500 tracking-tighter truncate">{evt.time.split(" ")[0]} {evt.time.split(" ")[1]}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-[#faf6f0] group-hover/item:brightness-125 transition-all">
                        {evt.title}
                      </h4>
                      <p className="text-[11px] text-neutral-400 leading-normal line-clamp-1 mt-0.5">
                        {evt.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 mt-4 text-xs text-neutral-400 flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
            <span>
              LIVE Every Tuesday, Wednesday, and Friday @ 7PM PT on Twitch.tv
            </span>
          </div>
        </div>

        {/* Right Column: Twitch Live Stream Player & Countdown Overlay */}
        <div className="lg:col-span-7 flex flex-col justify-center gap-4">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/5 bg-[#080605] shadow-inner group">
            
            {/* Live stream player embed (Twitch Embed SDK — reports real ONLINE/OFFLINE status) */}
            <div
              id="twitch-live-embed"
              ref={embedContainerRef}
              className="absolute top-0 left-0 w-full h-full z-0"
            />

            {/* Countdown Overlay (Hidden if stream is active) */}
            {!isLiveActive && (
              <div className="absolute inset-0 bg-[#080605]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 transition-opacity duration-500">
                <p className="text-xs font-mono text-neutral-400 mb-2 uppercase tracking-wider">
                  NEXT LIVE STREAM COUNTDOWN:
                </p>
                <div className="font-mono text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-2 select-all">
                  <span className="font-mono tabular-nums" style={{ color: "#b5945b" }}>{countdownText}</span>
                </div>
              </div>
            )}

            {/* Live Indicator overlay if live is active */}
            {isLiveActive && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-red-600/90 hover:bg-red-600 backdrop-blur-sm text-white font-mono text-[10px] font-bold tracking-wider uppercase rounded-full shadow-lg transition-colors cursor-pointer select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-white absolute"></span>
                <span>LIVE NOW</span>
              </div>
            )}

          </div>

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
