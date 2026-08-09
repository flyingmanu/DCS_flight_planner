import { describe, expect, it } from "vitest";
import { distanceKm, distanceNm } from "./geo.js";

describe("distanceKm", () => {
  it("is zero for the same point", () => {
    expect(distanceKm({ lat: 45, lon: 37 }, { lat: 45, lon: 37 })).toBe(0);
  });

  it("matches the exact great-circle distance along a meridian", () => {
    // Along a meridian, haversine reduces to R * deltaLatitude exactly.
    const km = distanceKm({ lat: 0, lon: 0 }, { lat: 90, lon: 0 });
    expect(km).toBeCloseTo((6371 * Math.PI) / 2, 1);
  });

  it("is symmetric", () => {
    const a = { lat: 45.013175, lon: 37.359783 };
    const b = { lat: 45.08743, lon: 38.925202 };
    expect(distanceKm(a, b)).toBeCloseTo(distanceKm(b, a), 9);
  });
});

describe("distanceNm", () => {
  it("is distanceKm divided by 1.852", () => {
    const a = { lat: 45.013175, lon: 37.359783 };
    const b = { lat: 45.08743, lon: 38.925202 };
    expect(distanceNm(a, b)).toBeCloseTo(distanceKm(a, b) / 1.852, 9);
  });
});
