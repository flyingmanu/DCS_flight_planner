import type { LatLon } from "./geo.js";
import type { Theater } from "./types.js";

/** A simulator the planner can target. Each has its own set of curated theaters. */
export type SimTarget = "dcs" | "bms" | "fs";

export const SIM_TARGET_LABEL: Record<SimTarget, string> = {
  dcs: "DCS World",
  bms: "Falcon BMS",
  fs: "Microsoft Flight Simulator",
};

/** A worldwide reference airport sourced from the OurAirports open dataset (large/medium airports only). */
export interface GlobalAirport {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: "large" | "medium";
  /** ISO 3166-1 alpha-2 country code. */
  country: string;
  icao: string | null;
  iata: string | null;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

/**
 * The lat/lon bounding box covering a theater's own curated airbases, padded
 * by marginDeg on every side. Used to mask out the worldwide OurAirports
 * reference layer where a theater's own curated data already covers the
 * ground - the theater's data takes precedence within its box.
 */
export function theaterBoundingBox(theater: Theater, marginDeg = 0.5): BoundingBox {
  const lats = theater.airbases.map((ab) => ab.position.lat);
  const lons = theater.airbases.map((ab) => ab.position.lon);
  return {
    minLat: Math.min(...lats) - marginDeg,
    maxLat: Math.max(...lats) + marginDeg,
    minLon: Math.min(...lons) - marginDeg,
    maxLon: Math.max(...lons) + marginDeg,
  };
}

export function isWithinBoundingBox(point: LatLon, box: BoundingBox): boolean {
  return point.lat >= box.minLat && point.lat <= box.maxLat && point.lon >= box.minLon && point.lon <= box.maxLon;
}
