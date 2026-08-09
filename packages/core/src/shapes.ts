import { fromLocalMeters, toLocalMeters, type LatLon, type LocalMeters } from "./geo.js";
import type { Hand } from "./objects.js";

const NM_TO_M = 1852;

/** Rotates a local offset clockwise by `deg` (compass convention: 0 = north, 90 = east). */
function rotateClockwise(v: LocalMeters, deg: number): LocalMeters {
  const rad = (deg * Math.PI) / 180;
  return {
    x: v.x * Math.cos(rad) + v.y * Math.sin(rad),
    y: -v.x * Math.sin(rad) + v.y * Math.cos(rad),
  };
}

/** Unit vector (east, north) pointing along a compass bearing. */
function bearingUnitVector(bearingDeg: number): LocalMeters {
  const rad = (bearingDeg * Math.PI) / 180;
  return { x: Math.sin(rad), y: Math.cos(rad) };
}

/**
 * The 4 corners of a rectangle whose unrotated diagonal runs from corner1 to
 * corner2, then rotated clockwise by rotationDeg around its center.
 */
export function rectangleCorners(
  corner1: LatLon,
  corner2: LatLon,
  rotationDeg: number,
): [LatLon, LatLon, LatLon, LatLon] {
  const c2Local = toLocalMeters(corner1, corner2);
  const half: LocalMeters = { x: c2Local.x / 2, y: c2Local.y / 2 };
  const center = fromLocalMeters(corner1, half);

  const relativeCorners: [LocalMeters, LocalMeters, LocalMeters, LocalMeters] = [
    { x: -half.x, y: -half.y },
    { x: half.x, y: -half.y },
    { x: half.x, y: half.y },
    { x: -half.x, y: half.y },
  ];
  const place = (corner: LocalMeters) => fromLocalMeters(center, rotateClockwise(corner, rotationDeg));

  return [place(relativeCorners[0]), place(relativeCorners[1]), place(relativeCorners[2]), place(relativeCorners[3])];
}

/** Points approximating a circle of `radiusM` around `center`. */
export function circlePoints(center: LatLon, radiusM: number, steps = 64): LatLon[] {
  const points: LatLon[] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 360;
    const offset = rotateClockwise({ x: 0, y: radiusM }, angle);
    points.push(fromLocalMeters(center, offset));
  }
  return points;
}

export interface OrbitTrackParams {
  center: LatLon;
  hand: Hand;
  /** Inbound course flown toward `center` (the holding fix), in degrees. */
  courseDeg: number;
  legLengthNm: number;
  /** Turn radius; real holds derive this from airspeed/bank, this is a fixed planning default. */
  turnRadiusNm?: number;
}

/**
 * Outline of a racetrack-shaped aeronautical orbit (holding pattern / AAR
 * anchor): two straight legs of legLengthNm joined by two turns of
 * turnRadiusNm, bulging to the given hand side of the inbound course.
 */
export function orbitTrackPoints({
  center,
  hand,
  courseDeg,
  legLengthNm,
  turnRadiusNm = 1,
}: OrbitTrackParams): LatLon[] {
  const u = bearingUnitVector(courseDeg); // inbound travel direction
  const vRight: LocalMeters = { x: u.y, y: -u.x };
  const v = hand === "right" ? vRight : { x: -vRight.x, y: -vRight.y };

  const L = legLengthNm * NM_TO_M;
  const r = turnRadiusNm * NM_TO_M;

  // c1: turn center at the fix end; c2: turn center at the far end.
  const c1: LocalMeters = { x: r * v.x, y: r * v.y };
  const c2: LocalMeters = { x: c1.x - L * u.x, y: c1.y - L * u.y };

  const steps = 24;
  const points: LocalMeters[] = [];

  // Near turn: from the fix (c1 - r*v) to c1 + r*v, swept clockwise through +u.
  const negV: LocalMeters = { x: -v.x, y: -v.y };
  for (let i = 0; i <= steps; i++) {
    const offset = rotateClockwise(negV, (i / steps) * 180);
    points.push({ x: c1.x + offset.x * r, y: c1.y + offset.y * r });
  }

  // Outbound straight leg: c1 + r*v -> c2 + r*v.
  points.push({ x: c2.x + r * v.x, y: c2.y + r * v.y });

  // Far turn: from c2 + r*v to c2 - r*v, swept clockwise through -u.
  for (let i = 0; i <= steps; i++) {
    const offset = rotateClockwise(v, (i / steps) * 180);
    points.push({ x: c2.x + offset.x * r, y: c2.y + offset.y * r });
  }

  // Back to the fix, closing the loop.
  points.push({ x: c1.x - r * v.x, y: c1.y - r * v.y });

  return points.map((p) => fromLocalMeters(center, p));
}
