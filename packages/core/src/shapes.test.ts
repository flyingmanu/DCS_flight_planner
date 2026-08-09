import { describe, expect, it } from "vitest";
import { distanceKm, toLocalMeters, type LatLon } from "./geo.js";
import { circlePoints, orbitTrackPoints, rectangleCorners } from "./shapes.js";

const ORIGIN: LatLon = { lat: 45, lon: 40 };

describe("rectangleCorners", () => {
  it("produces the right width/height for an unrotated rectangle", () => {
    const corner2 = { lat: ORIGIN.lat + 0.01, lon: ORIGIN.lon + 0.01 };
    const corners = rectangleCorners(ORIGIN, corner2, 0);
    expect(corners).toHaveLength(4);

    const width = distanceKm(corners[0], corners[1]) * 1000;
    const height = distanceKm(corners[1], corners[2]) * 1000;
    const expectedWidth = Math.abs(toLocalMeters(ORIGIN, corner2).x);
    const expectedHeight = Math.abs(toLocalMeters(ORIGIN, corner2).y);
    expect(width).toBeCloseTo(expectedWidth, 0);
    expect(height).toBeCloseTo(expectedHeight, 0);
  });

  it("keeps the same corner-to-corner distances after rotation", () => {
    const corner2 = { lat: ORIGIN.lat + 0.01, lon: ORIGIN.lon + 0.02 };
    const unrotated = rectangleCorners(ORIGIN, corner2, 0);
    const rotated = rectangleCorners(ORIGIN, corner2, 37);
    const diag0 = distanceKm(unrotated[0], unrotated[2]);
    const diag1 = distanceKm(rotated[0], rotated[2]);
    expect(diag1).toBeCloseTo(diag0, 3);
  });
});

describe("circlePoints", () => {
  it("keeps every point at the given radius from the center", () => {
    const points = circlePoints(ORIGIN, 500);
    for (const p of points) {
      expect(distanceKm(ORIGIN, p) * 1000).toBeCloseTo(500, 0);
    }
  });

  it("closes the loop (first and last point match)", () => {
    const points = circlePoints(ORIGIN, 500);
    const first = points[0]!;
    const last = points.at(-1)!;
    expect(first.lat).toBeCloseTo(last.lat, 9);
    expect(first.lon).toBeCloseTo(last.lon, 9);
  });
});

describe("orbitTrackPoints", () => {
  it("bulges to the east for a right-hand, north-course pattern", () => {
    const points = orbitTrackPoints({ center: ORIGIN, hand: "right", courseDeg: 0, legLengthNm: 5 });
    const eastOffsets = points.map((p) => toLocalMeters(ORIGIN, p).x);
    expect(Math.min(...eastOffsets)).toBeGreaterThanOrEqual(-1);
    expect(Math.max(...eastOffsets)).toBeGreaterThan(1000);
  });

  it("bulges to the west for a left-hand, north-course pattern", () => {
    const points = orbitTrackPoints({ center: ORIGIN, hand: "left", courseDeg: 0, legLengthNm: 5 });
    const eastOffsets = points.map((p) => toLocalMeters(ORIGIN, p).x);
    expect(Math.max(...eastOffsets)).toBeLessThanOrEqual(1);
    expect(Math.min(...eastOffsets)).toBeLessThan(-1000);
  });

  it("spans legLengthNm plus the two turn radii along the course axis", () => {
    const legLengthNm = 5;
    const turnRadiusNm = 1;
    const points = orbitTrackPoints({ center: ORIGIN, hand: "right", courseDeg: 0, legLengthNm, turnRadiusNm });
    const northOffsets = points.map((p) => toLocalMeters(ORIGIN, p).y);
    const span = Math.max(...northOffsets) - Math.min(...northOffsets);
    expect(span).toBeCloseTo((legLengthNm + 2 * turnRadiusNm) * 1852, -2);
  });
});
