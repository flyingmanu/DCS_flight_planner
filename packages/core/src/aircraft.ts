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
    performance: { maxSpeedKt: 380, serviceCeilingFt: 45000, combatRadiusNm: 250, internalFuelLb: 10700 },
  },
  {
    id: "a-10c-ii",
    name: "A-10C II Tank Killer",
    manufacturer: "Fairchild Republic",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAS", "STRIKE"],
    performance: { maxSpeedKt: 380, serviceCeilingFt: 45000, combatRadiusNm: 250, internalFuelLb: 10700 },
  },
  {
    id: "ajs-37",
    name: "AJS-37 Viggen",
    manufacturer: "Saab",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["STRIKE", "RECON"],
    performance: { maxSpeedKt: 1145, serviceCeilingFt: 59000, combatRadiusNm: 300, internalFuelLb: 10000 },
  },
  {
    id: "av-8b-na",
    name: "AV-8B N/A Harrier II",
    manufacturer: "McDonnell Douglas/BAe",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAS", "STRIKE", "CAP"],
    performance: { maxSpeedKt: 585, serviceCeilingFt: 50000, combatRadiusNm: 300, internalFuelLb: 7500 },
  },
  {
    id: "c-101cc",
    name: "C-101CC Aviojet",
    manufacturer: "CASA",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAS", "OTHER"],
    performance: { maxSpeedKt: 400, serviceCeilingFt: 42000, combatRadiusNm: 300, internalFuelLb: 3700 },
  },
  {
    id: "c-101eb",
    name: "C-101EB Aviojet",
    manufacturer: "CASA",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["OTHER"],
    performance: { maxSpeedKt: 400, serviceCeilingFt: 42000, combatRadiusNm: 300, internalFuelLb: 3700 },
  },
  {
    id: "f-5e-3",
    name: "F-5E Tiger II",
    manufacturer: "Northrop",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "ESCORT"],
    performance: { maxSpeedKt: 917, serviceCeilingFt: 51800, combatRadiusNm: 190, internalFuelLb: 4200 },
  },
  {
    id: "f-14a",
    name: "F-14A Tomcat",
    manufacturer: "Grumman",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "ESCORT", "STRIKE"],
    performance: { maxSpeedKt: 1320, serviceCeilingFt: 53000, combatRadiusNm: 500, internalFuelLb: 16200 },
  },
  {
    id: "f-14b",
    name: "F-14B Tomcat",
    manufacturer: "Grumman",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "ESCORT", "STRIKE"],
    performance: { maxSpeedKt: 1330, serviceCeilingFt: 53000, combatRadiusNm: 500, internalFuelLb: 16200 },
  },
  {
    id: "f-15e",
    name: "F-15E Strike Eagle",
    manufacturer: "McDonnell Douglas/Boeing",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["STRIKE", "CAP", "SEAD"],
    performance: { maxSpeedKt: 1434, serviceCeilingFt: 60000, combatRadiusNm: 790, internalFuelLb: 13455 },
  },
  {
    id: "f-16c",
    name: "F-16C Viper",
    manufacturer: "General Dynamics/Lockheed Martin",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "STRIKE", "SEAD", "CAS"],
    performance: { maxSpeedKt: 1147, serviceCeilingFt: 50000, combatRadiusNm: 340, internalFuelLb: 6972 },
  },
  {
    id: "f-86f",
    name: "F-86F Sabre",
    manufacturer: "North American",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP"],
    performance: { maxSpeedKt: 599, serviceCeilingFt: 49000, combatRadiusNm: 300, internalFuelLb: 1500 },
  },
  {
    id: "fa-18c",
    name: "F/A-18C Hornet",
    manufacturer: "McDonnell Douglas/Boeing",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "STRIKE", "SEAD", "CAS", "ESCORT"],
    performance: { maxSpeedKt: 1030, serviceCeilingFt: 50000, combatRadiusNm: 330, internalFuelLb: 10860 },
  },
  {
    id: "jf-17",
    name: "JF-17 Thunder",
    manufacturer: "PAC/CAC",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "STRIKE", "SEAD", "CAS"],
    performance: { maxSpeedKt: 1000, serviceCeilingFt: 55000, combatRadiusNm: 290, internalFuelLb: 4850 },
  },
  {
    id: "l-39c",
    name: "L-39C Albatros",
    manufacturer: "Aero Vodochody",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["OTHER"],
    performance: { maxSpeedKt: 365, serviceCeilingFt: 37725, combatRadiusNm: 250, internalFuelLb: 2350 },
  },
  {
    id: "l-39za",
    name: "L-39ZA Albatros",
    manufacturer: "Aero Vodochody",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAS", "OTHER"],
    performance: { maxSpeedKt: 365, serviceCeilingFt: 37725, combatRadiusNm: 250, internalFuelLb: 2350 },
  },
  {
    id: "m-2000c",
    name: "M-2000C",
    manufacturer: "Dassault",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "STRIKE", "SEAD"],
    performance: { maxSpeedKt: 1200, serviceCeilingFt: 59000, combatRadiusNm: 300, internalFuelLb: 6500 },
  },
  {
    id: "mb-339a",
    name: "MB-339A",
    manufacturer: "Aermacchi",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAS", "OTHER"],
    performance: { maxSpeedKt: 500, serviceCeilingFt: 47000, combatRadiusNm: 350, internalFuelLb: 2100 },
  },
  {
    id: "mig-15bis",
    name: "MiG-15bis",
    manufacturer: "Mikoyan-Gurevich",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP"],
    performance: { maxSpeedKt: 590, serviceCeilingFt: 50855, combatRadiusNm: 220, internalFuelLb: 2650 },
  },
  {
    id: "mig-19p",
    name: "MiG-19P Farmer",
    manufacturer: "Mikoyan-Gurevich",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP"],
    performance: { maxSpeedKt: 780, serviceCeilingFt: 58725, combatRadiusNm: 140, internalFuelLb: 2650 },
  },
  {
    id: "mig-21bis",
    name: "MiG-21bis",
    manufacturer: "Mikoyan-Gurevich",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "CAS"],
    performance: { maxSpeedKt: 1177, serviceCeilingFt: 57500, combatRadiusNm: 200, internalFuelLb: 4630 },
  },
  {
    id: "mig-29a",
    name: "MiG-29A Fulcrum",
    manufacturer: "Mikoyan",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "SEAD"],
    performance: { maxSpeedKt: 1320, serviceCeilingFt: 59000, combatRadiusNm: 220, internalFuelLb: 8400 },
  },
  {
    id: "mig-29s",
    name: "MiG-29S Fulcrum",
    manufacturer: "Mikoyan",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "SEAD"],
    performance: { maxSpeedKt: 1320, serviceCeilingFt: 59000, combatRadiusNm: 240, internalFuelLb: 8400 },
  },
  {
    id: "mig-29g",
    name: "MiG-29G Fulcrum",
    manufacturer: "Mikoyan",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "STRIKE", "SEAD"],
    performance: { maxSpeedKt: 1320, serviceCeilingFt: 59000, combatRadiusNm: 240, internalFuelLb: 8400 },
  },
  {
    id: "su-25",
    name: "Su-25 Frogfoot",
    manufacturer: "Sukhoi",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAS", "STRIKE"],
    performance: { maxSpeedKt: 526, serviceCeilingFt: 23000, combatRadiusNm: 300, internalFuelLb: 6844 },
  },
  {
    id: "su-25t",
    name: "Su-25T Frogfoot",
    manufacturer: "Sukhoi",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAS", "STRIKE"],
    performance: { maxSpeedKt: 526, serviceCeilingFt: 23000, combatRadiusNm: 300, internalFuelLb: 6844 },
  },
  {
    id: "su-27",
    name: "Su-27 Flanker",
    manufacturer: "Sukhoi",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "ESCORT"],
    performance: { maxSpeedKt: 1320, serviceCeilingFt: 62000, combatRadiusNm: 750, internalFuelLb: 20950 },
  },
  {
    id: "su-33",
    name: "Su-33 Flanker-D",
    manufacturer: "Sukhoi",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "ESCORT"],
    performance: { maxSpeedKt: 1300, serviceCeilingFt: 55000, combatRadiusNm: 690, internalFuelLb: 22000 },
  },
  {
    id: "i-16",
    name: "I-16",
    manufacturer: "Polikarpov",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP"],
    performance: { maxSpeedKt: 275, serviceCeilingFt: 29500, combatRadiusNm: 150, internalFuelLb: 300 },
  },
  {
    id: "spitfire-lf-mk-ix",
    name: "Spitfire LF Mk. IX",
    manufacturer: "Supermarine",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP"],
    performance: { maxSpeedKt: 340, serviceCeilingFt: 43000, combatRadiusNm: 300, internalFuelLb: 600 },
  },
  {
    id: "bf-109k-4",
    name: "Bf 109 K-4",
    manufacturer: "Messerschmitt",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP"],
    performance: { maxSpeedKt: 340, serviceCeilingFt: 41000, combatRadiusNm: 200, internalFuelLb: 500 },
  },
  {
    id: "fw-190d-9",
    name: "Fw 190D-9",
    manufacturer: "Focke-Wulf",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "CAS"],
    performance: { maxSpeedKt: 350, serviceCeilingFt: 39400, combatRadiusNm: 250, internalFuelLb: 600 },
  },
  {
    id: "p-51d",
    name: "P-51D Mustang",
    manufacturer: "North American",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "ESCORT"],
    performance: { maxSpeedKt: 380, serviceCeilingFt: 41900, combatRadiusNm: 400, internalFuelLb: 1180 },
  },
  {
    id: "p-47d",
    name: "P-47D Thunderbolt",
    manufacturer: "Republic",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["CAP", "ESCORT", "CAS"],
    performance: { maxSpeedKt: 350, serviceCeilingFt: 43000, combatRadiusNm: 350, internalFuelLb: 1950 },
  },
  {
    id: "mosquito-fb-vi",
    name: "Mosquito FB Mk. VI",
    manufacturer: "de Havilland",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["STRIKE", "CAS"],
    performance: { maxSpeedKt: 330, serviceCeilingFt: 33000, combatRadiusNm: 350, internalFuelLb: 2200 },
  },
  {
    id: "christen-eagle-ii",
    name: "Christen Eagle II",
    manufacturer: "Aviat Aircraft",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["OTHER"],
    performance: { maxSpeedKt: 130, serviceCeilingFt: 18500, combatRadiusNm: 100, internalFuelLb: 180 },
  },
  {
    id: "yak-52",
    name: "Yak-52",
    manufacturer: "Yakovlev",
    category: "fixed-wing",
    playable: true,
    standardTasks: ["OTHER"],
    performance: { maxSpeedKt: 170, serviceCeilingFt: 13123, combatRadiusNm: 200, internalFuelLb: 250 },
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
    performance: { maxSpeedKt: 150, serviceCeilingFt: 21000, combatRadiusNm: 150, internalFuelLb: 2576 },
  },
  {
    id: "ch-47f",
    name: "CH-47F Chinook",
    manufacturer: "Boeing",
    category: "helicopter",
    playable: true,
    standardTasks: ["TRANSPORT"],
    performance: { maxSpeedKt: 170, serviceCeilingFt: 20000, combatRadiusNm: 200, internalFuelLb: 7000 },
  },
  {
    id: "sa342",
    name: "SA342 Gazelle",
    manufacturer: "Aérospatiale",
    category: "helicopter",
    playable: true,
    standardTasks: ["CAS", "ESCORT", "RECON"],
    performance: { maxSpeedKt: 145, serviceCeilingFt: 15750, combatRadiusNm: 100, internalFuelLb: 980 },
  },
  {
    id: "ka-50",
    name: "Ka-50 Black Shark",
    manufacturer: "Kamov",
    category: "helicopter",
    playable: true,
    standardTasks: ["CAS", "STRIKE"],
    performance: { maxSpeedKt: 180, serviceCeilingFt: 18000, combatRadiusNm: 145, internalFuelLb: 3820 },
  },
  {
    id: "ka-50-iii",
    name: "Ka-50 III Black Shark",
    manufacturer: "Kamov",
    category: "helicopter",
    playable: true,
    standardTasks: ["CAS", "STRIKE"],
    performance: { maxSpeedKt: 180, serviceCeilingFt: 18000, combatRadiusNm: 145, internalFuelLb: 3820 },
  },
  {
    id: "mi-8mtv2",
    name: "Mi-8MTV2 Hip",
    manufacturer: "Mil",
    category: "helicopter",
    playable: true,
    standardTasks: ["TRANSPORT", "OTHER"],
    performance: { maxSpeedKt: 140, serviceCeilingFt: 14760, combatRadiusNm: 200, internalFuelLb: 3550 },
  },
  {
    id: "mi-24p",
    name: "Mi-24P Hind",
    manufacturer: "Mil",
    category: "helicopter",
    playable: true,
    standardTasks: ["CAS", "ESCORT"],
    performance: { maxSpeedKt: 175, serviceCeilingFt: 14750, combatRadiusNm: 100, internalFuelLb: 4400 },
  },
  {
    id: "oh-58d",
    name: "OH-58D Kiowa Warrior",
    manufacturer: "Bell",
    category: "helicopter",
    playable: true,
    standardTasks: ["RECON", "CAS"],
    performance: { maxSpeedKt: 115, serviceCeilingFt: 12000, combatRadiusNm: 80, internalFuelLb: 850 },
  },
  {
    id: "uh-1h",
    name: "UH-1H Huey",
    manufacturer: "Bell",
    category: "helicopter",
    playable: true,
    standardTasks: ["TRANSPORT", "OTHER"],
    performance: { maxSpeedKt: 110, serviceCeilingFt: 12600, combatRadiusNm: 115, internalFuelLb: 1390 },
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
