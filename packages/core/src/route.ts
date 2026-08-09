import { bearingDeg, distanceNm } from "./geo.js";
import type { Waypoint } from "./flights.js";

export interface RouteLeg {
  from: Waypoint;
  to: Waypoint;
  distanceNm: number;
  /** True track from `from` to `to`, in degrees. */
  trackDeg: number;
  /** Estimated time enroute, in minutes; undefined if `to.airspeedKt` isn't set. */
  eteMin?: number;
}

/** Leg-by-leg distance/track/ETE for a flight's route (Combat Flite-style leg table). */
export function computeRouteLegs(route: Waypoint[]): RouteLeg[] {
  const legs: RouteLeg[] = [];
  for (let i = 1; i < route.length; i++) {
    const from = route[i - 1]!;
    const to = route[i]!;
    const legDistanceNm = distanceNm(from.position, to.position);
    const trackDeg = bearingDeg(from.position, to.position);
    const eteMin = to.airspeedKt ? (legDistanceNm / to.airspeedKt) * 60 : undefined;
    legs.push({ from, to, distanceNm: legDistanceNm, trackDeg, eteMin });
  }
  return legs;
}

/** Total route distance in NM. */
export function totalRouteDistanceNm(route: Waypoint[]): number {
  return computeRouteLegs(route).reduce((sum, leg) => sum + leg.distanceNm, 0);
}

/** "H:MM:SS" (or "M:SS" under an hour) for a duration given in minutes. */
export function formatEte(minutes: number): string {
  const totalSeconds = Math.round(minutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

/** Adds `minutes` to a "HH:MM" clock time, wrapping around midnight. Returns null if `hhmm` isn't parseable. */
export function addMinutesToClock(hhmm: string, minutes: number): string | null {
  const match = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(hhmm);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || m >= 60) return null;

  const DAY_MINUTES = 24 * 60;
  const total = (((h * 60 + m + Math.round(minutes)) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
