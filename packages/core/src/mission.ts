export interface MapView {
  center: [number, number];
  zoom: number;
}

/**
 * A named, saveable session tied to a theater. Currently only carries the
 * map view; future mission-specific content (waypoints, notes, kneeboard
 * items...) will be added here as those features are built.
 */
export interface Mission {
  id: string;
  name: string;
  theaterId: string;
  createdAt: string;
  updatedAt: string;
  view: MapView;
}
