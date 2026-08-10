import { describe, expect, it } from "vitest";
import { findWeapon, WEAPON_CATALOG } from "./weapons.js";

describe("WEAPON_CATALOG", () => {
  it("has unique ids", () => {
    const ids = WEAPON_CATALOG.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every weapon a positive weight", () => {
    for (const weapon of WEAPON_CATALOG) {
      expect(weapon.weightLb, weapon.name).toBeGreaterThan(0);
    }
  });
});

describe("findWeapon", () => {
  it("finds a known weapon by id", () => {
    expect(findWeapon("aim-120")?.name).toBe("AIM-120 AMRAAM");
  });

  it("returns undefined for an unknown, null, or missing id", () => {
    expect(findWeapon("not-a-real-id")).toBeUndefined();
    expect(findWeapon(null)).toBeUndefined();
    expect(findWeapon(undefined)).toBeUndefined();
  });
});
