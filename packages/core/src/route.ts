import { casToTasKt, machNumber, tasToCasKt } from "./atmosphere.js";
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
  /** Calibrated airspeed at `to`, kt - derived from `to.airspeedKt`/`speedType`/`altitudeFt` via the ISA model. Undefined for GS (no wind data to back out an airspeed) or a missing altitude/speed. */
  casKt?: number;
  /** True airspeed at `to`, kt - same availability as `casKt`. */
  tasKt?: number;
  /** Mach number at `to` - same availability as `casKt`. */
  mach?: number;
}

/** Leg-by-leg distance/track/ETE/CAS/TAS/Mach for a flight's route (Combat Flite-style leg table). */
export function computeRouteLegs(route: Waypoint[]): RouteLeg[] {
  const legs: RouteLeg[] = [];
  for (let i = 1; i < route.length; i++) {
    const from = route[i - 1]!;
    const to = route[i]!;
    const legDistanceNm = distanceNm(from.position, to.position);
    const trackDeg = bearingDeg(from.position, to.position);
    const eteMin = to.airspeedKt ? (legDistanceNm / to.airspeedKt) * 60 : undefined;

    // Treats altitudeFt as MSL regardless of altitudeReference - an AGL waypoint
    // over high terrain will read a slightly optimistic CAS/TAS split, but core
    // has no ground-elevation lookup to correct for it (that's browser-side).
    let casKt: number | undefined;
    let tasKt: number | undefined;
    let mach: number | undefined;
    if (to.airspeedKt && to.altitudeFt !== undefined && to.speedType !== "GS") {
      if (to.speedType === "TAS") {
        tasKt = to.airspeedKt;
        casKt = tasToCasKt(tasKt, to.altitudeFt);
      } else {
        casKt = to.airspeedKt;
        tasKt = casToTasKt(casKt, to.altitudeFt);
      }
      mach = machNumber(tasKt, to.altitudeFt);
    }

    legs.push({ from, to, distanceNm: legDistanceNm, trackDeg, eteMin, casKt, tasKt, mach });
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

/**
 * Cumulative ETA per waypoint, cascading from the flight's takeoff time.
 * A waypoint with `totLocked` and a `tot` set overrides the cascade at that
 * point: its own ETA becomes the locked TOT, and every following waypoint's
 * ETA is computed from that TOT instead of the original takeoff time - i.e.
 * a locked waypoint acts as a new time anchor for the rest of the route.
 * `legs` must be `computeRouteLegs(route)` for the same route.
 */
export function computeWaypointEtas(route: Waypoint[], legs: RouteLeg[], takeoffTime?: string): (string | null)[] {
  const etas: (string | null)[] = [];
  let anchorTime = takeoffTime ?? null;
  let cumMin = 0;
  let cumValid = anchorTime !== null;

  for (let i = 0; i < route.length; i++) {
    const wp = route[i]!;
    if (i > 0) {
      const leg = legs[i - 1];
      if (!leg || leg.eteMin === undefined) cumValid = false;
      cumMin += leg?.eteMin ?? 0;
    }
    if (wp.totLocked && wp.tot) {
      etas.push(wp.tot);
      anchorTime = wp.tot;
      cumMin = 0;
      cumValid = true;
      continue;
    }
    etas.push(cumValid && anchorTime ? addMinutesToClock(anchorTime, cumMin) : null);
  }
  return etas;
}
