import { describe, expect, it } from "vitest";
import { isWithinBoundingBox, theaterBoundingBox } from "./globalAirports.js";
import type { Theater } from "./types.js";

function makeTheater(positions: Array<{ lat: number; lon: number }>): Theater {
  return {
    id: "test",
    name: "Test",
    airbases: positions.map((position, i) => ({
      id: `ab${i}`,
      name: `Airbase ${i}`,
      callsign: `Airbase ${i}`,
      category: "airdrome",
      initialCoalition: 0,
      position: { ...position, altM: 0 },
      runways: [],
      radio: { hfMhz: "N/A", vhfLowMhz: "N/A", vhfHighMhz: "N/A", uhfMhz: "N/A" },
      tacanChannel: "N/A",
    })),
  };
}

describe("theaterBoundingBox", () => {
  it("covers all airbase positions plus the margin", () => {
    const theater = makeTheater([
      { lat: 40, lon: 30 },
      { lat: 45, lon: 38 },
    ]);
    const box = theaterBoundingBox(theater, 1);
    expect(box).toEqual({ minLat: 39, maxLat: 46, minLon: 29, maxLon: 39 });
  });

  it("defaults to a 0.5 degree margin", () => {
    const theater = makeTheater([{ lat: 40, lon: 30 }]);
    const box = theaterBoundingBox(theater);
    expect(box).toEqual({ minLat: 39.5, maxLat: 40.5, minLon: 29.5, maxLon: 30.5 });
  });
});

describe("isWithinBoundingBox", () => {
  const box = { minLat: 40, maxLat: 45, minLon: 30, maxLon: 38 };

  it("returns true for a point inside the box", () => {
    expect(isWithinBoundingBox({ lat: 42, lon: 34 }, box)).toBe(true);
  });

  it("returns true for a point exactly on the box edge", () => {
    expect(isWithinBoundingBox({ lat: 40, lon: 30 }, box)).toBe(true);
  });

  it("returns false for a point outside the box", () => {
    expect(isWithinBoundingBox({ lat: 10, lon: 10 }, box)).toBe(false);
  });
});
