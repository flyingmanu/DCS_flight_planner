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
