import type { TaskType } from "./flights.js";

export type AircraftCategory = "fixed-wing" | "helicopter";

/**
 * Approximate, publicly-known reference performance figures (not derived
 * from DCS's internal flight model). Meant as a starting point for
 * mission-planning calculations (fuel/range/ceiling checks); refine with
 * more precise figures over time. Only populated for playable modules.
 */
export interface AircraftPerformance {
  maxSpeedKt?: number;
  serviceCeilingFt?: number;
  combatRadiusNm?: number;
  internalFuelLb?: number;
  /** Empty (unfueled, unarmed) weight in lb; basis for the loadout weight estimate. */
  emptyWeightLb?: number;
}

/** A weapon station. All pylons on an aircraft share the same compatible-weapons list (a simplification — real DCS station compatibility is more granular per-airframe). */
export interface Pylon {
  /** 1-based station number, cosmetic only. */
  station: number;
  /** References Weapon.id in the shared weapon catalog (see weapons.ts). */
  compatibleWeaponIds: string[];
}

export interface Aircraft {
  id: string;
  name: string;
  manufacturer: string;
  category: AircraftCategory;
  /** True for player-flyable DCS modules; false for AI-only units. */
  playable: boolean;
  /** Typical DCS Mission Editor task types this airframe is normally assigned. */
  standardTasks: TaskType[];
  performance?: AircraftPerformance;
  /** Typical/representative ordnance this airframe can carry (not an exhaustive DCS loadout list). Playable modules only. */
  weapons?: string[];
  /** Selectable weapon stations, for aircraft that carry external ordnance. Playable modules only; internal guns aren't modeled as pylons. */
  pylons?: Pylon[];
}

function pylons(count: number, compatibleWeaponIds: string[]): Pylon[] {
  return Array.from({ length: count }, (_, i) => ({ station: i + 1, compatibleWeaponIds }));
}

// --- Playable modules (fixed-wing) -----------------------------------------

const PLAYABLE_FIXED_WING: Aircraft[] = [
  {
    id: "a-10c",
    name: "A-10C Warthog",
    manufacturer: "Fairchild Republic",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAS", "STRIKE"],
    performance: { maxSpeedKt: 380, serviceCeilingFt: 45000, combatRadiusNm: 250, internalFuelLb: 10700, emptyWeightLb: 29000 },
    weapons: ["GAU-8 30mm gun", "AGM-65 Maverick", "GBU-12/38", "Mk-82/84", "CBU-97/105", "AIM-9M"],
    pylons: pylons(11, ["agm-65", "gbu-12", "gbu-38", "mk-82", "mk-84", "cbu-97", "aim-9", "fuel-tank"]),
  },
  {
    id: "a-10c-ii",
    name: "A-10C II Tank Killer",
    manufacturer: "Fairchild Republic",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAS", "STRIKE"],
    performance: { maxSpeedKt: 380, serviceCeilingFt: 45000, combatRadiusNm: 250, internalFuelLb: 10700, emptyWeightLb: 29000 },
    weapons: ["GAU-8 30mm gun", "AGM-65 Maverick", "GBU-12/38", "Mk-82/84", "CBU-97/105", "AIM-9M", "APKWS"],
    pylons: pylons(11, ["agm-65", "gbu-12", "gbu-38", "mk-82", "mk-84", "cbu-97", "aim-9", "apkws", "fuel-tank"]),
  },
  {
    id: "ajs-37",
    name: "AJS-37 Viggen",
    manufacturer: "Saab",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["STRIKE", "RECON"],
    performance: { maxSpeedKt: 1145, serviceCeilingFt: 59000, combatRadiusNm: 300, internalFuelLb: 10000, emptyWeightLb: 20000 },
    weapons: ["Rb 04 (anti-ship)", "Rb 05", "Rb 75 (Maverick)", "M/70 bombs", "ARAK-M rockets", "30mm ADEN gun pod"],
    pylons: pylons(7, ["rb-04", "rb-05", "rb-75", "m70-bomb", "arak-rocket", "gun-pod", "fuel-tank"]),
  },
  {
    id: "av-8b-na",
    name: "AV-8B N/A Harrier II",
    manufacturer: "McDonnell Douglas/BAe",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAS", "STRIKE", "CAP"],
    performance: { maxSpeedKt: 585, serviceCeilingFt: 50000, combatRadiusNm: 300, internalFuelLb: 7500, emptyWeightLb: 13086 },
    weapons: ["GAU-12 25mm gun", "AGM-65 Maverick", "GBU-12/16/32", "Mk-82/83/84", "CBU-99", "AIM-9", "AIM-120"],
    pylons: pylons(6, ["agm-65", "gbu-12", "gbu-16", "mk-82", "mk-83", "mk-84", "cbu-99", "aim-9", "aim-120", "fuel-tank"]),
  },
  {
    id: "c-101cc",
    name: "C-101CC Aviojet",
    manufacturer: "CASA",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAS", "OTHER"],
    performance: { maxSpeedKt: 400, serviceCeilingFt: 42000, combatRadiusNm: 300, internalFuelLb: 3700, emptyWeightLb: 7815 },
    weapons: ["Mk-82 bombs", "unguided rocket pods", "12.7mm gun pod"],
    pylons: pylons(3, ["mk-82", "rocket-pod", "gun-pod"]),
  },
  {
    id: "c-101eb",
    name: "C-101EB Aviojet",
    manufacturer: "CASA",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["OTHER"],
    performance: { maxSpeedKt: 400, serviceCeilingFt: 42000, combatRadiusNm: 300, internalFuelLb: 3700, emptyWeightLb: 7815 },
    weapons: ["training loadout only (no combat armament)"],
  },
  {
    id: "f-5e-3",
    name: "F-5E Tiger II",
    manufacturer: "Northrop",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "ESCORT"],
    performance: { maxSpeedKt: 917, serviceCeilingFt: 51800, combatRadiusNm: 190, internalFuelLb: 4200, emptyWeightLb: 9558 },
    weapons: ["M39 20mm cannon", "AIM-9 Sidewinder", "Mk-82 bombs", "unguided rocket pods"],
    pylons: pylons(5, ["aim-9", "mk-82", "rocket-pod", "fuel-tank"]),
  },
  {
    id: "f-14a",
    name: "F-14A Tomcat",
    manufacturer: "Grumman",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "ESCORT", "STRIKE"],
    performance: { maxSpeedKt: 1320, serviceCeilingFt: 53000, combatRadiusNm: 500, internalFuelLb: 16200, emptyWeightLb: 43735 },
    weapons: ["M61 Vulcan 20mm", "AIM-54 Phoenix", "AIM-7 Sparrow", "AIM-9 Sidewinder", "Mk-82/84", "GBU-12/16"],
    pylons: pylons(6, ["aim-54", "aim-7", "aim-9", "mk-82", "mk-84", "gbu-12", "gbu-16", "fuel-tank"]),
  },
  {
    id: "f-14b",
    name: "F-14B Tomcat",
    manufacturer: "Grumman",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "ESCORT", "STRIKE"],
    performance: { maxSpeedKt: 1330, serviceCeilingFt: 53000, combatRadiusNm: 500, internalFuelLb: 16200, emptyWeightLb: 43735 },
    weapons: ["M61 Vulcan 20mm", "AIM-54 Phoenix", "AIM-7 Sparrow", "AIM-9 Sidewinder", "Mk-82/84", "GBU-12/16/24"],
    pylons: pylons(6, ["aim-54", "aim-7", "aim-9", "mk-82", "mk-84", "gbu-12", "gbu-16", "gbu-24", "fuel-tank"]),
  },
  {
    id: "f-15e",
    name: "F-15E Strike Eagle",
    manufacturer: "McDonnell Douglas/Boeing",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["STRIKE", "CAP", "SEAD"],
    performance: { maxSpeedKt: 1434, serviceCeilingFt: 60000, combatRadiusNm: 790, internalFuelLb: 13455, emptyWeightLb: 31700 },
    weapons: ["M61 Vulcan 20mm", "AIM-120 AMRAAM", "AIM-9", "AGM-65", "AGM-88 HARM", "GBU-10/12/24/31"],
    pylons: pylons(9, ["aim-120", "aim-9", "agm-65", "agm-88", "gbu-10", "gbu-12", "gbu-24", "gbu-31", "fuel-tank"]),
  },
  {
    id: "f-16c",
    name: "F-16C Viper",
    manufacturer: "General Dynamics/Lockheed Martin",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "STRIKE", "SEAD", "CAS"],
    performance: { maxSpeedKt: 1147, serviceCeilingFt: 50000, combatRadiusNm: 340, internalFuelLb: 6972, emptyWeightLb: 20300 },
    weapons: ["M61 Vulcan 20mm", "AIM-120 AMRAAM", "AIM-9", "AGM-65 Maverick", "AGM-88 HARM", "GBU-12/31/38", "CBU-97"],
    pylons: pylons(9, ["aim-120", "aim-9", "agm-65", "agm-88", "gbu-12", "gbu-31", "gbu-38", "cbu-97", "fuel-tank"]),
  },
  {
    id: "f-86f",
    name: "F-86F Sabre",
    manufacturer: "North American",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP"],
    performance: { maxSpeedKt: 599, serviceCeilingFt: 49000, combatRadiusNm: 300, internalFuelLb: 1500, emptyWeightLb: 11125 },
    weapons: ["M3 .50cal machine guns", "AIM-9B Sidewinder (late)", "unguided bombs"],
    pylons: pylons(2, ["aim-9", "bomb-light"]),
  },
  {
    id: "fa-18c",
    name: "F/A-18C Hornet",
    manufacturer: "McDonnell Douglas/Boeing",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "STRIKE", "SEAD", "CAS", "ESCORT"],
    performance: { maxSpeedKt: 1030, serviceCeilingFt: 50000, combatRadiusNm: 330, internalFuelLb: 10860, emptyWeightLb: 23000 },
    weapons: ["M61 Vulcan 20mm", "AIM-120", "AIM-9", "AIM-7", "AGM-65", "AGM-88 HARM", "AGM-84 Harpoon", "JDAM (GBU-31/38)", "GBU-12/16/24"],
    pylons: pylons(9, ["aim-120", "aim-9", "aim-7", "agm-65", "agm-88", "agm-84", "gbu-12", "gbu-16", "gbu-24", "gbu-31", "gbu-38", "fuel-tank"]),
  },
  {
    id: "jf-17",
    name: "JF-17 Thunder",
    manufacturer: "PAC/CAC",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "STRIKE", "SEAD", "CAS"],
    performance: { maxSpeedKt: 1000, serviceCeilingFt: 55000, combatRadiusNm: 290, internalFuelLb: 4850, emptyWeightLb: 15716 },
    weapons: ["GSh-23-2 23mm gun", "PL-5/PL-12 AAM", "LS/LT-series guided bombs", "unguided bombs"],
    pylons: pylons(7, ["pl-5", "pl-12", "ls-lt-bomb", "mk-82", "fuel-tank"]),
  },
  {
    id: "l-39c",
    name: "L-39C Albatros",
    manufacturer: "Aero Vodochody",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["OTHER"],
    performance: { maxSpeedKt: 365, serviceCeilingFt: 37725, combatRadiusNm: 250, internalFuelLb: 2350, emptyWeightLb: 7770 },
    weapons: ["training loadout only (no combat armament)"],
  },
  {
    id: "l-39za",
    name: "L-39ZA Albatros",
    manufacturer: "Aero Vodochody",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAS", "OTHER"],
    performance: { maxSpeedKt: 365, serviceCeilingFt: 37725, combatRadiusNm: 250, internalFuelLb: 2350, emptyWeightLb: 7826 },
    weapons: ["GSh-23 23mm gun pod", "unguided bombs", "unguided rocket pods"],
    pylons: pylons(4, ["gun-pod", "mk-82", "rocket-pod"]),
  },
  {
    id: "m-2000c",
    name: "M-2000C",
    manufacturer: "Dassault",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "STRIKE", "SEAD"],
    performance: { maxSpeedKt: 1200, serviceCeilingFt: 59000, combatRadiusNm: 300, internalFuelLb: 6500, emptyWeightLb: 16755 },
    weapons: ["2x DEFA 30mm cannon", "Magic II", "Super 530D", "Mk-82 bombs", "laser-guided bomb pod"],
    pylons: pylons(5, ["magic-2", "super-530d", "mk-82", "gbu-12", "fuel-tank"]),
  },
  {
    id: "mb-339a",
    name: "MB-339A",
    manufacturer: "Aermacchi",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAS", "OTHER"],
    performance: { maxSpeedKt: 500, serviceCeilingFt: 47000, combatRadiusNm: 350, internalFuelLb: 2100, emptyWeightLb: 7473 },
    weapons: ["Mk-82 bombs", "unguided rocket pods", "gun pods"],
    pylons: pylons(6, ["mk-82", "rocket-pod", "gun-pod"]),
  },
  {
    id: "mig-15bis",
    name: "MiG-15bis",
    manufacturer: "Mikoyan-Gurevich",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP"],
    performance: { maxSpeedKt: 590, serviceCeilingFt: 50855, combatRadiusNm: 220, internalFuelLb: 2650, emptyWeightLb: 8646 },
    weapons: ["N-37 37mm cannon", "2x NS-23 23mm cannon", "unguided bombs"],
    pylons: pylons(2, ["bomb-light"]),
  },
  {
    id: "mig-19p",
    name: "MiG-19P Farmer",
    manufacturer: "Mikoyan-Gurevich",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP"],
    performance: { maxSpeedKt: 780, serviceCeilingFt: 58725, combatRadiusNm: 140, internalFuelLb: 2650, emptyWeightLb: 12698 },
    weapons: ["NR-30 30mm cannons", "unguided rockets"],
    pylons: pylons(4, ["rocket-light"]),
  },
  {
    id: "mig-21bis",
    name: "MiG-21bis",
    manufacturer: "Mikoyan-Gurevich",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "CAS"],
    performance: { maxSpeedKt: 1177, serviceCeilingFt: 57500, combatRadiusNm: 200, internalFuelLb: 4630, emptyWeightLb: 12882 },
    weapons: ["GSh-23L 23mm gun", "R-3S/R-13M/R-60 AAM", "unguided bombs", "unguided rockets"],
    pylons: pylons(4, ["r-3s", "r-60", "mk-82", "rocket-pod"]),
  },
  {
    id: "mig-29a",
    name: "MiG-29A Fulcrum",
    manufacturer: "Mikoyan",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "SEAD"],
    performance: { maxSpeedKt: 1320, serviceCeilingFt: 59000, combatRadiusNm: 220, internalFuelLb: 8400, emptyWeightLb: 24030 },
    weapons: ["GSh-30-1 30mm gun", "R-27", "R-73", "R-60", "unguided bombs/rockets"],
    pylons: pylons(6, ["r-27", "r-73", "r-60", "mk-82", "rocket-pod"]),
  },
  {
    id: "mig-29s",
    name: "MiG-29S Fulcrum",
    manufacturer: "Mikoyan",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "SEAD"],
    performance: { maxSpeedKt: 1320, serviceCeilingFt: 59000, combatRadiusNm: 240, internalFuelLb: 8400, emptyWeightLb: 24030 },
    weapons: ["GSh-30-1 30mm gun", "R-27", "R-73", "R-60", "unguided bombs/rockets"],
    pylons: pylons(6, ["r-27", "r-73", "r-60", "mk-82", "rocket-pod"]),
  },
  {
    id: "mig-29g",
    name: "MiG-29G Fulcrum",
    manufacturer: "Mikoyan",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "STRIKE", "SEAD"],
    performance: { maxSpeedKt: 1320, serviceCeilingFt: 59000, combatRadiusNm: 240, internalFuelLb: 8400, emptyWeightLb: 24030 },
    weapons: ["GSh-30-1 30mm gun", "R-27", "R-73", "R-60", "Kh-25/Kh-29", "guided bombs"],
    pylons: pylons(6, ["r-27", "r-73", "r-60", "kh-25", "mk-82", "gbu-12"]),
  },
  {
    id: "su-25",
    name: "Su-25 Frogfoot",
    manufacturer: "Sukhoi",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAS", "STRIKE"],
    performance: { maxSpeedKt: 526, serviceCeilingFt: 23000, combatRadiusNm: 300, internalFuelLb: 6844, emptyWeightLb: 21605 },
    weapons: ["GSh-30-2 30mm gun", "S-8/S-13/S-24/S-25 rockets", "FAB bombs", "R-60 AAM"],
    pylons: pylons(8, ["rocket-pod", "s-24", "fab-250", "fab-500", "r-60"]),
  },
  {
    id: "su-25t",
    name: "Su-25T Frogfoot",
    manufacturer: "Sukhoi",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAS", "STRIKE"],
    performance: { maxSpeedKt: 526, serviceCeilingFt: 23000, combatRadiusNm: 300, internalFuelLb: 6844, emptyWeightLb: 21605 },
    weapons: ["GSh-30-2 30mm gun", "Kh-25ML", "Kh-29L", "S-8/S-13 rockets", "FAB bombs", "R-60 AAM"],
    pylons: pylons(8, ["kh-25", "kh-29", "rocket-pod", "s-24", "fab-250", "fab-500", "r-60"]),
  },
  {
    id: "su-27",
    name: "Su-27 Flanker",
    manufacturer: "Sukhoi",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "ESCORT"],
    performance: { maxSpeedKt: 1320, serviceCeilingFt: 62000, combatRadiusNm: 750, internalFuelLb: 20950, emptyWeightLb: 40785 },
    weapons: ["GSh-30-1 30mm gun", "R-27", "R-73", "R-60", "unguided bombs/rockets"],
    pylons: pylons(10, ["r-27", "r-73", "r-60", "rocket-pod", "fab-250"]),
  },
  {
    id: "su-33",
    name: "Su-33 Flanker-D",
    manufacturer: "Sukhoi",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "ESCORT"],
    performance: { maxSpeedKt: 1300, serviceCeilingFt: 55000, combatRadiusNm: 690, internalFuelLb: 22000, emptyWeightLb: 44090 },
    weapons: ["GSh-30-1 30mm gun", "R-27", "R-73", "R-60", "unguided bombs/rockets"],
    pylons: pylons(10, ["r-27", "r-73", "r-60", "rocket-pod", "fab-250"]),
  },
  {
    id: "i-16",
    name: "I-16",
    manufacturer: "Polikarpov",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP"],
    performance: { maxSpeedKt: 275, serviceCeilingFt: 29500, combatRadiusNm: 150, internalFuelLb: 300, emptyWeightLb: 3285 },
    weapons: ["ShKAS machine guns", "unguided rockets (RS-82, some variants)"],
    pylons: pylons(4, ["rocket-light"]),
  },
  {
    id: "spitfire-lf-mk-ix",
    name: "Spitfire LF Mk. IX",
    manufacturer: "Supermarine",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP"],
    performance: { maxSpeedKt: 340, serviceCeilingFt: 43000, combatRadiusNm: 300, internalFuelLb: 600, emptyWeightLb: 5610 },
    weapons: ["2x 20mm Hispano cannon", "2x .303 machine guns"],
  },
  {
    id: "bf-109k-4",
    name: "Bf 109 K-4",
    manufacturer: "Messerschmitt",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP"],
    performance: { maxSpeedKt: 340, serviceCeilingFt: 41000, combatRadiusNm: 200, internalFuelLb: 500, emptyWeightLb: 6180 },
    weapons: ["MK 108 30mm cannon", "2x MG 131 machine guns"],
  },
  {
    id: "fw-190d-9",
    name: "Fw 190D-9",
    manufacturer: "Focke-Wulf",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "CAS"],
    performance: { maxSpeedKt: 350, serviceCeilingFt: 39400, combatRadiusNm: 250, internalFuelLb: 600, emptyWeightLb: 7700 },
    weapons: ["2x MG 151 20mm cannon", "2x MG 131 machine guns", "unguided bombs"],
    pylons: pylons(2, ["bomb-light"]),
  },
  {
    id: "p-51d",
    name: "P-51D Mustang",
    manufacturer: "North American",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "ESCORT"],
    performance: { maxSpeedKt: 380, serviceCeilingFt: 41900, combatRadiusNm: 400, internalFuelLb: 1180, emptyWeightLb: 7635 },
    weapons: ["6x .50cal machine guns", "unguided bombs", "unguided rockets"],
    pylons: pylons(4, ["bomb-light", "rocket-light", "fuel-tank"]),
  },
  {
    id: "p-47d",
    name: "P-47D Thunderbolt",
    manufacturer: "Republic",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "ESCORT", "CAS"],
    performance: { maxSpeedKt: 350, serviceCeilingFt: 43000, combatRadiusNm: 350, internalFuelLb: 1950, emptyWeightLb: 10000 },
    weapons: ["8x .50cal machine guns", "unguided bombs", "unguided rockets"],
    pylons: pylons(6, ["bomb-light", "rocket-light", "fuel-tank"]),
  },
  {
    id: "mosquito-fb-vi",
    name: "Mosquito FB Mk. VI",
    manufacturer: "de Havilland",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["STRIKE", "CAS"],
    performance: { maxSpeedKt: 330, serviceCeilingFt: 33000, combatRadiusNm: 350, internalFuelLb: 2200, emptyWeightLb: 14300 },
    weapons: ["4x 20mm Hispano cannon", "4x .303 machine guns", "unguided bombs", "unguided rockets"],
    pylons: pylons(4, ["bomb-light", "rocket-light"]),
  },
  {
    id: "christen-eagle-ii",
    name: "Christen Eagle II",
    manufacturer: "Aviat Aircraft",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["OTHER"],
    performance: { maxSpeedKt: 130, serviceCeilingFt: 18500, combatRadiusNm: 100, internalFuelLb: 180, emptyWeightLb: 1150 },
    weapons: ["none (aerobatic trainer)"],
  },
  {
    id: "yak-52",
    name: "Yak-52",
    manufacturer: "Yakovlev",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["OTHER"],
    performance: { maxSpeedKt: 170, serviceCeilingFt: 13123, combatRadiusNm: 200, internalFuelLb: 250, emptyWeightLb: 2160 },
    weapons: ["none (trainer)"],
  },
];

// --- Playable modules (helicopters) -----------------------------------------

const PLAYABLE_HELICOPTERS: Aircraft[] = [
  {
    id: "ah-64d",
    name: "AH-64D Apache",
    manufacturer: "Boeing",
    category: "helicopter",
    playable: true,
    standardTasks: ["CAS", "STRIKE"],
    performance: { maxSpeedKt: 150, serviceCeilingFt: 21000, combatRadiusNm: 150, internalFuelLb: 2576, emptyWeightLb: 11800 },
    weapons: ["M230 30mm chain gun", "AGM-114 Hellfire", "Hydra 70 rockets"],
    pylons: pylons(4, ["agm-114", "rocket-pod"]),
  },
  {
    id: "ch-47f",
    name: "CH-47F Chinook",
    manufacturer: "Boeing",
    category: "helicopter",
    playable: true,
    standardTasks: ["TRANSPORT"],
    performance: { maxSpeedKt: 170, serviceCeilingFt: 20000, combatRadiusNm: 200, internalFuelLb: 7000, emptyWeightLb: 24500 },
    weapons: ["door-mounted M240 machine guns (defensive)"],
  },
  {
    id: "sa342",
    name: "SA342 Gazelle",
    manufacturer: "Aérospatiale",
    category: "helicopter",
    playable: true,
    standardTasks: ["CAS", "ESCORT", "RECON"],
    performance: { maxSpeedKt: 145, serviceCeilingFt: 15750, combatRadiusNm: 100, internalFuelLb: 980, emptyWeightLb: 2085 },
    weapons: ["HOT ATGM", "unguided rocket pods", "20mm cannon pod (Gazelle L)"],
    pylons: pylons(4, ["hot", "rocket-pod", "gun-pod"]),
  },
  {
    id: "ka-50",
    name: "Ka-50 Black Shark",
    manufacturer: "Kamov",
    category: "helicopter",
    playable: true,
    standardTasks: ["CAS", "STRIKE"],
    performance: { maxSpeedKt: 180, serviceCeilingFt: 18000, combatRadiusNm: 145, internalFuelLb: 3820, emptyWeightLb: 15653 },
    weapons: ["2A42 30mm cannon", "9K121 Vikhr ATGM", "S-8/S-13 rockets", "R-73 (self-defense)"],
    pylons: pylons(4, ["vikhr", "rocket-pod", "r-73"]),
  },
  {
    id: "ka-50-iii",
    name: "Ka-50 III Black Shark",
    manufacturer: "Kamov",
    category: "helicopter",
    playable: true,
    standardTasks: ["CAS", "STRIKE"],
    performance: { maxSpeedKt: 180, serviceCeilingFt: 18000, combatRadiusNm: 145, internalFuelLb: 3820, emptyWeightLb: 15653 },
    weapons: ["2A42 30mm cannon", "9K121 Vikhr ATGM", "S-8/S-13 rockets", "R-73 (self-defense)"],
    pylons: pylons(4, ["vikhr", "rocket-pod", "r-73"]),
  },
  {
    id: "mi-8mtv2",
    name: "Mi-8MTV2 Hip",
    manufacturer: "Mil",
    category: "helicopter",
    playable: true,
    standardTasks: ["TRANSPORT", "OTHER"],
    performance: { maxSpeedKt: 140, serviceCeilingFt: 14760, combatRadiusNm: 200, internalFuelLb: 3550, emptyWeightLb: 16500 },
    weapons: ["door-gunner machine guns", "S-8 rockets", "unguided bombs"],
    pylons: pylons(6, ["rocket-pod", "bomb-light"]),
  },
  {
    id: "mi-24p",
    name: "Mi-24P Hind",
    manufacturer: "Mil",
    category: "helicopter",
    playable: true,
    standardTasks: ["CAS", "ESCORT"],
    performance: { maxSpeedKt: 175, serviceCeilingFt: 14750, combatRadiusNm: 100, internalFuelLb: 4400, emptyWeightLb: 18400 },
    weapons: ["GSh-30-2 30mm gun", "9M17 Skorpion/9M114 Shturm ATGM", "S-8/S-24 rockets", "unguided bombs"],
    pylons: pylons(6, ["shturm", "rocket-pod", "s-24", "bomb-light"]),
  },
  {
    id: "oh-58d",
    name: "OH-58D Kiowa Warrior",
    manufacturer: "Bell",
    category: "helicopter",
    playable: true,
    standardTasks: ["RECON", "CAS"],
    performance: { maxSpeedKt: 115, serviceCeilingFt: 12000, combatRadiusNm: 80, internalFuelLb: 850, emptyWeightLb: 3106 },
    weapons: [".50cal machine gun pod", "Hydra 70 rockets", "AGM-114 Hellfire", "FIM-92 Stinger"],
    pylons: pylons(2, ["agm-114", "rocket-pod", "stinger-air", "gun-pod"]),
  },
  {
    id: "uh-1h",
    name: "UH-1H Huey",
    manufacturer: "Bell",
    category: "helicopter",
    playable: true,
    standardTasks: ["TRANSPORT", "OTHER"],
    performance: { maxSpeedKt: 110, serviceCeilingFt: 12600, combatRadiusNm: 115, internalFuelLb: 1390, emptyWeightLb: 5215 },
    weapons: ["door-gunner M60/M134 machine guns", "unguided rocket pods (optional)"],
    pylons: pylons(2, ["rocket-pod"]),
  },
];

// --- AI-only aircraft (a curated starting set, not exhaustive) -------------

function ai(name: string, manufacturer: string, category: AircraftCategory, standardTasks: TaskType[]): Aircraft {
  return { id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), name, manufacturer, category, playable: false, standardTasks };
}

const AI_AIRCRAFT: Aircraft[] = [
  // Bombers
  ai("B-1B Lancer", "Rockwell", "fixed-wing", ["STRIKE"]),
  ai("B-52H Stratofortress", "Boeing", "fixed-wing", ["STRIKE"]),
  ai("Tu-22M3 Backfire", "Tupolev", "fixed-wing", ["STRIKE"]),
  ai("Tu-95MS Bear", "Tupolev", "fixed-wing", ["STRIKE"]),
  ai("Tu-160 Blackjack", "Tupolev", "fixed-wing", ["STRIKE"]),
  // Tankers
  ai("KC-135 Stratotanker", "Boeing", "fixed-wing", ["TANKER"]),
  ai("KC130 Hercules", "Lockheed", "fixed-wing", ["TANKER"]),
  ai("IL-78M Midas", "Ilyushin", "fixed-wing", ["TANKER"]),
  ai("S-3B Viking Tanker", "Lockheed", "fixed-wing", ["TANKER"]),
  // AWACS
  ai("E-3A Sentry", "Boeing", "fixed-wing", ["AEW"]),
  ai("E-2C Hawkeye", "Grumman", "fixed-wing", ["AEW"]),
  ai("A-50 Mainstay", "Beriev", "fixed-wing", ["AEW"]),
  // Transports
  ai("C-130 Hercules", "Lockheed", "fixed-wing", ["TRANSPORT"]),
  ai("C-17A Globemaster III", "Boeing", "fixed-wing", ["TRANSPORT"]),
  ai("IL-76MD Candid", "Ilyushin", "fixed-wing", ["TRANSPORT"]),
  ai("An-26B Curl", "Antonov", "fixed-wing", ["TRANSPORT"]),
  ai("An-30M Clank", "Antonov", "fixed-wing", ["RECON"]),
  // Red fighters/attackers (AI)
  ai("MiG-23MLD Flogger", "Mikoyan-Gurevich", "fixed-wing", ["CAP"]),
  ai("MiG-25PD Foxbat", "Mikoyan-Gurevich", "fixed-wing", ["CAP"]),
  ai("MiG-27K Flogger", "Mikoyan-Gurevich", "fixed-wing", ["STRIKE"]),
  ai("MiG-31 Foxhound", "Mikoyan-Gurevich", "fixed-wing", ["CAP"]),
  ai("Su-24M Fencer", "Sukhoi", "fixed-wing", ["STRIKE"]),
  ai("Su-24MR Fencer", "Sukhoi", "fixed-wing", ["RECON"]),
  ai("Su-30 Flanker-C", "Sukhoi", "fixed-wing", ["CAP", "STRIKE"]),
  ai("Su-34 Fullback", "Sukhoi", "fixed-wing", ["STRIKE", "SEAD"]),
  ai("Su-35S Flanker-E", "Sukhoi", "fixed-wing", ["CAP"]),
  ai("J-11A Flanker", "Shenyang", "fixed-wing", ["CAP"]),
  // Blue fighters/attackers (AI)
  ai("F-4E Phantom II", "McDonnell Douglas", "fixed-wing", ["CAP", "STRIKE"]),
  ai("F-15C Eagle", "McDonnell Douglas/Boeing", "fixed-wing", ["CAP"]),
  ai("F-16A Fighting Falcon", "General Dynamics", "fixed-wing", ["CAP", "STRIKE"]),
  ai("F-22A Raptor", "Lockheed Martin", "fixed-wing", ["CAP"]),
  ai("F-117A Nighthawk", "Lockheed", "fixed-wing", ["STRIKE"]),
  ai("Mirage 2000-5", "Dassault", "fixed-wing", ["CAP"]),
  ai("Mirage F1", "Dassault", "fixed-wing", ["CAP", "STRIKE"]),
  ai("Tornado GR4", "Panavia", "fixed-wing", ["STRIKE", "SEAD"]),
  ai("Tornado IDS", "Panavia", "fixed-wing", ["STRIKE"]),
  ai("JAS39 Gripen", "Saab", "fixed-wing", ["CAP", "STRIKE"]),
  // Recon / UAV
  ai("RQ-1A Predator", "General Atomics", "fixed-wing", ["RECON"]),
  ai("MQ-9 Reaper", "General Atomics", "fixed-wing", ["RECON", "STRIKE"]),
  // Helicopters (AI)
  ai("Mi-28N Havoc", "Rostvertol", "helicopter", ["CAS"]),
  ai("Ka-27 Helix", "Kamov", "helicopter", ["TRANSPORT"]),
  ai("CH-53E Super Stallion", "Sikorsky", "helicopter", ["TRANSPORT"]),
  ai("UH-60A Black Hawk", "Sikorsky", "helicopter", ["TRANSPORT"]),
];

export const AIRCRAFT_CATALOG: Aircraft[] = [...PLAYABLE_FIXED_WING, ...PLAYABLE_HELICOPTERS, ...AI_AIRCRAFT];

export function findAircraft(id: string | undefined): Aircraft | undefined {
  return id ? AIRCRAFT_CATALOG.find((a) => a.id === id) : undefined;
}
