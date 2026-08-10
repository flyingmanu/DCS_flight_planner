import { describe, expect, it } from "vitest";
import {
  classifyLoad,
  computeGrossWeightLb,
  computeLoadoutWeightLb,
  estimateEnduranceMin,
  estimateRangeNm,
  estimateTakeoffDistanceFt,
  findCustomWeapon,
  findLauncher,
  type CustomAircraft,
  type PylonSelection,
} from "./customAircraft.js";

function makeAircraft(overrides: Partial<CustomAircraft> = {}): CustomAircraft {
  return {
    id: "test",
    name: "Test Jet",
    category: "fixed-wing",
    standardTasks: ["CAP"],
    performance: {},
    launchers: [{ id: "lau-129", name: "LAU-129", weightLb: 112 }],
    weapons: [
      { id: "aim-9x", name: "AIM-9X", weightLb: 185, compatibleLauncherIds: ["lau-129"] },
      { id: "gbu-12", name: "GBU-12", weightLb: 610 },
    ],
    pylons: [
      { station: "1", compatibleWeaponIds: ["aim-9x"] },
      { station: "3", compatibleWeaponIds: ["gbu-12"] },
    ],
    presets: [],
    ...overrides,
  };
}

describe("findCustomWeapon / findLauncher", () => {
  it("find known entries and return undefined for unknown/null/undefined ids", () => {
    const aircraft = makeAircraft();
    expect(findCustomWeapon(aircraft, "aim-9x")?.name).toBe("AIM-9X");
    expect(findCustomWeapon(aircraft, "nope")).toBeUndefined();
    expect(findCustomWeapon(aircraft, null)).toBeUndefined();
    expect(findCustomWeapon(aircraft, undefined)).toBeUndefined();
    expect(findLauncher(aircraft, "lau-129")?.name).toBe("LAU-129");
    expect(findLauncher(aircraft, "nope")).toBeUndefined();
  });
});

describe("computeLoadoutWeightLb", () => {
  it("is 0 for an undefined or empty loadout", () => {
    const aircraft = makeAircraft();
    expect(computeLoadoutWeightLb(aircraft, undefined)).toBe(0);
    expect(computeLoadoutWeightLb(aircraft, [])).toBe(0);
  });

  it("sums weapon weight plus launcher weight when one is selected", () => {
    const aircraft = makeAircraft();
    const loadout: PylonSelection[] = [{ station: "1", weaponId: "aim-9x", launcherId: "lau-129" }];
    expect(computeLoadoutWeightLb(aircraft, loadout)).toBe(185 + 112);
  });

  it("counts weapon weight alone when no launcher is selected (direct-mount stores)", () => {
    const aircraft = makeAircraft();
    const loadout: PylonSelection[] = [{ station: "3", weaponId: "gbu-12" }];
    expect(computeLoadoutWeightLb(aircraft, loadout)).toBe(610);
  });

  it("ignores empty (null) pylons", () => {
    const aircraft = makeAircraft();
    const loadout: PylonSelection[] = [
      { station: "1", weaponId: "aim-9x", launcherId: "lau-129" },
      { station: "3", weaponId: null },
    ];
    expect(computeLoadoutWeightLb(aircraft, loadout)).toBe(185 + 112);
  });
});

describe("computeGrossWeightLb", () => {
  it("returns undefined when the aircraft has no known empty weight", () => {
    const aircraft = makeAircraft();
    expect(computeGrossWeightLb(aircraft, [])).toBeUndefined();
  });

  it("adds empty weight, fuel, and ordnance", () => {
    const aircraft = makeAircraft({ performance: { emptyWeightLb: 20000, internalFuelLb: 5000 } });
    const loadout: PylonSelection[] = [{ station: "3", weaponId: "gbu-12" }];
    expect(computeGrossWeightLb(aircraft, loadout)).toBe(20000 + 5000 + 610);
  });

  it("uses an explicit fuel override instead of internalFuelLb when given", () => {
    const aircraft = makeAircraft({ performance: { emptyWeightLb: 20000, internalFuelLb: 5000 } });
    expect(computeGrossWeightLb(aircraft, [], 1000)).toBe(20000 + 1000);
  });
});

describe("classifyLoad", () => {
  it("returns undefined without both empty and max gross weight", () => {
    expect(classifyLoad(makeAircraft(), 25000)).toBeUndefined();
  });

  it("classifies light/medium/heavy based on fraction of the weight span used", () => {
    const aircraft = makeAircraft({ performance: { emptyWeightLb: 20000, maxGrossWeightLb: 30000 } });
    expect(classifyLoad(aircraft, 20000)).toBe("light"); // 0%
    expect(classifyLoad(aircraft, 23000)).toBe("light"); // 30%
    expect(classifyLoad(aircraft, 25000)).toBe("medium"); // 50%
    expect(classifyLoad(aircraft, 29000)).toBe("heavy"); // 90%
  });
});

describe("estimateTakeoffDistanceFt", () => {
  it("is undefined without a reference point", () => {
    expect(estimateTakeoffDistanceFt(makeAircraft(), 25000)).toBeUndefined();
  });

  it("scales with the square of the weight ratio", () => {
    const aircraft = makeAircraft({ performance: { referenceTakeoffWeightLb: 20000, referenceTakeoffDistanceFt: 2000 } });
    expect(estimateTakeoffDistanceFt(aircraft, 20000)).toBeCloseTo(2000, 0);
    expect(estimateTakeoffDistanceFt(aircraft, 28284)).toBeCloseTo(4000, -1); // ~sqrt(2)x weight -> 2x distance
  });
});

describe("estimateEnduranceMin / estimateRangeNm", () => {
  it("are undefined without fuel-flow/cruise-speed data", () => {
    expect(estimateEnduranceMin(makeAircraft(), 5000)).toBeUndefined();
    expect(estimateRangeNm(makeAircraft(), 5000)).toBeUndefined();
  });

  it("computes endurance from fuel/flow and range from endurance*speed", () => {
    const aircraft = makeAircraft({ performance: { cruiseFuelFlowLbHr: 3000, cruiseSpeedKt: 420 } });
    expect(estimateEnduranceMin(aircraft, 6000)).toBeCloseTo(120, 5); // 2 hours
    expect(estimateRangeNm(aircraft, 6000)).toBeCloseTo(840, 5); // 2h * 420kt
  });
});
