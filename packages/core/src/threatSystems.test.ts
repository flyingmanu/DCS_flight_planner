import { describe, expect, it } from "vitest";
import { findThreatSystem, THREAT_SYSTEMS } from "./threatSystems.js";

describe("THREAT_SYSTEMS", () => {
  it("has unique ids", () => {
    const ids = THREAT_SYSTEMS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes both SAM and AAA systems", () => {
    expect(THREAT_SYSTEMS.some((s) => s.category === "SAM")).toBe(true);
    expect(THREAT_SYSTEMS.some((s) => s.category === "AAA")).toBe(true);
  });

  it("gives every system a positive max range", () => {
    for (const system of THREAT_SYSTEMS) {
      expect(system.maxRangeNm, system.name).toBeGreaterThan(0);
    }
  });
});

describe("findThreatSystem", () => {
  it("finds a known system by id", () => {
    expect(findThreatSystem("sa-6")?.name).toContain("SA-6");
  });

  it("returns undefined for an unknown or missing id", () => {
    expect(findThreatSystem("not-a-real-id")).toBeUndefined();
    expect(findThreatSystem(undefined)).toBeUndefined();
  });
});
