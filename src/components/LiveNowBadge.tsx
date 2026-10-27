import { useEffect, useState, type MouseEvent } from "react";
import { X } from "lucide-react";
import { navigate } from "../navigate";
import { usePlayer } from "../context/PlayerContext";
import { useLiveStatus } from "../context/LiveStatusContext";
import { stationSlug } from "../utils/showSchedule";
import liveBadge from "../assets/images/wjrn-twitch-live-badge.png";

const DISMISS_KEY = "wjrn-live-badge-dismissed";
const MINI_PLAYER_HEIGHT = 83;

// Element ids the badge points at: station pages have the big TV, the homepage has the Twitch card.
const STATION_TV_ID = "station-live-tv";
const HOME_TWITCH_ID = "twitch_schedule_module";

function scrollToWhenReady(id: string, tries = 20) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  } else if (tries > 0) {
    setTimeout(() => scrollToWhenReady(id, tries - 1), 100);
  }
}

export default function LiveNowBadge() {
  const { isChannelLive, liveStationId } = useLiveStatus();
  const { isMiniPlayerVisible } = usePlayer();
  const [path, setPath] = useState(() => window.location.pathname);
  const [targetInView, setTargetInView] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  });

  const slug = liveStationId ? stationSlug(liveStationId) : undefined;
  const targetPath = slug ?? "/";
  const targetId = slug ? STATION_TV_ID : HOME_TWITCH_ID;
  const onTargetPage = path === targetPath || path.startsWith(targetPath + "/");

  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener("popstate", sync);
    window.addEventListener("spa-navigate", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("spa-navigate", sync);
    };
  }, []);

  // Hide the badge while the TV it points at is already on screen.
  useEffect(() => {
    setTargetInView(false);
    if (!isChannelLive || !onTargetPage) return;
    let observer: IntersectionObserver | undefined;
    const timer = setTimeout(() => {
      const el = document.getElementById(targetId);
      if (!el) return;
      observer = new IntersectionObserver((entries) => setTargetInView(entries[0]?.isIntersecting ?? false), { threshold: 0.35 });
      observer.observe(el);
    }, 150);
    return () => { clearTimeout(timer); observer?.disconnect(); };
  }, [isChannelLive, onTargetPage, targetId, path]);

  if (!isChannelLive || dismissed || targetInView) return null;

  const handleClick = () => {
    if (!onTargetPage) navigate(targetPath);
    scrollToWhenReady(targetId);
  };

  const handleDismiss = (e: MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* storage unavailable — dismissal just won't persist */ }
  };

  return (
    <div
      className="fixed right-3 md:right-6 z-40 transition-[bottom] duration-300 ease-in-out"
      style={{ bottom: (isMiniPlayerVisible ? MINI_PLAYER_HEIGHT : 0) + 12 }}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label="Live now — watch the broadcast"
        className="live-badge-pulse block w-[104px] md:w-[136px]"
      >
        <img src={liveBadge} alt="" draggable={false} className="w-full h-auto block select-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]" />
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss live notification"
        className="absolute -top-1 -left-1 w-5 h-5 flex items-center justify-center rounded-full bg-[#120e0b] border border-[#f3ede2]/30 text-[#f3ede2]/80 hover:text-[#f3ede2]"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
