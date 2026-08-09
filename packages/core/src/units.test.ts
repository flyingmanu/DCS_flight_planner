import { describe, expect, it } from "vitest";
import { metersToFeet, metersToNm, nmToMeters } from "./units.js";

describe("metersToFeet", () => {
  it("converts meters to feet", () => {
    expect(metersToFeet(1000)).toBeCloseTo(3280.84, 2);
  });
});

describe("metersToNm / nmToMeters", () => {
  it("round-trips through the nautical mile definition (1852 m)", () => {
    expect(metersToNm(1852)).toBeCloseTo(1, 6);
    expect(nmToMeters(1)).toBeCloseTo(1852, 6);
    expect(metersToNm(nmToMeters(3.5))).toBeCloseTo(3.5, 6);
  });
});
