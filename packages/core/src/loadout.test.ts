import { describe, expect, it } from "vitest";
import type { Aircraft } from "./aircraft.js";
import type { PylonSelection } from "./flights.js";
import { computeGrossWeightLb, computeLoadoutWeightLb } from "./loadout.js";

function makeAircraft(overrides: Partial<Aircraft> = {}): Aircraft {
  return {
    id: "test",
    name: "Test Aircraft",
    manufacturer: "Test",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP"],
    ...overrides,
  };
}

describe("computeLoadoutWeightLb", () => {
  it("is 0 for an undefined or empty loadout", () => {
    expect(computeLoadoutWeightLb(undefined)).toBe(0);
    expect(computeLoadoutWeightLb([])).toBe(0);
  });

  it("sums the weight of every selected weapon", () => {
    const loadout: PylonSelection[] = [
      { station: 1, weaponId: "aim-9" }, // 190
      { station: 2, weaponId: "aim-120" }, // 335
    ];
    expect(computeLoadoutWeightLb(loadout)).toBe(190 + 335);
  });

  it("ignores empty (null) pylons", () => {
    const loadout: PylonSelection[] = [
      { station: 1, weaponId: "aim-9" },
      { station: 2, weaponId: null },
    ];
    expect(computeLoadoutWeightLb(loadout)).toBe(190);
  });
});

describe("computeGrossWeightLb", () => {
  it("returns undefined when the aircraft has no known empty weight", () => {
    const aircraft = makeAircraft();
    expect(computeGrossWeightLb(aircraft, [])).toBeUndefined();
  });

  it("adds empty weight, fuel, and ordnance", () => {
    const aircraft = makeAircraft({ performance: { emptyWeightLb: 20000, internalFuelLb: 5000 } });
    const loadout: PylonSelection[] = [{ station: 1, weaponId: "aim-9" }];
    expect(computeGrossWeightLb(aircraft, loadout)).toBe(20000 + 5000 + 190);
  });

  it("uses an explicit fuel override instead of internalFuelLb when given", () => {
    const aircraft = makeAircraft({ performance: { emptyWeightLb: 20000, internalFuelLb: 5000 } });
    expect(computeGrossWeightLb(aircraft, [], 1000)).toBe(20000 + 1000);
  });
});
