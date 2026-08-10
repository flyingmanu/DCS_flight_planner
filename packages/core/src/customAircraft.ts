import type { AircraftCategory } from "./aircraft.js";
import type { TaskType } from "./flights.js";

/** A rack/launcher that can be mounted on a pylon to carry a weapon. */
export interface Launcher {
  id: string;
  name: string;
  weightLb: number;
}

/** A weapon defined on a specific custom aircraft (not a shared global catalog). */
export interface CustomWeapon {
  id: string;
  name: string;
  weightLb: number;
  /** Launcher.id values this weapon can be mounted on; empty/absent means it mounts directly with no separate launcher. */
  compatibleLauncherIds?: string[];
}

/** A weapon station on a custom aircraft. */
export interface CustomPylon {
  /** 1-based station number/identifier, cosmetic only (can match the real DCS station numbering, e.g. "5L"). */
  station: string;
  /** CustomWeapon.id values this station can carry. */
  compatibleWeaponIds: string[];
}

export interface PylonSelection {
  /** Matches CustomPylon.station. */
  station: string;
  /** References CustomWeapon.id; null/absent means the pylon is empty. */
  weaponId: string | null;
  /** References Launcher.id, when the selected weapon needs one and more than one is compatible. */
  launcherId?: string | null;
}

/** A named, reusable pylon loadout for a custom aircraft. */
export interface LoadoutPreset {
  id: string;
  name: string;
  selections: PylonSelection[];
}

/**
 * Detailed, user-provided performance figures for a custom aircraft. All
 * approximate by nature (this app doesn't model real flight dynamics) —
 * accuracy depends entirely on what the user enters.
 */
export interface CustomAircraftPerformance {
  emptyWeightLb?: number;
  internalFuelLb?: number;
  maxGrossWeightLb?: number;
  maxSpeedKt?: number;
  cruiseSpeedKt?: number;
  serviceCeilingFt?: number;
  /** Fuel burn at cruise, used to estimate endurance/range. */
  cruiseFuelFlowLbHr?: number;
  /** A single reference point (weight + required takeoff distance) used to scale a takeoff-distance estimate to other gross weights. */
  referenceTakeoffWeightLb?: number;
  referenceTakeoffDistanceFt?: number;
}

export interface CustomAircraft {
  id: string;
  name: string;
  category: AircraftCategory;
  standardTasks: TaskType[];
  performance: CustomAircraftPerformance;
  launchers: Launcher[];
  weapons: CustomWeapon[];
  pylons: CustomPylon[];
  presets: LoadoutPreset[];
}

export function findCustomWeapon(aircraft: CustomAircraft, id: string | null | undefined): CustomWeapon | undefined {
  return id ? aircraft.weapons.find((w) => w.id === id) : undefined;
}

export function findLauncher(aircraft: CustomAircraft, id: string | null | undefined): Launcher | undefined {
  return id ? aircraft.launchers.find((l) => l.id === id) : undefined;
}

/** Total weight of everything currently selected on the aircraft's pylons (weapons + any launchers), in lb. */
export function computeLoadoutWeightLb(aircraft: CustomAircraft, loadout: PylonSelection[] | undefined): number {
  if (!loadout) return 0;
  return loadout.reduce((sum, sel) => {
    const weapon = findCustomWeapon(aircraft, sel.weaponId);
    const launcher = findLauncher(aircraft, sel.launcherId);
    return sum + (weapon?.weightLb ?? 0) + (launcher?.weightLb ?? 0);
  }, 0);
}

/** Estimated gross weight (empty + fuel + ordnance), in lb. Undefined when the aircraft has no known empty weight. */
export function computeGrossWeightLb(aircraft: CustomAircraft, loadout: PylonSelection[] | undefined, fuelLb?: number): number | undefined {
  const emptyWeightLb = aircraft.performance.emptyWeightLb;
  if (emptyWeightLb === undefined) return undefined;
  const fuel = fuelLb ?? aircraft.performance.internalFuelLb ?? 0;
  return emptyWeightLb + fuel + computeLoadoutWeightLb(aircraft, loadout);
}

export type LoadClass = "light" | "medium" | "heavy";

/**
 * Classifies a gross weight as light/medium/heavy relative to the aircraft's empty
 * and max-gross weight, e.g. for a quick "how loaded is this jet" read. Undefined
 * when the aircraft doesn't define both weights needed for the comparison.
 */
export function classifyLoad(aircraft: CustomAircraft, grossWeightLb: number): LoadClass | undefined {
  const { emptyWeightLb, maxGrossWeightLb } = aircraft.performance;
  if (emptyWeightLb === undefined || maxGrossWeightLb === undefined || maxGrossWeightLb <= emptyWeightLb) return undefined;
  const loadFraction = (grossWeightLb - emptyWeightLb) / (maxGrossWeightLb - emptyWeightLb);
  if (loadFraction < 0.4) return "light";
  if (loadFraction < 0.75) return "medium";
  return "heavy";
}

/**
 * Rough takeoff-distance estimate, scaled from a single user-provided reference
 * point using a simplified weight^2 relationship (takeoff distance grows with the
 * square of takeoff speed, which itself grows with the square root of weight for
 * constant lift coefficient) — a physics-informed approximation, not a certified
 * performance chart. Undefined when the aircraft has no reference point.
 */
export function estimateTakeoffDistanceFt(aircraft: CustomAircraft, grossWeightLb: number): number | undefined {
  const { referenceTakeoffWeightLb, referenceTakeoffDistanceFt } = aircraft.performance;
  if (!referenceTakeoffWeightLb || !referenceTakeoffDistanceFt) return undefined;
  return referenceTakeoffDistanceFt * (grossWeightLb / referenceTakeoffWeightLb) ** 2;
}

/** Estimated time aloft at cruise fuel flow, in minutes. Undefined when fuel flow isn't known. */
export function estimateEnduranceMin(aircraft: CustomAircraft, fuelLb: number): number | undefined {
  const flow = aircraft.performance.cruiseFuelFlowLbHr;
  if (!flow) return undefined;
  return (fuelLb / flow) * 60;
}

/** Estimated still-air range at cruise speed, in NM. Undefined when cruise speed or fuel flow isn't known. */
export function estimateRangeNm(aircraft: CustomAircraft, fuelLb: number): number | undefined {
  const enduranceMin = estimateEnduranceMin(aircraft, fuelLb);
  const cruiseSpeedKt = aircraft.performance.cruiseSpeedKt;
  if (enduranceMin === undefined || !cruiseSpeedKt) return undefined;
  return (enduranceMin / 60) * cruiseSpeedKt;
}
