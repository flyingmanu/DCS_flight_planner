export type ThreatCategory = "SAM" | "AAA";

/**
 * A ground-based air defense system's approximate engagement envelope, for
 * quickly drawing a threat ring instead of hand-sizing a generic circle.
 * Figures are unclassified, commonly-cited open-source approximations
 * (rounded) intended for mission-planning/wargaming purposes - not verified
 * real-world performance data.
 */
export interface ThreatSystem {
  id: string;
  /** NATO reporting name (or common name) plus the native designation, e.g. "SA-6 Gainful (2K12 Kub)". */
  name: string;
  category: ThreatCategory;
  maxRangeNm: number;
  minRangeNm?: number;
  maxAltFt?: number;
  minAltFt?: number;
}

export const THREAT_SYSTEMS: ThreatSystem[] = [
  { id: "sa-2", name: "SA-2 Guideline (S-75 Dvina)", category: "SAM", maxRangeNm: 24, minRangeNm: 3, maxAltFt: 90000, minAltFt: 1500 },
  { id: "sa-3", name: "SA-3 Goa (S-125 Neva/Pechora)", category: "SAM", maxRangeNm: 13, minRangeNm: 1, maxAltFt: 60000, minAltFt: 300 },
  { id: "sa-6", name: "SA-6 Gainful (2K12 Kub)", category: "SAM", maxRangeNm: 13, minRangeNm: 2, maxAltFt: 46000, minAltFt: 150 },
  { id: "sa-8", name: "SA-8 Gecko (9K33 Osa)", category: "SAM", maxRangeNm: 5, minRangeNm: 1, maxAltFt: 16000, minAltFt: 80 },
  { id: "sa-10", name: "SA-10 Grumble (S-300PS)", category: "SAM", maxRangeNm: 40, minRangeNm: 3, maxAltFt: 90000, minAltFt: 30 },
  { id: "sa-11", name: "SA-11 Gadfly (9K37 Buk)", category: "SAM", maxRangeNm: 19, minRangeNm: 2, maxAltFt: 72000, minAltFt: 50 },
  { id: "sa-13", name: "SA-13 Gopher (9K35 Strela-10)", category: "SAM", maxRangeNm: 3, maxAltFt: 11000, minAltFt: 30 },
  { id: "sa-15", name: "SA-15 Gauntlet (9K330 Tor)", category: "SAM", maxRangeNm: 6.5, maxAltFt: 19000, minAltFt: 30 },
  { id: "sa-19", name: "SA-19 Grison (2K22 Tunguska, missile)", category: "SAM", maxRangeNm: 4.3, maxAltFt: 11500, minAltFt: 50 },
  { id: "hawk", name: "MIM-23 Hawk", category: "SAM", maxRangeNm: 22, minRangeNm: 1.5, maxAltFt: 45000, minAltFt: 100 },
  { id: "patriot", name: "MIM-104 Patriot", category: "SAM", maxRangeNm: 38, minRangeNm: 3, maxAltFt: 80000, minAltFt: 150 },
  { id: "nasams", name: "NASAMS (AIM-120)", category: "SAM", maxRangeNm: 13.5, maxAltFt: 50000, minAltFt: 100 },
  { id: "roland", name: "Roland", category: "SAM", maxRangeNm: 4.3, maxAltFt: 18000, minAltFt: 50 },
  { id: "chaparral", name: "MIM-72 Chaparral", category: "SAM", maxRangeNm: 2.7, maxAltFt: 9800 },
  { id: "avenger", name: "M1097 Avenger (FIM-92 Stinger)", category: "SAM", maxRangeNm: 2.6, maxAltFt: 12500 },
  { id: "shilka", name: "ZSU-23-4 Shilka", category: "AAA", maxRangeNm: 1.35, maxAltFt: 5000 },
  { id: "zu-23", name: "ZU-23-2 (towed, visual)", category: "AAA", maxRangeNm: 1.35, maxAltFt: 6500 },
];

export function findThreatSystem(id: string | undefined): ThreatSystem | undefined {
  return THREAT_SYSTEMS.find((s) => s.id === id);
}
