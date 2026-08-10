import type { Bullseye } from "./bullseye.js";
import type { Flight } from "./flights.js";
import type { MissionObject } from "./objects.js";
import type { Package } from "./packages.js";

export interface MapView {
  center: [number, number];
  zoom: number;
}

/** Free-text mission briefing sections, mirroring Combat Flite's per-side text briefings. */
export interface MissionBriefing {
  situation?: string;
  blue?: string;
  red?: string;
  neutral?: string;
}

/** In-mission calendar date, mirroring DCS's mission.date table. */
export interface MissionDate {
  day: number;
  month: number;
  year: number;
}

/** Mission-wide weather snapshot, mirroring the fields a DCS mission itself stores. */
export interface MissionWeather {
  temperatureC?: number;
  qnhInHg?: number;
  windSpeedKt?: number;
  /** Direction the wind is blowing FROM, degrees true. */
  windDirectionDeg?: number;
  visibilityKm?: number;
  cloudBaseFt?: number;
  /** Sky coverage in oktas (0-8). */
  cloudCoverageOktas?: number;
  turbulence?: number;
}

/**
 * A named, saveable session tied to a theater: the map view and the
 * mission-specific objects placed on it (points, polygons...).
 */
export interface Mission {
  id: string;
  name: string;
  theaterId: string;
  createdAt: string;
  updatedAt: string;
  view: MapView;
  objects: MissionObject[];
  /** Optional for backward compatibility with missions saved before flights existed. */
  flights?: Flight[];
  /** At most one per side (blue/red/neutral). */
  bullseyes?: Bullseye[];
  /** COMAO/package groupings; flights reference these via Flight.packageId. */
  packages?: Package[];
  /** Free-text situation/per-side briefings. */
  briefing?: MissionBriefing;
  date?: MissionDate;
  weather?: MissionWeather;
}
