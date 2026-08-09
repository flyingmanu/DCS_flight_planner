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

/**
 * A flight/package, independent of the route it will eventually fly
 * (waypoints/TOTs are a separate, future piece). Attributes mirror what
 * Combat Flite tracks per flight in its flight editor.
 */
export interface Flight {
  id: string;
  /** Callsign and flight number, e.g. "Enfield 1-1". */
  name: string;
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
}
