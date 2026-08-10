import type { LatLon } from "./geo.js";

export type TaskType = "CAP" | "STRIKE" | "SEAD" | "ESCORT" | "CAS" | "RECON" | "AEW" | "TANKER" | "TRANSPORT" | "OTHER";

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  CAP: "CAP",
  STRIKE: "Strike",
  SEAD: "SEAD/DEAD",
  ESCORT: "Escort",
  CAS: "CAS",
  RECON: "Recon",
  AEW: "AEW",
  TANKER: "Tanker",
  TRANSPORT: "Transport",
  OTHER: "Other",
};

export const DEFAULT_FLIGHT_COLOR = "#1d4ed8";

export interface PylonSelection {
  /** Matches the aircraft's Pylon.station. */
  station: number;
  /** References Weapon.id in the shared weapon catalog; null/absent means the pylon is empty. */
  weaponId: string | null;
}

export interface Waypoint {
  id: string;
  /** Optional custom label; defaults to "WP{n}" (1-based position in the route) when absent. */
  name?: string;
  position: LatLon;
  altitudeFt?: number;
  airspeedKt?: number;
}

/**
 * A flight/package. Attributes mirror what Combat Flite tracks per flight
 * in its flight editor.
 */
export interface Flight {
  id: string;
  /** Callsign and flight number, e.g. "Enfield 1-1". */
  name: string;
  /** References Aircraft.id in the shared catalog, when picked from it. */
  aircraftId?: string;
  /** Display name of the aircraft type, kept in sync with aircraftId when set. */
  aircraftType: string;
  /** Number of aircraft in the flight. */
  size: number;
  taskType: TaskType;
  /** References Airbase.id in the active theater. */
  departureAirbaseId?: string;
  arrivalAirbaseId?: string;
  alternateAirbaseId?: string;
  /** Local mission time, "HH:MM". */
  takeoffTime?: string;
  tacanChannel?: string;
  radioFrequencyMhz?: string;
  iffMode1?: string;
  iffMode3?: string;
  notes?: string;
  color?: string;
  route?: Waypoint[];
  /** Free-text ordnance/loadout notes, e.g. call-outs not captured by pylonLoadout. */
  loadout?: string;
  /** Per-pylon weapon selection, keyed by station; only meaningful when the aircraft defines pylons. */
  pylonLoadout?: PylonSelection[];
}
