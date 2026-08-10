import { describe, expect, it } from "vitest";
import { latLonToMissionXY, missionXYToLatLon } from "./theaterProjection.js";

describe("theaterProjection", () => {
  it("converts real Persian Gulf .miz map-label positions to their known real-world airport coordinates", () => {
    // mapX/mapY taken verbatim from a real SummerCOMAO_v1_blueplayers.miz F10 map TextBox drawing.
    const cases: Array<{ name: string; x: number; y: number; expectedLat: number; expectedLon: number }> = [
      { name: "Jask", x: -56403.270258624, y: 157699.7861537, expectedLat: 25.6675, expectedLon: 57.7736 },
      { name: "Bandar Abbas", x: 116467.94074105, y: 14557.216346416, expectedLat: 27.2183, expectedLon: 56.3778 },
      { name: "Bandar Lengeh", x: 41718.620511492, y: -141242.13309757, expectedLat: 26.5319, expectedLon: 54.8244 },
    ];

    for (const c of cases) {
      const { lat, lon } = missionXYToLatLon("persiangulf", c.x, c.y);
      expect(lat).toBeCloseTo(c.expectedLat, 1);
      expect(lon).toBeCloseTo(c.expectedLon, 1);
    }
  });

  it("round-trips lat/lon -> mission x/y -> lat/lon for every known theater", () => {
    const sample = { lat: 43.5, lon: 40.0 };
    for (const theaterId of ["caucasus", "persiangulf", "nevada", "normandy", "thechannel", "syria", "marianaislands", "falklands", "sinai", "kola", "germany"]) {
      const { x, y } = latLonToMissionXY(theaterId, sample);
      const back = missionXYToLatLon(theaterId, x, y);
      expect(back.lat).toBeCloseTo(sample.lat, 6);
      expect(back.lon).toBeCloseTo(sample.lon, 6);
    }
  });

  it("throws a clear error for an unknown theater", () => {
    expect(() => missionXYToLatLon("mars", 0, 0)).toThrow(/mars/);
  });
});
