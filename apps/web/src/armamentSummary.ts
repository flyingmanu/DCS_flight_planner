import { findWeapon, type Flight } from "@dcs-flight-planner/core";

/** "2x AIM-9 Sidewinder, 4x AIM-120 AMRAAM" style summary of a flight's selected pylon loadout. */
export function loadoutSummary(flight: Flight): string | null {
  const selections = (flight.pylonLoadout ?? []).filter((s) => s.weaponId);
  if (selections.length === 0) return null;
  const counts = new Map<string, number>();
  for (const s of selections) counts.set(s.weaponId!, (counts.get(s.weaponId!) ?? 0) + 1);
  return [...counts.entries()].map(([weaponId, count]) => `${count}x ${findWeapon(weaponId)?.name ?? weaponId}`).join(", ");
}
