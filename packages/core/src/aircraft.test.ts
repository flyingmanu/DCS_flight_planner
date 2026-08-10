import { describe, expect, it } from "vitest";
import { AIRCRAFT_CATALOG, findAircraft } from "./aircraft.js";
import { findWeapon } from "./weapons.js";

describe("AIRCRAFT_CATALOG", () => {
  it("has unique ids", () => {
    const ids = AIRCRAFT_CATALOG.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes both playable and AI-only entries, and both categories", () => {
    expect(AIRCRAFT_CATALOG.some((a) => a.playable)).toBe(true);
    expect(AIRCRAFT_CATALOG.some((a) => !a.playable)).toBe(true);
    expect(AIRCRAFT_CATALOG.some((a) => a.category === "fixed-wing")).toBe(true);
    expect(AIRCRAFT_CATALOG.some((a) => a.category === "helicopter")).toBe(true);
  });

  it("gives every playable module at least basic performance figures", () => {
    for (const aircraft of AIRCRAFT_CATALOG.filter((a) => a.playable)) {
      expect(aircraft.performance?.maxSpeedKt, aircraft.name).toBeGreaterThan(0);
      expect(aircraft.performance?.serviceCeilingFt, aircraft.name).toBeGreaterThan(0);
    }
  });

  it("gives every aircraft at least one standard task", () => {
    for (const aircraft of AIRCRAFT_CATALOG) {
      expect(aircraft.standardTasks.length, aircraft.name).toBeGreaterThan(0);
    }
  });

  it("gives every playable module a weapons reference list", () => {
    for (const aircraft of AIRCRAFT_CATALOG.filter((a) => a.playable)) {
      expect(aircraft.weapons?.length, aircraft.name).toBeGreaterThan(0);
    }
  });

  it("every pylon's compatible weapon ids resolve in the shared weapon catalog", () => {
    for (const aircraft of AIRCRAFT_CATALOG) {
      for (const pylon of aircraft.pylons ?? []) {
        for (const weaponId of pylon.compatibleWeaponIds) {
          expect(findWeapon(weaponId), `${aircraft.name} station ${pylon.station}: ${weaponId}`).toBeDefined();
        }
      }
    }
  });

  it("gives pylons an empty weight to compute a gross weight from, whenever it defines pylons", () => {
    for (const aircraft of AIRCRAFT_CATALOG) {
      if ((aircraft.pylons?.length ?? 0) > 0) {
        expect(aircraft.performance?.emptyWeightLb, aircraft.name).toBeGreaterThan(0);
      }
    }
  });

  it("numbers pylon stations uniquely and starting at 1", () => {
    for (const aircraft of AIRCRAFT_CATALOG) {
      if (!aircraft.pylons) continue;
      const stations = aircraft.pylons.map((p) => p.station);
      expect(new Set(stations).size, aircraft.name).toBe(stations.length);
      expect(Math.min(...stations), aircraft.name).toBe(1);
    }
  });
});

describe("findAircraft", () => {
  it("finds a known aircraft by id", () => {
    expect(findAircraft("fa-18c")?.name).toBe("F/A-18C Hornet");
  });

  it("returns undefined for an unknown or missing id", () => {
    expect(findAircraft("not-a-real-id")).toBeUndefined();
    expect(findAircraft(undefined)).toBeUndefined();
  });
});
