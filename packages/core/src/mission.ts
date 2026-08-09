import type { MissionObject } from "./objects.js";

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
}
