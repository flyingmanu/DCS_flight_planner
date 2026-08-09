export interface LatLon {
  lat: number;
  lon: number;
}

const EARTH_RADIUS_KM = 6371;
const KM_PER_NM = 1.852;

/** Great-circle (haversine) distance between two points, in kilometers. */
export function distanceKm(a: LatLon, b: LatLon): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Great-circle distance between two points, in nautical miles. */
export function distanceNm(a: LatLon, b: LatLon): number {
  return distanceKm(a, b) / KM_PER_NM;
}

export interface LocalMeters {
  /** East offset from the origin, in meters. */
  x: number;
  /** North offset from the origin, in meters. */
  y: number;
}

/**
 * Equirectangular local-tangent-plane projection around `origin`. Accurate
 * enough for the scale of a mission's drawn shapes (tens of km); not meant
 * for long distances or anything crossing a pole.
 */
export function toLocalMeters(origin: LatLon, point: LatLon): LocalMeters {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const metersPerRad = EARTH_RADIUS_KM * 1000;
  const y = toRad(point.lat - origin.lat) * metersPerRad;
  const x = toRad(point.lon - origin.lon) * metersPerRad * Math.cos(toRad(origin.lat));
  return { x, y };
}

/** Inverse of toLocalMeters. */
export function fromLocalMeters(origin: LatLon, offset: LocalMeters): LatLon {
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const metersPerRad = EARTH_RADIUS_KM * 1000;
  const lat = origin.lat + toDeg(offset.y / metersPerRad);
  const lon = origin.lon + toDeg(offset.x / (metersPerRad * Math.cos((origin.lat * Math.PI) / 180)));
  return { lat, lon };
}
