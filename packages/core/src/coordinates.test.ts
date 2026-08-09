import { describe, expect, it } from "vitest";
import { formatLatLonDdm, toMgrs } from "./coordinates.js";

describe("formatLatLonDdm", () => {
  it("formats a northern/eastern point", () => {
    // 43°25.31' 40°15.22' -> lat = 43 + 25.31/60, lon = 40 + 15.22/60
    const lat = 43 + 25.31 / 60;
    const lon = 40 + 15.22 / 60;
    expect(formatLatLonDdm({ lat, lon })).toBe("N43°25.310' E040°15.220'");
  });

  it("formats southern/western hemispheres", () => {
    expect(formatLatLonDdm({ lat: -10.5, lon: -20.25 })).toBe("S10°30.000' W020°15.000'");
  });
});

describe("toMgrs", () => {
  it("produces a plausible MGRS string for a Caucasus point (Anapa-Vityazevo)", () => {
    const mgrs = toMgrs({ lat: 45.013174733772, lon: 37.359783477556 });
    // Grid zone 37T for this location; exact digits aren't hand-verified here,
    // but the format (zone + 100km square + 10-digit easting/northing) is.
    expect(mgrs).toMatch(/^37T[A-Z]{2}\d{10}$/);
  });
});
