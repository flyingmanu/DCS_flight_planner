import type { PylonSelection } from "./customAircraft.js";
import type { LatLon } from "./geo.js";

export type { PylonSelection } from "./customAircraft.js";

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
  /** References Aircraft.id in the built-in catalog. Mutually exclusive with customAircraftId. */
  aircraftId?: string;
  /** References CustomAircraft.id in the user's saved custom aircraft. Mutually exclusive with aircraftId. */
  customAircraftId?: string;
  /** Display name of the aircraft type, kept in sync with aircraftId/customAircraftId when set. */
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
  /** Per-pylon weapon selection; only meaningful when customAircraftId references an aircraft with pylons. */
  pylonLoadout?: PylonSelection[];
}
