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

export type WeatherMode = "static" | "dynamic";
export type PrecipitationKind = "none" | "rain" | "thunderstorm" | "snow" | "snowstorm";
export type IceHaloMode = "auto" | "on" | "off";

/**
 * One of DCS's three fixed-altitude wind layers. `altitudeFt` is the layer's
 * reference altitude (ground/mid/high) - not user-editable, only direction
 * and velocity are.
 */
export interface WindLayer {
  altitudeFt: number;
  /** Direction the wind is blowing FROM, degrees true (0-360). */
  directionDeg: number;
  velocityKt: number;
}

/** Mission-wide weather snapshot, mirroring the fields a DCS mission itself stores. */
export interface MissionWeather {
  mode?: WeatherMode;
  /** Ground, mid-altitude, and high-altitude wind layers, low to high. */
  wind?: [WindLayer, WindLayer, WindLayer];
  cloudBaseFt?: number;
  cloudThicknessFt?: number;
  /** Sky coverage in oktas (0-8). */
  cloudCoverageOktas?: number;
  iceHalo?: IceHaloMode;
  precipitation?: PrecipitationKind;
  /** Name of the last-applied weather preset, if any (purely informational). */
  preset?: string;
  fogEnabled?: boolean;
  fogVisibilityFt?: number;
  fogThicknessFt?: number;
  dustEnabled?: boolean;
  dustVisibilityFt?: number;
  /** Turbulence, ft/s. */
  turbulence?: number;
  temperatureC?: number;
  qnhHpa?: number;

  /** @deprecated superseded by `qnhHpa`; kept only so old saved missions still parse. */
  qnhInHg?: number;
  /** @deprecated superseded by `wind`; kept only so old saved missions still parse. */
  windSpeedKt?: number;
  /** @deprecated superseded by `wind`; kept only so old saved missions still parse. */
  windDirectionDeg?: number;
  /** @deprecated superseded by `fogVisibilityFt`/`dustVisibilityFt`; kept only so old saved missions still parse. */
  visibilityKm?: number;
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
