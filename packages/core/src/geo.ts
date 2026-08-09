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
