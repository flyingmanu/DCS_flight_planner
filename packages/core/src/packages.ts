import type { Side } from "./bullseye.js";

export const DEFAULT_PACKAGE_COLOR = "#7c3aed";

/** A COMAO/package grouping multiple flights that operate together, e.g. a strike package. */
export interface Package {
  id: string;
  name: string;
  side?: Side;
  color?: string;
}
