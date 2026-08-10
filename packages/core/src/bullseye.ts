import type { LatLon } from "./geo.js";

export type Side = "blue" | "red" | "neutral";

export const SIDE_LABEL: Record<Side, string> = { blue: "Blue", red: "Red", neutral: "Neutral" };
export const DEFAULT_BULLSEYE_COLOR: Record<Side, string> = { blue: "#1d4ed8", red: "#c02020", neutral: "#6b7280" };

/** A per-side BRAA reference point: a named position with concentric range rings and bearing spokes. */
export interface Bullseye {
  side: Side;
  position: LatLon;
  color?: string;
  /** Radius of the outermost ring, in NM. */
  outerRingNm: number;
  /** Number of concentric rings, evenly spaced out to outerRingNm. */
  rings: number;
  /** Number of bearing spokes, evenly spaced starting from true north. */
  spokes: number;
  showName?: boolean;
  showRangeLabels?: boolean;
}

export function makeDefaultBullseye(side: Side, position: LatLon): Bullseye {
  return { side, position, outerRingNm: 60, rings: 3, spokes: 4, showName: true, showRangeLabels: true };
}
