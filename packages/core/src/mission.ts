import type { Bullseye } from "./bullseye.js";
import type { Flight } from "./flights.js";
import type { MissionObject } from "./objects.js";
import type { Package } from "./packages.js";

export interface MapView {
  center: [number, number];
  zoom: number;
}

/**
 * A named, saveable session tied to a theater: the map view and the
 * mission-specific objects placed on it (points, polygons...).
 */
export interface Mission {
  id: string;
  name: string;
  theaterId: string;
  createdAt: string;
  updatedAt: string;
  view: MapView;
  objects: MissionObject[];
  /** Optional for backward compatibility with missions saved before flights existed. */
  flights?: Flight[];
  /** At most one per side (blue/red/neutral). */
  bullseyes?: Bullseye[];
  /** COMAO/package groupings; flights reference these via Flight.packageId. */
  packages?: Package[];
}
