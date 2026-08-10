import { describe, expect, it } from "vitest";
import type { Waypoint } from "./flights.js";
import { addMinutesToClock, computeRouteLegs, computeWaypointEtas, formatEte, totalRouteDistanceNm } from "./route.js";

function wp(lat: number, lon: number, airspeedKt?: number, extra?: Partial<Waypoint>): Waypoint {
  return { id: crypto.randomUUID(), position: { lat, lon }, airspeedKt, ...extra };
}

describe("computeRouteLegs", () => {
  it("returns no legs for 0 or 1 waypoints", () => {
    expect(computeRouteLegs([])).toEqual([]);
    expect(computeRouteLegs([wp(43, 40)])).toEqual([]);
  });

  it("computes distance and track for a simple two-point route", () => {
    const a = wp(43, 40);
    const b = wp(43, 40.5); // due east of a, roughly
    const legs = computeRouteLegs([a, b]);
    expect(legs).toHaveLength(1);
    expect(legs[0]!.distanceNm).toBeGreaterThan(0);
    expect(legs[0]!.trackDeg).toBeCloseTo(90, -1); // east-ish
  });

  it("leaves ETE undefined when the destination waypoint has no airspeed", () => {
    const legs = computeRouteLegs([wp(43, 40), wp(43, 40.5)]);
    expect(legs[0]!.eteMin).toBeUndefined();
  });

  it("computes ETE from distance and destination airspeed", () => {
    const a = wp(0, 0);
    const b = wp(0, 1, 60); // 1 degree of longitude at the equator ~ 60 NM, at 60 kt -> ~1h
    const legs = computeRouteLegs([a, b]);
    expect(legs[0]!.eteMin).toBeCloseTo(60, 0);
  });

  it("chains multiple legs", () => {
    const legs = computeRouteLegs([wp(43, 40), wp(43.5, 40), wp(43.5, 40.5)]);
    expect(legs).toHaveLength(2);
  });
});

describe("totalRouteDistanceNm", () => {
  it("sums leg distances", () => {
    const route = [wp(43, 40), wp(43.5, 40), wp(43.5, 40.5)];
    const legs = computeRouteLegs(route);
    const expected = legs.reduce((sum, l) => sum + l.distanceNm, 0);
    expect(totalRouteDistanceNm(route)).toBeCloseTo(expected, 6);
  });
});

describe("formatEte", () => {
  it("formats under an hour as M:SS", () => {
    expect(formatEte(5.5)).toBe("5:30");
  });

  it("formats an hour or more as H:MM:SS", () => {
    expect(formatEte(90)).toBe("1:30:00");
  });
});

describe("computeWaypointEtas", () => {
  it("cascades ETAs from the takeoff time using each leg's ETE", () => {
    const route = [wp(0, 0), wp(0, 1, 60), wp(0, 2, 60)];
    const legs = computeRouteLegs(route);
    const etas = computeWaypointEtas(route, legs, "10:00");
    expect(etas[0]).toBe("10:00");
    expect(etas[1]).toBe("11:00");
    expect(etas[2]).toBe("12:00");
  });

  it("returns null for every waypoint when there's no takeoff time", () => {
    const route = [wp(0, 0), wp(0, 1, 60)];
    const legs = computeRouteLegs(route);
    expect(computeWaypointEtas(route, legs, undefined)).toEqual([null, null]);
  });

  it("returns null once a leg's ETE is missing (no airspeed set)", () => {
    const route = [wp(0, 0), wp(0, 1), wp(0, 2, 60)];
    const legs = computeRouteLegs(route);
    const etas = computeWaypointEtas(route, legs, "10:00");
    expect(etas[0]).toBe("10:00");
    expect(etas[1]).toBeNull();
    expect(etas[2]).toBeNull();
  });

  it("uses a locked waypoint's TOT as its own ETA and as the new anchor for later waypoints", () => {
    const route = [wp(0, 0), wp(0, 1, 60, { totLocked: true, tot: "14:00" }), wp(0, 2, 60)];
    const legs = computeRouteLegs(route);
    const etas = computeWaypointEtas(route, legs, "10:00");
    expect(etas[0]).toBe("10:00");
    expect(etas[1]).toBe("14:00"); // locked TOT wins over the cascaded 11:00
    expect(etas[2]).toBe("15:00"); // cascades from the locked TOT, not the original takeoff time
  });

  it("still anchors from a locked waypoint even without a takeoff time", () => {
    const route = [wp(0, 0), wp(0, 1, 60, { totLocked: true, tot: "14:00" }), wp(0, 2, 60)];
    const legs = computeRouteLegs(route);
    const etas = computeWaypointEtas(route, legs, undefined);
    expect(etas[0]).toBeNull();
    expect(etas[1]).toBe("14:00");
    expect(etas[2]).toBe("15:00");
  });
});

describe("addMinutesToClock", () => {
  it("adds minutes within the same day", () => {
    expect(addMinutesToClock("14:30", 45)).toBe("15:15");
  });

  it("wraps around midnight forward and backward", () => {
    expect(addMinutesToClock("23:50", 20)).toBe("00:10");
    expect(addMinutesToClock("00:10", -20)).toBe("23:50");
  });

  it("returns null for unparseable input", () => {
    expect(addMinutesToClock("not a time", 10)).toBeNull();
    expect(addMinutesToClock("14:75", 10)).toBeNull();
  });
});
