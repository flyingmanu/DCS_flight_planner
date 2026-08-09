import { forward as mgrsForward } from "mgrs";
import type { LatLon } from "./geo.js";

/** MGRS grid reference (default 5-digit easting/northing, i.e. 1 m precision). */
export function toMgrs(point: LatLon, accuracy = 5): string {
  return mgrsForward([point.lon, point.lat], accuracy);
}

function formatDdmComponent(value: number, positive: string, negative: string, degreeDigits: number): string {
  const hemisphere = value >= 0 ? positive : negative;
  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minutes = (abs - degrees) * 60;
  return `${hemisphere}${String(degrees).padStart(degreeDigits, "0")}°${minutes.toFixed(3).padStart(6, "0")}'`;
}

/** Latitude in degrees/decimal-minutes, e.g. "N43°25.310'". */
export function formatLatDdm(lat: number): string {
  return formatDdmComponent(lat, "N", "S", 2);
}

/** Longitude in degrees/decimal-minutes, e.g. "E040°15.220'". */
export function formatLonDdm(lon: number): string {
  return formatDdmComponent(lon, "E", "W", 3);
}

/** Lat/lon in degrees/decimal-minutes (aviation DDM style, e.g. F-16 ICP), e.g. "N43°25.310' E040°15.220'". */
export function formatLatLonDdm(point: LatLon): string {
  return `${formatLatDdm(point.lat)} ${formatLonDdm(point.lon)}`;
}

const DDM_PATTERN = /^\s*([NSEW])\s*0*(\d{1,3})\s*°?\s*(\d{1,2}(?:\.\d+)?)\s*'?\s*$/i;

function parseDdmComponent(raw: string, positive: string, negative: string, maxAbs: number): number | null {
  const match = DDM_PATTERN.exec(raw);
  if (!match) return null;
  const [, hemisphere, degStr, minStr] = match;
  const upper = hemisphere!.toUpperCase();
  const sign = upper === positive ? 1 : upper === negative ? -1 : null;
  if (sign === null) return null;
  const degrees = Number.parseInt(degStr!, 10);
  const minutes = Number.parseFloat(minStr!);
  if (!Number.isFinite(degrees) || !Number.isFinite(minutes) || minutes >= 60) return null;
  const value = sign * (degrees + minutes / 60);
  return Math.abs(value) <= maxAbs ? value : null;
}

/** Parses a DDM latitude string (e.g. "N43°25.310'"), or null if not a valid latitude. */
export function parseLatDdm(raw: string): number | null {
  return parseDdmComponent(raw, "N", "S", 90);
}

/** Parses a DDM longitude string (e.g. "E040°15.220'"), or null if not a valid longitude. */
export function parseLonDdm(raw: string): number | null {
  return parseDdmComponent(raw, "E", "W", 180);
}
