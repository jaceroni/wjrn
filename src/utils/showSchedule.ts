// Weekly live-show schedule for the three stations — all three shows go out on
// the same Twitch channel, so "which station is live" is decided by weekday
// (Pacific), not by anything the Twitch embed itself reports.

export const SHOW_HOUR_PACIFIC = 19; // 7:00 PM

// Weekday numbers follow Date#getUTCDay (0 = Sunday).
export const SHOW_WEEKDAY: Record<string, number> = {
  rock_garden: 2,     // Tuesday
  bridge_city: 3,     // Wednesday
  golden_boombox: 4,  // Thursday
};

const STATION_SLUG: Record<string, string> = {
  rock_garden: "/the-rock-garden",
  bridge_city: "/bridge-city-hang-suite",
  golden_boombox: "/the-golden-boombox",
};

export function stationSlug(stationId: string): string | undefined {
  return STATION_SLUG[stationId];
}

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const pacificParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  hourCycle: "h23",
  year: "numeric", month: "numeric", day: "numeric",
  hour: "numeric", minute: "numeric", second: "numeric",
  weekday: "short",
});

function getPacific(date: Date) {
  const p: Record<string, string> = {};
  for (const part of pacificParts.formatToParts(date)) p[part.type] = part.value;
  return {
    year: +p.year, month: +p.month, day: +p.day,
    hour: +p.hour, minute: +p.minute, second: +p.second,
    weekday: WEEKDAY_INDEX[p.weekday],
  };
}

// The show "day" rolls over at 4 AM Pacific, not midnight, so a Tuesday show that
// runs past midnight still counts as Tuesday's.
const DAY_ROLLOVER_HOURS = 4;

export function getShowDayWeekday(now: Date = new Date()): number {
  return getPacific(new Date(now.getTime() - DAY_ROLLOVER_HOURS * 3600_000)).weekday;
}

/** Which station's show day it is right now (Pacific), or null on a non-show day. */
export function getStationForToday(now: Date = new Date()): string | null {
  const weekday = getShowDayWeekday(now);
  for (const [stationId, day] of Object.entries(SHOW_WEEKDAY)) {
    if (day === weekday) return stationId;
  }
  return null;
}

// Pacific wall-clock time -> real UTC instant (DST-safe: re-derives the offset
// at the candidate instant instead of assuming a fixed -7/-8).
function pacificWallToUtcMs(year: number, month: number, day: number, hour: number): number {
  const guess = Date.UTC(year, month - 1, day, hour, 0, 0);
  const offsetAt = (t: number) => {
    const p = getPacific(new Date(t));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000;
  };
  let utc = guess - offsetAt(guess);
  utc = guess - offsetAt(utc);
  return utc;
}

/** Milliseconds until the next 7 PM Pacific on the given weekday. */
export function msUntilNextShow(weekday: number, now: Date = new Date()): number {
  const today = getPacific(now);
  for (let offset = 0; offset <= 7; offset++) {
    if ((today.weekday + offset) % 7 !== weekday) continue;
    // Date.UTC normalizes day overflow into the next month for us.
    const d = new Date(Date.UTC(today.year, today.month - 1, today.day + offset));
    const target = pacificWallToUtcMs(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), SHOW_HOUR_PACIFIC);
    if (target > now.getTime()) return target - now.getTime();
  }
  return Infinity;
}

export function formatCountdown(ms: number): string {
  if (!isFinite(ms)) return "Searching next show...";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`, `${seconds}s`);
  return parts.join(" ");
}
