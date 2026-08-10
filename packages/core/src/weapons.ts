export type WeaponCategory = "ir-aam" | "radar-aam" | "agm" | "atgm" | "bomb-guided" | "bomb-unguided" | "rocket-pod" | "gun-pod" | "fuel-tank";

export interface Weapon {
  id: string;
  name: string;
  category: WeaponCategory;
  /** Approximate loaded weight in lb (publicly-known reference figure, not a DCS-verified value). */
  weightLb: number;
}

/**
 * Reference munitions catalog used to populate each playable aircraft's pylon
 * options. Weights are approximate, publicly-known figures for mission-planning
 * weight estimates — not derived from DCS's internal store data.
 */
export const WEAPON_CATALOG: Weapon[] = [
  { id: "aim-9", name: "AIM-9 Sidewinder", category: "ir-aam", weightLb: 190 },
  { id: "aim-7", name: "AIM-7 Sparrow", category: "radar-aam", weightLb: 510 },
  { id: "aim-54", name: "AIM-54 Phoenix", category: "radar-aam", weightLb: 1020 },
  { id: "aim-120", name: "AIM-120 AMRAAM", category: "radar-aam", weightLb: 335 },
  { id: "magic-2", name: "Magic II", category: "ir-aam", weightLb: 198 },
  { id: "super-530d", name: "Super 530D", category: "radar-aam", weightLb: 595 },
  { id: "r-27", name: "R-27", category: "radar-aam", weightLb: 550 },
  { id: "r-73", name: "R-73", category: "ir-aam", weightLb: 231 },
  { id: "r-60", name: "R-60", category: "ir-aam", weightLb: 145 },
  { id: "r-3s", name: "R-3S / R-13M", category: "ir-aam", weightLb: 165 },
  { id: "pl-5", name: "PL-5", category: "ir-aam", weightLb: 187 },
  { id: "pl-12", name: "PL-12", category: "radar-aam", weightLb: 380 },
  { id: "stinger-air", name: "FIM-92 Stinger (air-launched)", category: "ir-aam", weightLb: 22 },
  { id: "agm-65", name: "AGM-65 Maverick", category: "agm", weightLb: 485 },
  { id: "agm-88", name: "AGM-88 HARM", category: "agm", weightLb: 800 },
  { id: "agm-84", name: "AGM-84 Harpoon", category: "agm", weightLb: 1523 },
  { id: "agm-114", name: "AGM-114 Hellfire", category: "atgm", weightLb: 106 },
  { id: "vikhr", name: "9K121 Vikhr", category: "atgm", weightLb: 113 },
  { id: "shturm", name: "9M114 Shturm / 9M17 Skorpion", category: "atgm", weightLb: 115 },
  { id: "hot", name: "HOT ATGM", category: "atgm", weightLb: 57 },
  { id: "gbu-10", name: "GBU-10 Paveway II (2000lb)", category: "bomb-guided", weightLb: 2000 },
  { id: "gbu-12", name: "GBU-12 Paveway II (500lb)", category: "bomb-guided", weightLb: 610 },
  { id: "gbu-16", name: "GBU-16 Paveway II (1000lb)", category: "bomb-guided", weightLb: 1090 },
  { id: "gbu-24", name: "GBU-24 Paveway III (2000lb)", category: "bomb-guided", weightLb: 2400 },
  { id: "gbu-31", name: "GBU-31 JDAM (2000lb)", category: "bomb-guided", weightLb: 2036 },
  { id: "gbu-38", name: "GBU-38 JDAM (500lb)", category: "bomb-guided", weightLb: 510 },
  { id: "cbu-97", name: "CBU-97/105 SFW", category: "bomb-guided", weightLb: 950 },
  { id: "cbu-99", name: "CBU-99 Rockeye", category: "bomb-unguided", weightLb: 490 },
  { id: "kh-25", name: "Kh-25ML", category: "agm", weightLb: 660 },
  { id: "kh-29", name: "Kh-29L", category: "agm", weightLb: 1435 },
  { id: "rb-04", name: "Rb 04", category: "agm", weightLb: 1323 },
  { id: "rb-05", name: "Rb 05", category: "agm", weightLb: 650 },
  { id: "rb-75", name: "Rb 75 (Maverick)", category: "agm", weightLb: 485 },
  { id: "ls-lt-bomb", name: "LS/LT guided bomb", category: "bomb-guided", weightLb: 550 },
  { id: "apkws", name: "APKWS laser rocket pod", category: "rocket-pod", weightLb: 120 },
  { id: "mk-82", name: "Mk-82 (500lb)", category: "bomb-unguided", weightLb: 570 },
  { id: "mk-83", name: "Mk-83 (1000lb)", category: "bomb-unguided", weightLb: 985 },
  { id: "mk-84", name: "Mk-84 (2000lb)", category: "bomb-unguided", weightLb: 1970 },
  { id: "fab-250", name: "FAB-250", category: "bomb-unguided", weightLb: 570 },
  { id: "fab-500", name: "FAB-500", category: "bomb-unguided", weightLb: 1100 },
  { id: "m70-bomb", name: "M/70 bomb", category: "bomb-unguided", weightLb: 500 },
  { id: "arak-rocket", name: "ARAK-M rocket pod", category: "rocket-pod", weightLb: 400 },
  { id: "rocket-pod", name: "Unguided rocket pod (S-8/Hydra 70)", category: "rocket-pod", weightLb: 500 },
  { id: "s-24", name: "S-24/S-25 heavy rocket", category: "rocket-pod", weightLb: 485 },
  { id: "gun-pod", name: "External gun pod", category: "gun-pod", weightLb: 330 },
  { id: "bomb-light", name: "Unguided bomb (period-appropriate, ~250lb)", category: "bomb-unguided", weightLb: 250 },
  { id: "rocket-light", name: "Unguided rocket (period-appropriate)", category: "rocket-pod", weightLb: 60 },
  { id: "fuel-tank", name: "External fuel tank", category: "fuel-tank", weightLb: 2000 },
];

export function findWeapon(id: string | null | undefined): Weapon | undefined {
  return id ? WEAPON_CATALOG.find((w) => w.id === id) : undefined;
}
