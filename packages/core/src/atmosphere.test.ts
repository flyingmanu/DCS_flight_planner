import { describe, expect, it } from "vitest";
import { casToTasKt, isaTemperatureC, machNumber, pressureAtAltitudeHpa, qfeHpa, speedOfSoundKt, tasToCasKt } from "./atmosphere.js";

describe("isaTemperatureC", () => {
  it("is 15°C at sea level", () => {
    expect(isaTemperatureC(0)).toBeCloseTo(15, 5);
  });

  it("matches the standard ~-4.8°C at 10,000 ft", () => {
    expect(isaTemperatureC(10000)).toBeCloseTo(-4.8, 0);
  });
});

describe("pressureAtAltitudeHpa", () => {
  it("equals the reference QNH at sea level", () => {
    expect(pressureAtAltitudeHpa(0, 1013.25)).toBeCloseTo(1013.25, 5);
    expect(pressureAtAltitudeHpa(0, 1005)).toBeCloseTo(1005, 5);
  });

  it("decreases with altitude, roughly halving by 18,000 ft", () => {
    const p = pressureAtAltitudeHpa(18000);
    expect(p).toBeLessThan(1013.25);
    expect(p).toBeGreaterThan(450);
    expect(p).toBeLessThan(560);
  });
});

describe("qfeHpa", () => {
  it("equals QNH for a sea-level field", () => {
    expect(qfeHpa(0, 1013.25)).toBeCloseTo(1013.25, 5);
  });

  it("is lower than QNH for a field above sea level", () => {
    expect(qfeHpa(2000, 1013.25)).toBeLessThan(1013.25);
  });
});

describe("casToTasKt / tasToCasKt", () => {
  it("CAS equals TAS at sea level (ISA, standard QNH)", () => {
    expect(casToTasKt(250, 0)).toBeCloseTo(250, 5);
  });

  it("TAS exceeds CAS at altitude", () => {
    const tas = casToTasKt(250, 20000);
    expect(tas).toBeGreaterThan(250);
    expect(tas).toBeLessThan(400); // sanity bound, not a precise real-world figure
  });

  it("round-trips through tasToCasKt", () => {
    const tas = casToTasKt(300, 15000);
    expect(tasToCasKt(tas, 15000)).toBeCloseTo(300, 5);
  });
});

describe("speedOfSoundKt / machNumber", () => {
  it("matches the standard sea-level ISA value of ~661 kt", () => {
    expect(speedOfSoundKt(0)).toBeCloseTo(661.5, 0);
  });

  it("gives Mach 1 for TAS equal to the local speed of sound", () => {
    const a = speedOfSoundKt(30000);
    expect(machNumber(a, 30000)).toBeCloseTo(1, 5);
  });
});
