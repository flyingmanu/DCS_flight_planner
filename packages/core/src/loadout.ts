import type { Aircraft } from "./aircraft.js";
import type { PylonSelection } from "./flights.js";
import { findWeapon } from "./weapons.js";

/** Total weight of everything currently selected on the flight's pylons, in lb. */
export function computeLoadoutWeightLb(loadout: PylonSelection[] | undefined): number {
  if (!loadout) return 0;
  return loadout.reduce((sum, sel) => sum + (findWeapon(sel.weaponId)?.weightLb ?? 0), 0);
}

/**
 * Estimated gross weight (empty + fuel + ordnance), in lb. Undefined when the
 * aircraft has no known empty weight to start from.
 */
export function computeGrossWeightLb(aircraft: Aircraft, loadout: PylonSelection[] | undefined, fuelLb?: number): number | undefined {
  const emptyWeightLb = aircraft.performance?.emptyWeightLb;
  if (emptyWeightLb === undefined) return undefined;
  const fuel = fuelLb ?? aircraft.performance?.internalFuelLb ?? 0;
  return emptyWeightLb + fuel + computeLoadoutWeightLb(loadout);
}
