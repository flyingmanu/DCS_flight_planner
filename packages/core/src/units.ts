const FEET_PER_METER = 3.28084;
const METERS_PER_NM = 1852;

export function metersToFeet(meters: number): number {
  return meters * FEET_PER_METER;
}

export function metersToNm(meters: number): number {
  return meters / METERS_PER_NM;
}

export function nmToMeters(nm: number): number {
  return nm * METERS_PER_NM;
}
