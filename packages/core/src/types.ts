export type AirbaseCategory = "airdrome" | "helipad" | "ship" | "unknown";

export interface GeoPosition {
  lat: number;
  lon: number;
  altM: number;
}

export interface Runway {
  /** e.g. "04/22" */
  id: string;
  /** Both runway-end designators, e.g. [4, 22]. Nominal heading in degrees = designator * 10. */
  designators: [number, number];
  lengthM: number;
  widthM: number;
}

export interface Airbase {
  id: string;
  name: string;
  callsign: string;
  category: AirbaseCategory;
  /**
   * Coalition owning the airbase at export time (0 = neutral, 1 = red, 2 = blue
   * in DCS's convention). Ownership can change during a mission, so this is a
   * snapshot, not a permanent fact.
   */
  initialCoalition: number;
  position: GeoPosition;
  runways: Runway[];
}

export interface Theater {
  id: string;
  name: string;
  airbases: Airbase[];
}
